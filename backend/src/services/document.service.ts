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
  
  // ─── CABECERA DEL DOCUMENTO ───
  const companySettings = await prisma.companySettings.findFirst();
  const headerTop = 50;

  if (companySettings?.logoUrl) {
    try {
      const base64Data = companySettings.logoUrl.replace(/^data:image\/\w+;base64,/, "");
      const logoBuffer = Buffer.from(base64Data, 'base64');
      doc.image(logoBuffer, 50, headerTop, { width: 100, height: 100, fit: [100, 100] });
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

  const checkPageBreak = (requiredHeight: number) => {
    if (doc.y + requiredHeight > doc.page.height - 80) {
      doc.addPage();
    }
  };

  // ─── TÍTULO Y DESCRIPCIÓN DE PLANTILLA ───
  doc.fillColor('#004F9F'); // Azul Institucional
  doc.fontSize(16).font('Helvetica-Bold').text(template.name.toUpperCase(), { align: 'center' });
  doc.moveDown(0.5);

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
    finalBlocks.forEach(block => {
      if (block.type === 'text') {
        doc.fillColor('#4B5563').fontSize(11).font('Helvetica').text(block.content, { align: 'justify' });
      } else if (block.type === 'image') {
        try {
          const base64Data = block.value.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, 'base64');
          checkPageBreak(160);
          doc.moveDown(0.5);
          doc.image(imgBuffer, { width: 150 }); 
          doc.moveDown(0.5);
        } catch(e) {
          doc.fillColor('#4B5563').fontSize(11).font('Helvetica').text(`[Error cargando imagen]`);
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
          doc.fillColor('#4B5563').fontSize(11).font('Helvetica').text('Tabla sin datos');
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
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#004F9F').text(category.toUpperCase());
      doc.moveDown(0.5);
      
      catFields.forEach(field => {
        doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(`${field.label}:`);
        
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
          doc.font('Helvetica').text('Tabla sin datos');
        } else {
          doc.font('Helvetica').text(`${field.value}`);
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
