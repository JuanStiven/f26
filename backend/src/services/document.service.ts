import prisma from '../models/prisma';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

export async function getAllDocuments() {
  const docs = await prisma.signedDocument.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true, storagePath: true, description: true, fields: true } },
      filledBy: { select: { name: true, document: true } },
    },
  });

  return docs.map(doc => ({
    ...doc,
    template: doc.templateSnapshot ? doc.templateSnapshot : doc.template,
    templateSnapshot: undefined
  }));
}

export async function getDocumentsByUserId(userId: string) {
  const docs = await prisma.signedDocument.findMany({
    where: { filledById: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true, description: true, fields: true } }
    },
  });

  return docs.map(doc => ({
    ...doc,
    template: doc.templateSnapshot ? doc.templateSnapshot : doc.template,
    templateSnapshot: undefined // Hide it from response to avoid duplication
  }));
}

export async function getDocumentById(id: string) {
  const doc = await prisma.signedDocument.findUnique({
    where: { id },
    include: {
      template: true,
      filledBy: { select: { name: true, document: true, position: true } },
    },
  });

  if (!doc) {
    throw { status: 404, message: 'Documento no encontrado.' };
  }

  return {
    ...doc,
    template: doc.templateSnapshot ? doc.templateSnapshot : doc.template,
    templateSnapshot: undefined
  };
}

export async function createDocument(data: {
  templateId: string;
  filledById: string;
  formData: any;
  photoUrl?: string;
  signatureUrl?: string;
}) {
  // Verificar que la plantilla existe
  const template = await prisma.template.findUnique({ where: { id: data.templateId } });
  if (!template) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  // Verificar que el empleado existe
  const user = await prisma.user.findUnique({ where: { id: data.filledById } });
  if (!user) {
    throw { status: 404, message: 'Empleado no encontrado.' };
  }

  // Construir ruta de archivo en el servidor
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const storagePath = template.storagePath || 'general';
  const folderPath = path.join(uploadsDir, storagePath);

  // Crear directorio si no existe
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Nombre del archivo: Template_Empleado_Timestamp
  const sanitizedName = template.name.replace(/\s+/g, '_');
  const sanitizedUser = user.name.replace(/\s+/g, '_');
  const timestamp = Date.now();
  const baseFileName = `${sanitizedName}_${sanitizedUser}_${timestamp}`;
  const jsonFileName = `${baseFileName}.json`;
  const pdfFileName = `${baseFileName}.pdf`;
  const filePath = path.join(storagePath, pdfFileName);

  // Guardar los datos del formulario en disco
  const fullJsonPath = path.join(folderPath, jsonFileName);
  fs.writeFileSync(fullJsonPath, JSON.stringify({
    templateId: template.id,
    templateName: template.name,
    filledBy: user.name,
    filledByDoc: user.document,
    data: data.formData,
    photoUrl: data.photoUrl,
    signatureUrl: data.signatureUrl,
    submittedAt: new Date().toISOString(),
  }, null, 2));

  // Generar y guardar el PDF
  const fullPdfPath = path.join(folderPath, pdfFileName);
  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  doc.pipe(fs.createWriteStream(fullPdfPath));
  
  // ─── CONFIGURACIÓN DE ESTILOS ───
  const companySettings = await prisma.companySettings.findFirst();
  const titleColor = companySettings?.pdfTitleColor || '#004F9F';
  const subtitleColor = companySettings?.pdfSubtitleColor || '#004F9F';
  const titleFontSize = companySettings?.pdfTitleFontSize || 16;
  const subtitleFontSize = companySettings?.pdfSubtitleFontSize || 12;
  const paragraphFontSize = companySettings?.pdfParagraphFontSize || 11;

  // ─── CABECERA DEL DOCUMENTO ───
  const headerTop = 50;
  
  if (template.isQualityDocument) {
    // FORMATO DE CALIDAD (Tabla)
    const tableTop = headerTop;
    const col1Width = 120;
    const col3Width = 140;
    const col2Width = doc.page.width - 100 - col1Width - col3Width;
    
    // Draw table borders
    const tableHeight = 60;
    doc.lineWidth(1).strokeColor('#000000');
    // Outer border
    doc.rect(50, tableTop, doc.page.width - 100, tableHeight).stroke();
    // Vertical lines
    doc.moveTo(50 + col1Width, tableTop).lineTo(50 + col1Width, tableTop + tableHeight).stroke();
    doc.moveTo(50 + col1Width + col2Width, tableTop).lineTo(50 + col1Width + col2Width, tableTop + tableHeight).stroke();
    
    // Col 2 horizontal line (middle)
    doc.moveTo(50 + col1Width, tableTop + tableHeight / 2).lineTo(50 + col1Width + col2Width, tableTop + tableHeight / 2).stroke();
    
    // Col 3 horizontal lines (thirds)
    doc.moveTo(50 + col1Width + col2Width, tableTop + tableHeight / 3).lineTo(doc.page.width - 50, tableTop + tableHeight / 3).stroke();
    doc.moveTo(50 + col1Width + col2Width, tableTop + (tableHeight / 3) * 2).lineTo(doc.page.width - 50, tableTop + (tableHeight / 3) * 2).stroke();
    
    // Col 3 vertical separator
    doc.moveTo(50 + col1Width + col2Width + 60, tableTop).lineTo(50 + col1Width + col2Width + 60, tableTop + tableHeight).stroke();

    // Col 1: Logo
    if (companySettings?.logoUrl) {
      try {
        const base64Data = companySettings.logoUrl.replace(/^data:image\/\w+;base64,/, "");
        const logoBuffer = Buffer.from(base64Data, 'base64');
        const logoW = companySettings.pdfLogoWidth || 110;
        const logoH = companySettings.pdfLogoHeight || 50;
        doc.image(logoBuffer, 55, tableTop + 5, { width: logoW, height: logoH, fit: [logoW, logoH] });
      } catch(e) {
        console.error('Error adding logo to PDF:', e);
      }
    }

    // Col 2: Texts
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text("EMPRESA SOCIAL DEL ESTADO NORTE 3 - E.S.E.", 50 + col1Width, tableTop + 10, { width: col2Width, align: 'center' });
    
    doc.fontSize(11);
    doc.text(template.name.toUpperCase(), 50 + col1Width, tableTop + 40, { width: col2Width, align: 'center' });

    // Col 3: Data
    doc.fontSize(8);
    doc.text("CÓDIGO", 50 + col1Width + col2Width + 5, tableTop + 7, { width: 50, align: 'left' });
    doc.text(template.qualityCode || '', 50 + col1Width + col2Width + 65, tableTop + 7, { width: 70, align: 'center' });

    doc.text("VERSIÓN", 50 + col1Width + col2Width + 5, tableTop + 27, { width: 50, align: 'left' });
    doc.text(template.qualityVersion || '', 50 + col1Width + col2Width + 65, tableTop + 27, { width: 70, align: 'center' });

    doc.text("FECHA", 50 + col1Width + col2Width + 5, tableTop + 47, { width: 50, align: 'left' });
    doc.text(template.qualityDate || '', 50 + col1Width + col2Width + 65, tableTop + 47, { width: 70, align: 'center' });

    doc.y = tableTop + tableHeight + 20;
    doc.x = 50;

  } else {
    // FORMATO LIBRE (Clásico)
    if (companySettings?.logoUrl) {
      try {
        const base64Data = companySettings.logoUrl.replace(/^data:image\/\w+;base64,/, "");
        const logoBuffer = Buffer.from(base64Data, 'base64');
        const logoW = companySettings.pdfLogoWidth || 100;
        const logoH = companySettings.pdfLogoHeight || 100;
        doc.image(logoBuffer, 50, headerTop, { width: logoW, height: logoH, fit: [logoW, logoH] });
      } catch(e) {
        console.error('Error adding logo to PDF:', e);
      }
    }

    const alignSettings = { align: 'center' as const, width: doc.page.width - 100 };
    doc.fillColor('#000000');
    doc.fontSize(10).font('Helvetica-Bold');
    
    if (companySettings) {
      doc.text(companySettings.country?.toUpperCase() || 'COLOMBIA', 50, headerTop + 5, alignSettings);
      doc.text(companySettings.department?.toUpperCase() || 'ANTIOQUIA', alignSettings);
      doc.text(companySettings.name.toUpperCase(), alignSettings);
      doc.font('Helvetica').text(`NIT: ${companySettings.nit}`, alignSettings);
      doc.text(`${companySettings.branch || 'Sede Principal'}`, alignSettings);
    }

    // Restore Y position below the logo/header (whichever is taller)
    const afterHeaderY = Math.max(doc.y, headerTop + 75);
    
    // Separator Line
    doc.moveTo(50, afterHeaderY + 10).lineTo(doc.page.width - 50, afterHeaderY + 10).lineWidth(1).strokeColor('#cccccc').stroke();
    doc.y = afterHeaderY + 30;

    // ─── TÍTULO DE PLANTILLA (Solo para libre) ───
    doc.fillColor(titleColor);
    doc.fontSize(titleFontSize).font('Helvetica-Bold').text(template.name.toUpperCase(), { align: 'center' });
    doc.moveDown(0.5);
  }

  const checkPageBreak = (requiredHeight: number) => {
    if (doc.y + requiredHeight > doc.page.height - 80) {
      doc.addPage();
    }
  };

  if (template.description) {
    let formattedDescription = template.description;
    const fields = template.fields as any[];
    
    // 1. Resolver los labels de los campos 'select' en lugar de mostrar los IDs
    Object.entries(data.formData).forEach(([key, value]) => {
      const fieldDef = fields?.find(f => f.id === key);
      if (fieldDef && fieldDef.type === 'select') {
        const option = fieldDef.options?.find((o:any) => String(o.id) === String(value) || String(o.value) === String(value));
        if (option) {
          data.formData[key] = option.label || option.value;
        }
      }
    });

    const blockTokens: any[] = [];

    // 2. Reemplazar variables dinámicas y extraer tablas/imágenes como bloques
    Object.entries(data.formData).forEach(([key, value]) => {
      const fieldDef = fields?.find(f => f.id === key);
      if (fieldDef && fieldDef.label) {
        // Encontrar todas las ocurrencias sin case-sensitivity
        const regex = new RegExp(`{{\\s*${fieldDef.label}\\s*}}`, 'gi');
        
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          const placeholder = `__IMAGE_BLOCK_${key}__`;
          if (regex.test(formattedDescription)) {
             formattedDescription = formattedDescription.replace(regex, placeholder);
             blockTokens.push({ placeholder, type: 'image', value });
          }
        } else if (Array.isArray(value)) {
          const placeholder = `__TABLE_BLOCK_${key}__`;
          if (regex.test(formattedDescription)) {
             formattedDescription = formattedDescription.replace(regex, placeholder);
             blockTokens.push({ placeholder, type: 'table', value });
          }
        } else {
          // Es un texto o número normal, se reemplaza inline
          formattedDescription = formattedDescription.replace(regex, String(value));
        }
      }
    });

    // 3. Partir la descripción en texto plano y bloques visuales
    let finalBlocks: any[] = [{ type: 'text', content: formattedDescription }];

    blockTokens.forEach(block => {
      let newFinalBlocks: any[] = [];
      finalBlocks.forEach(fb => {
        if (fb.type === 'text') {
           const parts = fb.content.split(block.placeholder);
           parts.forEach((part: string, idx: number) => {
             if (part) newFinalBlocks.push({ type: 'text', content: part });
             if (idx < parts.length - 1) newFinalBlocks.push(block);
           });
        } else {
           newFinalBlocks.push(fb);
        }
      });
      finalBlocks = newFinalBlocks;
    });

    // 4. Renderizar cada bloque en el PDF secuencialmente
    let inBox = false;
    let boxStartY = 0;

    finalBlocks.forEach(block => {
      if (block.type === 'text') {
        const lines = block.content.split('\n');
        
        lines.forEach((line: string) => {
          if (line.trim() === '/==') {
            doc.moveDown(0.5);
            inBox = true;
            boxStartY = doc.y;
            return;
          }
          if (line.trim() === '==/') {
            inBox = false;
            const boxEndY = doc.y;
            doc.lineWidth(1).strokeColor('#000000');
            // Draw rectangle from start to current Y
            doc.rect(40, boxStartY - 5, doc.page.width - 80, boxEndY - boxStartY + 10).stroke();
            doc.moveDown(0.5);
            return;
          }
          
          if (line.trim() === '') {
            doc.moveDown(0.5);
            return;
          }

          let align: 'left' | 'center' | 'right' | 'justify' = 'justify';
          let isH1 = false, isH2 = false, isH3 = false, isH4 = false;
          let textToRender = line.trim();

          const h1Match = textToRender.match(/\(\s*h1\s*\)(.*?)\(\s*\/h1\s*\)/i);
          if (h1Match) { isH1 = true; textToRender = textToRender.replace(h1Match[0], h1Match[1]).trim(); }
          const h2Match = textToRender.match(/\(\s*h2\s*\)(.*?)\(\s*\/h2\s*\)/i);
          if (h2Match) { isH2 = true; textToRender = textToRender.replace(h2Match[0], h2Match[1]).trim(); }
          const h3Match = textToRender.match(/\(\s*h3\s*\)(.*?)\(\s*\/h3\s*\)/i);
          if (h3Match) { isH3 = true; textToRender = textToRender.replace(h3Match[0], h3Match[1]).trim(); }
          const h4Match = textToRender.match(/\(\s*h4\s*\)(.*?)\(\s*\/h4\s*\)/i);
          if (h4Match) { isH4 = true; textToRender = textToRender.replace(h4Match[0], h4Match[1]).trim(); }

          const jMatch = textToRender.match(/\(\s*j\s*\)(.*?)\(\s*\/j\s*\)/i);
          if (jMatch) { align = 'justify'; textToRender = textToRender.replace(jMatch[0], jMatch[1]).trim(); }
          const rMatch = textToRender.match(/\(\s*r\s*\)(.*?)\(\s*\/r\s*\)/i);
          if (rMatch) { align = 'right'; textToRender = textToRender.replace(rMatch[0], rMatch[1]).trim(); }
          const lMatch = textToRender.match(/\(\s*l\s*\)(.*?)\(\s*\/l\s*\)/i);
          if (lMatch) { align = 'left'; textToRender = textToRender.replace(lMatch[0], lMatch[1]).trim(); }

          let baseSize = paragraphFontSize;
          if (isH1) baseSize = paragraphFontSize + 6;
          else if (isH2) baseSize = paragraphFontSize + 4;
          else if (isH3) baseSize = paragraphFontSize + 2;
          else if (isH4) baseSize = paragraphFontSize;

          doc.fillColor('#000000');
          doc.fontSize(baseSize);

          const parseInline = (text: string) => {
            const tokens = [];
            let currentText = '';
            let b = false, i = false, s = false;
            for (let idx = 0; idx < text.length; idx++) {
              if (text.startsWith('**', idx)) {
                if (currentText) tokens.push({ text: currentText, b, i, s });
                currentText = '';
                b = !b;
                idx += 1;
              } else if (text.startsWith('_', idx)) {
                if (currentText) tokens.push({ text: currentText, b, i, s });
                currentText = '';
                i = !i;
              } else if (text.startsWith('~', idx)) {
                if (currentText) tokens.push({ text: currentText, b, i, s });
                currentText = '';
                s = !s;
              } else {
                currentText += text[idx];
              }
            }
            if (currentText) tokens.push({ text: currentText, b, i, s });
            return tokens;
          };

          const tokens = parseInline(textToRender);

          if (tokens.length === 0) return;
          
          if (tokens.length === 1) {
            const t = tokens[0];
            let fontName = 'Helvetica';
            const isBold = isH1 || isH2 || isH3 || isH4 || t.b;
            if (isBold && t.i) fontName = 'Helvetica-BoldOblique';
            else if (isBold) fontName = 'Helvetica-Bold';
            else if (t.i) fontName = 'Helvetica-Oblique';
            doc.font(fontName).text(t.text, { align, strike: t.s });
          } else {
            tokens.forEach((t, i) => {
              let fontName = 'Helvetica';
              const isBold = isH1 || isH2 || isH3 || isH4 || t.b;
              if (isBold && t.i) fontName = 'Helvetica-BoldOblique';
              else if (isBold) fontName = 'Helvetica-Bold';
              else if (t.i) fontName = 'Helvetica-Oblique';
              
              doc.font(fontName).text(t.text, { continued: i < tokens.length - 1, align, strike: t.s });
            });
          }
        });
      } else if (block.type === 'image') {
        try {
          const base64Data = block.value.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, 'base64');
          checkPageBreak(160);
          doc.moveDown(0.5);
          doc.image(imgBuffer, { width: 150 }); 
          doc.moveDown(0.5);
        } catch(e) {
          doc.fillColor('#4B5563').fontSize(paragraphFontSize).font('Helvetica').text(`[Error cargando imagen]`);
        }
      } else if (block.type === 'table') {
        const value = block.value;
        if (value.length > 0) {
          const cols = Object.keys(value[0]);
          const startX = 50;
          const tableWidth = 500;
          const colWidth = tableWidth / cols.length;

          doc.moveDown(0.5);
          const headerY = doc.y;
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
          cols.forEach((col: string, idx: number) => {
            doc.text(col, startX + (idx * colWidth), headerY, { width: colWidth - 5, align: 'left' });
          });
          doc.y = headerY + 12;
          doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).lineWidth(1).strokeColor('#004F9F').stroke();
          doc.y += 5;

          doc.font('Helvetica').fontSize(9);
          doc.fillColor('#4B5563');
          value.forEach((row: any) => {
            checkPageBreak(25);
            const rowY = doc.y;
            let maxRowHeight = 12;
            cols.forEach((col: string, idx: number) => {
              const valStr = String(row[col] || '');
              doc.text(valStr, startX + (idx * colWidth), rowY, { width: colWidth - 5, align: 'left' });
              const currentHeight = doc.y - rowY;
              if (currentHeight > maxRowHeight) maxRowHeight = currentHeight;
            });
            doc.y = rowY + maxRowHeight;
            doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
            doc.y += 5;
          });
          doc.x = 50; // Reset X
          doc.moveDown(0.5);
        } else {
          doc.fillColor('#4B5563').fontSize(paragraphFontSize).font('Helvetica').text('Tabla sin datos');
        }
      }
    });

    doc.moveDown(1.5);
  }

  // ─── CAMPOS AGRUPADOS POR CATEGORÍA ───
  const fields = (template.fields as any[]) || [];
  const fieldsByCategory: Record<string, any[]> = {};
  
  fields.forEach(field => {
    if (field.hideInPdf) return;

    const category = field.category || 'General';
    if (!fieldsByCategory[category]) {
      fieldsByCategory[category] = [];
    }
    if (data.formData[field.id] !== undefined) {
      fieldsByCategory[category].push({
        ...field,
        value: data.formData[field.id]
      });
    }
  });

  Object.keys(fieldsByCategory).sort().forEach(category => {
    const catFields = fieldsByCategory[category];
    if (catFields.length > 0) {
      doc.fontSize(subtitleFontSize).font('Helvetica-Bold').fillColor(subtitleColor).text(category.toUpperCase());
      doc.moveDown(0.5);
      
      catFields.forEach(field => {
        doc.fillColor('#000000').fontSize(paragraphFontSize).font('Helvetica-Bold').text(`${field.label}:`);
        
        if (typeof field.value === 'string' && field.value.startsWith('data:image/')) {
          try {
            const base64Data = field.value.replace(/^data:image\/\w+;base64,/, "");
            const imgBuffer = Buffer.from(base64Data, 'base64');
            checkPageBreak(160);
            doc.moveDown(0.5);
            // Mostrar fotos pequeñas y firmas legibles
            doc.image(imgBuffer, { width: 150 }); 
          } catch(e) {
            doc.font('Helvetica').text(`[Error cargando imagen]`);
          }
        } else if (Array.isArray(field.value) && field.value.length > 0) {
          const cols = Object.keys(field.value[0]);
          const startX = 50;
          const tableWidth = 500;
          const colWidth = tableWidth / cols.length;

          doc.moveDown(0.5);
          const headerY = doc.y;
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
          cols.forEach((col, idx) => {
            doc.text(col, startX + (idx * colWidth), headerY, { width: colWidth - 5, align: 'left' });
          });
          doc.y = headerY + 12;
          doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).lineWidth(1).strokeColor('#004F9F').stroke();
          doc.y += 5;

          doc.font('Helvetica').fontSize(9);
          field.value.forEach((row: any) => {
            checkPageBreak(25);
            const rowY = doc.y;
            let maxRowHeight = 12;
            cols.forEach((col, idx) => {
              const valStr = String(row[col] || '');
              doc.text(valStr, startX + (idx * colWidth), rowY, { width: colWidth - 5, align: 'left' });
              const currentHeight = doc.y - rowY;
              if (currentHeight > maxRowHeight) maxRowHeight = currentHeight;
            });
            doc.y = rowY + maxRowHeight;
            doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
            doc.y += 5;
          });
          doc.x = 50; // Reset X
        } else if (Array.isArray(field.value)) {
          doc.font('Helvetica').fontSize(paragraphFontSize).text('Tabla sin datos');
        } else {
          doc.font('Helvetica').fontSize(paragraphFontSize).text(`${field.value}`);
        }
        
        doc.moveDown(0.5);
      });
      doc.moveDown(0.5);
    }
  });

  // ─── PIE DE PÁGINA (Todas las páginas) ───
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fillColor('#6B7280').fontSize(8).font('Helvetica');
    doc.text(
      `Diligenciado por: ${user.name} (C.C. ${user.document})  |  Fecha de diligenciamiento: ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 40,
      { align: 'center', width: doc.page.width - 100 }
    );
    doc.page.margins.bottom = bottom;
  }

  doc.end();

  // Guardar registro en la base de datos
  return prisma.signedDocument.create({
    data: {
      templateId: data.templateId,
      filledById: data.filledById,
      data: data.formData,
      photoUrl: data.photoUrl || null,
      signatureUrl: data.signatureUrl || null,
      syncStatus: 'SYNCED',
      filePath,
      templateSnapshot: template,
    },
    include: {
      template: { select: { name: true } },
      filledBy: { select: { name: true } },
    },
  });
}

export async function updateSyncStatus(id: string, syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE') {
  const exists = await prisma.signedDocument.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Documento no encontrado.' };
  }

  return prisma.signedDocument.update({
    where: { id },
    data: { syncStatus },
  });
}

export async function deleteDocument(id: string) {
  const doc = await prisma.signedDocument.findUnique({ where: { id } });
  if (!doc) {
    throw { status: 404, message: 'Documento no encontrado.' };
  }

  // Eliminar archivo físico si existe
  if (doc.filePath) {
    const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
    const fullPath = path.join(uploadsDir, doc.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  return prisma.signedDocument.delete({ where: { id } });
}
