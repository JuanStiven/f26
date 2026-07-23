import prisma from '../models/prisma';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { generateDocxFromTemplate } from './docx.service';

export async function getAllDocuments() {
  const docs = await prisma.signedDocument.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true, storagePath: true, description: true, descriptionStyles: true, fields: true } },
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
      template: { select: { name: true, description: true, descriptionStyles: true, fields: true } }
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

function getFieldTagName(field: any, allFields: any[]) {
  const hasDuplicate = allFields.some(
    (f: any) => f.id !== field.id && f.label.trim().toLowerCase() === field.label.trim().toLowerCase()
  );
  if (hasDuplicate) {
    return `${field.category || 'General'}: ${field.label}`;
  }
  return field.label;
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

  // ─── GENERACIÓN DOCX SI ES PLANTILLA PRECARGADA DOCX ───
  if (template.isDocxTemplate && template.docxFilePath) {
    const docxFileName = `${baseFileName}.docx`;
    const fullDocxPath = path.join(folderPath, docxFileName);
    const docxTemplatePath = path.join(uploadsDir, template.docxFilePath);

    const docxBuffer = generateDocxFromTemplate(
      docxTemplatePath,
      {
        ...data.formData,
        diligenciado_por: user.name,
        cedula_diligenciado_por: user.document,
        fecha_diligenciamiento: new Date().toLocaleDateString(),
      },
      (template.fields as any[]) || []
    );

    fs.writeFileSync(fullDocxPath, docxBuffer);
    const relativeFilePath = path.join(storagePath, docxFileName);

    return prisma.signedDocument.create({
      data: {
        templateId: data.templateId,
        filledById: data.filledById,
        data: data.formData,
        photoUrl: data.photoUrl || null,
        signatureUrl: data.signatureUrl || null,
        syncStatus: 'SYNCED',
        filePath: relativeFilePath,
        templateSnapshot: template,
      },
      include: {
        template: { select: { name: true } },
        filledBy: { select: { name: true } },
      },
    });
  }

  // ─── GENERACIÓN PDF ESTÁNDAR ───
  const pdfFileName = `${baseFileName}.pdf`;
  const filePath = path.join(storagePath, pdfFileName);

  const fullPdfPath = path.join(folderPath, pdfFileName);
  const pdfMargin = 70.86; // 2.5 cm en pt (2.5 * 28.346 = 70.865)
  const doc = new PDFDocument({ margin: pdfMargin, bufferPages: true });
  doc.pipe(fs.createWriteStream(fullPdfPath));
  
  // ─── CONFIGURACIÓN DE ESTILOS ───
  const companySettings = await prisma.companySettings.findFirst();
  const titleColor = companySettings?.pdfTitleColor || '#004F9F';
  const subtitleColor = companySettings?.pdfSubtitleColor || '#004F9F';
  const titleFontSize = companySettings?.pdfTitleFontSize || 16;
  const subtitleFontSize = companySettings?.pdfSubtitleFontSize || 12;
  const paragraphFontSize = companySettings?.pdfParagraphFontSize || 11;

  // ─── CONFIGURACIÓN DEL ENCABEZADO DE CALIDAD ───
  const tableTop = pdfMargin;
  const col1Width = 120;
  const col3Width = 140;
  const col2Width = doc.page.width - (pdfMargin * 2) - col1Width - col3Width;

  // Medir alturas del texto para el encabezado de calidad
  doc.font('Helvetica-Bold');
  const companyNameText = "EMPRESA SOCIAL DEL ESTADO NORTE 3 - E.S.E.";
  const companyNameHeight = doc.fontSize(10).heightOfString(companyNameText, { width: col2Width - 10, align: 'center' });
  const titleText = template.name.toUpperCase();
  const titleHeight = doc.fontSize(10).heightOfString(titleText, { width: col2Width - 10, align: 'center' });

  const topHalfHeight = Math.max(companyNameHeight + 14, 30);
  const bottomHalfHeight = Math.max(titleHeight + 14, 30);
  const tableHeight = topHalfHeight + bottomHalfHeight;

  // Función para dibujar el encabezado de calidad en cualquier página
  const drawQualityHeader = (docInstance: any) => {
    // 1. Contorno
    docInstance.lineWidth(1).strokeColor('#000000');
    docInstance.rect(pdfMargin, tableTop, docInstance.page.width - (pdfMargin * 2), tableHeight).stroke();
    
    // 2. Líneas divisoras verticales
    docInstance.moveTo(pdfMargin + col1Width, tableTop).lineTo(pdfMargin + col1Width, tableTop + tableHeight).stroke();
    docInstance.moveTo(pdfMargin + col1Width + col2Width, tableTop).lineTo(pdfMargin + col1Width + col2Width, tableTop + tableHeight).stroke();
    
    // 3. Divisor horizontal Columna 2
    docInstance.moveTo(pdfMargin + col1Width, tableTop + topHalfHeight).lineTo(pdfMargin + col1Width + col2Width, tableTop + topHalfHeight).stroke();
    
    // 4. Divisores horizontales Columna 3 (tercios)
    const rowHeight = tableHeight / 3;
    docInstance.moveTo(pdfMargin + col1Width + col2Width, tableTop + rowHeight).lineTo(docInstance.page.width - pdfMargin, tableTop + rowHeight).stroke();
    docInstance.moveTo(pdfMargin + col1Width + col2Width, tableTop + rowHeight * 2).lineTo(docInstance.page.width - pdfMargin, tableTop + rowHeight * 2).stroke();
    
    // 5. Divisor vertical interno Columna 3
    docInstance.moveTo(pdfMargin + col1Width + col2Width + 60, tableTop).lineTo(pdfMargin + col1Width + col2Width + 60, tableTop + tableHeight).stroke();

    // 6. Columna 1: Logo
    if (companySettings?.logoUrl) {
      try {
        const base64Data = companySettings.logoUrl.replace(/^data:image\/\w+;base64,/, "");
        const logoBuffer = Buffer.from(base64Data, 'base64');
        const logoW = companySettings.pdfLogoWidth || 110;
        const logoH = companySettings.pdfLogoHeight || 50;
        const logoTop = tableTop + (tableHeight - logoH) / 2;
        docInstance.image(logoBuffer, pdfMargin + (col1Width - logoW) / 2, logoTop, { width: logoW, height: logoH, fit: [logoW, logoH] });
      } catch(e) {
        console.error('Error adding logo to PDF:', e);
      }
    }

    // 7. Columna 2: Textos (Centrados verticalmente)
    docInstance.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    docInstance.text(companyNameText, pdfMargin + col1Width + 5, tableTop + (topHalfHeight - companyNameHeight) / 2, { width: col2Width - 10, align: 'center' });
    
    docInstance.text(titleText, pdfMargin + col1Width + 5, tableTop + topHalfHeight + (bottomHalfHeight - titleHeight) / 2, { width: col2Width - 10, align: 'center' });

    // 8. Columna 3: Información
    docInstance.fontSize(8);
    
    // Fila 1: Código
    docInstance.text("CÓDIGO", pdfMargin + col1Width + col2Width + 5, tableTop + (rowHeight / 2) - 4, { width: 50, align: 'left' });
    docInstance.text(template.qualityCode || '', pdfMargin + col1Width + col2Width + 65, tableTop + (rowHeight / 2) - 4, { width: 70, align: 'center' });

    // Fila 2: Versión
    docInstance.text("VERSIÓN", pdfMargin + col1Width + col2Width + 5, tableTop + rowHeight + (rowHeight / 2) - 4, { width: 50, align: 'left' });
    docInstance.text(template.qualityVersion || '', pdfMargin + col1Width + col2Width + 65, tableTop + rowHeight + (rowHeight / 2) - 4, { width: 70, align: 'center' });

    // Fila 3: Fecha
    docInstance.text("FECHA", pdfMargin + col1Width + col2Width + 5, tableTop + (rowHeight * 2) + (rowHeight / 2) - 4, { width: 50, align: 'left' });
    docInstance.text(template.qualityDate || '', pdfMargin + col1Width + col2Width + 65, tableTop + (rowHeight * 2) + (rowHeight / 2) - 4, { width: 70, align: 'center' });
  };

  // ─── CABECERA DEL DOCUMENTO ───
  const headerTop = pdfMargin;
  
  if (template.isQualityDocument) {
    drawQualityHeader(doc);
    doc.y = tableTop + tableHeight + 20;
    doc.x = pdfMargin;
  } else {
    // FORMATO LIBRE (Clásico)
    if (companySettings?.logoUrl) {
      try {
        const base64Data = companySettings.logoUrl.replace(/^data:image\/\w+;base64,/, "");
        const logoBuffer = Buffer.from(base64Data, 'base64');
        const logoW = companySettings.pdfLogoWidth || 100;
        const logoH = companySettings.pdfLogoHeight || 100;
        doc.image(logoBuffer, pdfMargin, headerTop, { width: logoW, height: logoH, fit: [logoW, logoH] });
      } catch(e) {
        console.error('Error adding logo to PDF:', e);
      }
    }

    const alignSettings = { align: 'center' as const, width: doc.page.width - (pdfMargin * 2) };
    doc.fillColor('#000000');
    doc.fontSize(10).font('Helvetica-Bold');
    
    if (companySettings) {
      doc.text(companySettings.country?.toUpperCase() || 'COLOMBIA', pdfMargin, headerTop + 5, alignSettings);
      doc.text(companySettings.department?.toUpperCase() || 'ANTIOQUIA', alignSettings);
      doc.text(companySettings.name.toUpperCase(), alignSettings);
      doc.font('Helvetica').text(`NIT: ${companySettings.nit}`, alignSettings);
      doc.text(`${companySettings.branch || 'Sede Principal'}`, alignSettings);
    }

    // Restore Y position below the logo/header (whichever is taller)
    const afterHeaderY = Math.max(doc.y, headerTop + 75);
    
    // Separator Line
    doc.moveTo(pdfMargin, afterHeaderY + 10).lineTo(doc.page.width - pdfMargin, afterHeaderY + 10).lineWidth(1).strokeColor('#cccccc').stroke();
    doc.y = afterHeaderY + 30;

    // ─── TÍTULO DE PLANTILLA (Solo para libre) ───
    doc.fillColor(titleColor);
    doc.fontSize(titleFontSize).font('Helvetica-Bold').text(template.name.toUpperCase(), { align: 'center' });
    doc.moveDown(0.5);
  }

  const checkPageBreak = (requiredHeight: number) => {
    // Evitar desbordamiento sobre el pie de página
    const footerMargin = template.footer ? 90 : 60;
    if (doc.y + requiredHeight > doc.page.height - footerMargin) {
      doc.addPage();
      if (template.isQualityDocument) {
        drawQualityHeader(doc);
        doc.y = tableTop + tableHeight + 20;
      } else {
        doc.y = pdfMargin;
      }
      doc.x = pdfMargin;
    }
  };

  const fields = (template.fields as any[]) || [];
  let formattedDescription = template.description || '';
  let formattedFooter = template.footer || '';
  
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

  // 2. Replace {{variable}} tokens with actual data values
  const blockTokens: any[] = [];

  Object.entries(data.formData).forEach(([key, value]) => {
    const fieldDef = fields?.find(f => f.id === key);
    if (fieldDef && fieldDef.label) {
      const tagName = getFieldTagName(fieldDef, fields);
      const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedLabel = fieldDef.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{{\\s*(?:${escapedTagName}|${escapedLabel})\\s*}}`, 'gi');
      
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        const placeholder = `__IMAGE_BLOCK_${key}__`;
        if (regex.test(formattedDescription)) {
           formattedDescription = formattedDescription.replace(regex, placeholder);
           blockTokens.push({ placeholder, type: 'image', value });
        }
        if (regex.test(formattedFooter)) {
           formattedFooter = formattedFooter.replace(regex, '[Imagen]');
        }
      } else if (Array.isArray(value)) {
        const placeholder = `__TABLE_BLOCK_${key}__`;
        if (regex.test(formattedDescription)) {
           formattedDescription = formattedDescription.replace(regex, placeholder);
           blockTokens.push({ placeholder, type: 'table', value });
        }
        if (regex.test(formattedFooter)) {
           formattedFooter = formattedFooter.replace(regex, '[Tabla]');
        }
      } else {
        formattedDescription = formattedDescription.replace(regex, String(value));
        formattedFooter = formattedFooter.replace(regex, String(value));
      }
    }
  });

  if (formattedDescription) {

    // 3. Simple HTML-to-PDF renderer
    // Strip HTML tags and render formatted content
    const renderHtmlToPdf = (html: string) => {
      // Split into blocks based on HTML block-level elements
      // Process: remove outer tags, handle inline formatting
      const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '');
      
      // Parse HTML into structural blocks
      let match;
      const blocks: { tag: string; content: string; attrs: string; listIndex?: number }[] = [];
      
      // Also handle text that's not wrapped in tags
      const tempHtml = html
        // Normalize self-closing hr
        .replace(/<hr\s*\/?>/gi, '<hr></hr>')
        // Wrap bare text lines in <p>
        .replace(/^([^<]+)$/gm, '<p>$1</p>');

      const blockPattern = /<(h[1-3]|p|li|blockquote|hr|table|ol|ul)((?:\s+[^>]*)?)>([\s\S]*?)<\/\1>/gi;
      
      let processedHtml = tempHtml.replace(/<br\s*\/?>/gi, '\n');

      const rawBlocks: { tag: string; content: string; attrs: string }[] = [];
      while ((match = blockPattern.exec(processedHtml)) !== null) {
        const tag = match[1].toLowerCase();
        const attrs = match[2] || '';
        const content = match[3];
        rawBlocks.push({ tag, content, attrs });
      }

      // Flatten list items
      rawBlocks.forEach(block => {
        if (block.tag === 'ol') {
          const liPattern = /<li((?:\s+[^>]*)?)>([\s\S]*?)<\/li>/gi;
          let liMatch;
          let idx = 1;
          while ((liMatch = liPattern.exec(block.content)) !== null) {
            blocks.push({ tag: 'li-ordered', content: liMatch[2], attrs: liMatch[1], listIndex: idx++ });
          }
        } else if (block.tag === 'ul') {
          const liPattern = /<li((?:\s+[^>]*)?)>([\s\S]*?)<\/li>/gi;
          let liMatch;
          while ((liMatch = liPattern.exec(block.content)) !== null) {
            blocks.push({ tag: 'li-unordered', content: liMatch[2], attrs: liMatch[1] });
          }
        } else {
          blocks.push(block);
        }
      });
      
      // If no blocks found, treat the entire content as one paragraph
      if (blocks.length === 0 && stripHtml(processedHtml).trim()) {
        blocks.push({ tag: 'p', content: processedHtml, attrs: '' });
      }
      
      blocks.forEach(block => {
        // Check for block-level image/table placeholders
        const plainContent = stripHtml(block.content);
        
        // Handle inline image/table blocks
        for (const bt of blockTokens) {
          if (plainContent.includes(bt.placeholder)) {
            const parts = plainContent.split(bt.placeholder);
            parts.forEach((part, idx) => {
              const trimmedPart = part.trim();
              if (trimmedPart) {
                doc.font('Helvetica').fontSize(paragraphFontSize).fillColor('#000000');
                doc.text(trimmedPart, { align: 'justify', lineGap: 3 });
              }
              if (idx < parts.length - 1) {
                if (bt.type === 'image') {
                  try {
                    const base64Data = bt.value.replace(/^data:image\/\w+;base64,/, "");
                    const imgBuffer = Buffer.from(base64Data, 'base64');
                    checkPageBreak(160);
                    doc.moveDown(0.5);
                    doc.image(imgBuffer, { width: 150 });
                    doc.moveDown(0.5);
                  } catch(e) {
                    doc.fillColor('#4B5563').fontSize(paragraphFontSize).font('Helvetica').text(`[Error cargando imagen]`, { lineGap: 3 });
                  }
                } else if (bt.type === 'table') {
                  const tValue = bt.value;
                  if (tValue.length > 0) {
                    const cols = Object.keys(tValue[0]);
                    const startX = pdfMargin;
                    const tableWidth = doc.page.width - (pdfMargin * 2);
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

                    doc.font('Helvetica').fontSize(9).fillColor('#4B5563');
                    tValue.forEach((row: any) => {
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
                    doc.x = pdfMargin;
                    doc.moveDown(0.5);
                  }
                }
              }
            });
            return; // Block fully handled
          }
        }

        if (block.tag === 'table') {
          // Extract rows and cell content
          const rows: { isHeader: boolean; cells: string[] }[] = [];
          const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
          let rowMatch;
          while ((rowMatch = rowPattern.exec(block.content)) !== null) {
            const rowContent = rowMatch[1];
            const cells: string[] = [];
            let isHeader = false;
            const cellPattern = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
            let cellMatch;
            while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
              if (cellMatch[1].toLowerCase() === 'th') {
                isHeader = true;
              }
              const cleanCell = stripHtml(cellMatch[2])
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&nbsp;/g, ' ')
                .trim();
              cells.push(cleanCell);
            }
            if (cells.length > 0) {
              rows.push({ isHeader, cells });
            }
          }

          if (rows.length > 0) {
            const startX = pdfMargin;
            const tableWidth = doc.page.width - (pdfMargin * 2);
            const maxCols = Math.max(...rows.map(r => r.cells.length));
            const colWidth = tableWidth / maxCols;

            doc.moveDown(0.5);

            rows.forEach(row => {
              let maxCellHeight = 15; // padding included
              const rowY = doc.y;

              // Calculate height needed for this row
              row.cells.forEach((cellText, idx) => {
                doc.font(row.isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
                const currentHeight = doc.heightOfString(cellText, { width: colWidth - 10 });
                if (currentHeight + 8 > maxCellHeight) {
                  maxCellHeight = currentHeight + 8;
                }
              });

              checkPageBreak(maxCellHeight);
              const currentDrawY = doc.y;

              // Draw backgrounds and borders
              row.cells.forEach((cellText, idx) => {
                const cellX = startX + (idx * colWidth);
                
                // Draw background for header row
                if (row.isHeader) {
                  doc.save();
                  doc.fillColor('#F3F4F6').rect(cellX, currentDrawY, colWidth, maxCellHeight).fill();
                  doc.restore();
                }

                // Draw cell text
                doc.font(row.isHeader ? 'Helvetica-Bold' : 'Helvetica')
                   .fontSize(9)
                   .fillColor('#374151');
                
                doc.text(cellText, cellX + 5, currentDrawY + 4, {
                  width: colWidth - 10,
                  align: 'left'
                });

                // Draw border around cell
                doc.rect(cellX, currentDrawY, colWidth, maxCellHeight)
                   .lineWidth(0.5)
                   .strokeColor('#D1D5DB')
                   .stroke();
              });

              doc.y = currentDrawY + maxCellHeight;
            });

            doc.x = pdfMargin;
            doc.moveDown(0.5);
          }
          return;
        }
        
        if (block.tag === 'hr') {
          doc.moveDown(0.3);
          doc.moveTo(pdfMargin, doc.y).lineTo(doc.page.width - pdfMargin, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke();
          doc.moveDown(0.5);
          return;
        }

        // Determine alignment from style attribute
        let align: 'left' | 'center' | 'right' | 'justify' = 'justify';
        const styleMatch = block.attrs.match(/style="[^"]*text-align:\s*(left|center|right|justify)/i);
        if (styleMatch) {
          align = styleMatch[1].toLowerCase() as typeof align;
        }

        // Parse inline formatting: <strong>, <em>, <u>, <s>, <a>
        const inlineTokens: { text: string; bold: boolean; italic: boolean; underline: boolean; strike: boolean }[] = [];
        let tempContent = block.content;
        
        // Simple inline tag parsing
        const parseInlineHtml = (htmlContent: string) => {
          const tokens: typeof inlineTokens = [];
          // Remove nested block tags that might be inside
          let cleaned = htmlContent.replace(/<\/?(?:p|div|br)[^>]*>/gi, ' ');
          
          // Track state through tag stack
          let currentText = '';
          let bold = false, italic = false, underline = false, strike = false;
          let i = 0;
          
          while (i < cleaned.length) {
            if (cleaned[i] === '<') {
              // Find end of tag
              const tagEnd = cleaned.indexOf('>', i);
              if (tagEnd === -1) {
                currentText += cleaned[i];
                i++;
                continue;
              }
              const tagStr = cleaned.substring(i, tagEnd + 1);
              
              // Push current text before state change
              if (currentText) {
                tokens.push({ text: currentText, bold, italic, underline, strike });
                currentText = '';
              }
              
              // Process tag
              if (/<strong[^>]*>/i.test(tagStr)) bold = true;
              else if (/<\/strong>/i.test(tagStr)) bold = false;
              else if (/<em[^>]*>/i.test(tagStr)) italic = true;
              else if (/<\/em>/i.test(tagStr)) italic = false;
              else if (/<u[^>]*>/i.test(tagStr)) underline = true;
              else if (/<\/u>/i.test(tagStr)) underline = false;
              else if (/<s[^>]*>/i.test(tagStr)) strike = true;
              else if (/<\/s>/i.test(tagStr)) strike = false;
              // Skip other tags silently
              
              i = tagEnd + 1;
            } else {
              currentText += cleaned[i];
              i++;
            }
          }
          if (currentText) {
            tokens.push({ text: currentText, bold, italic, underline, strike });
          }
          return tokens;
        };

        const tokens = parseInlineHtml(tempContent);

        // Determine font size and weight based on tag
        let fontSize = paragraphFontSize;
        let defaultFont = 'Helvetica';
        
        if (block.tag === 'h1') {
          fontSize = paragraphFontSize + 6;
          defaultFont = 'Helvetica-Bold';
          checkPageBreak(fontSize + 10);
        } else if (block.tag === 'h2') {
          fontSize = paragraphFontSize + 4;
          defaultFont = 'Helvetica-Bold';
          checkPageBreak(fontSize + 8);
        } else if (block.tag === 'h3') {
          fontSize = paragraphFontSize + 2;
          defaultFont = 'Helvetica-Bold';
          checkPageBreak(fontSize + 6);
        } else if (block.tag === 'blockquote') {
          // Indent blockquotes
          doc.x = pdfMargin + 20;
        } else if (block.tag === 'li' || block.tag === 'li-unordered') {
          // Add bullet point, check if bold
          const isBold = tokens.length > 0 && tokens[0].bold;
          doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(paragraphFontSize).fillColor('#000000');
          doc.text('• ', { continued: true, align: 'left', lineGap: 3 });
        } else if (block.tag === 'li-ordered') {
          // Add numbered list item, check if bold
          const isBold = tokens.length > 0 && tokens[0].bold;
          doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(paragraphFontSize).fillColor('#000000');
          doc.text(`${block.listIndex || 1}. `, { continued: true, align: 'left', lineGap: 3 });
        }
        
        doc.fillColor('#000000').fontSize(fontSize);
        
        if (tokens.length === 0) {
          doc.moveDown(0.3);
          if (block.tag === 'blockquote') doc.x = pdfMargin;
          return;
        }

        tokens.forEach((t, i) => {
          let fontName = defaultFont;
          const isBold = block.tag.startsWith('h') || t.bold;
          if (isBold && t.italic) fontName = 'Helvetica-BoldOblique';
          else if (isBold) fontName = 'Helvetica-Bold';
          else if (t.italic) fontName = 'Helvetica-Oblique';
          
          // Decode HTML entities
          const decodedText = t.text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, ' ');
          
          if (decodedText.trim() || i > 0) {
            doc.font(fontName).text(decodedText, {
              continued: i < tokens.length - 1,
              align,
              strike: t.strike,
              underline: t.underline,
              lineGap: 3,
            });
          }
        });

        // Reset indent for blockquote
        if (block.tag === 'blockquote') doc.x = pdfMargin;
        
        if (block.tag.startsWith('h')) {
          doc.moveDown(0.3);
        }
      });
    };

    renderHtmlToPdf(formattedDescription);

    doc.moveDown(1.5);
  }

  // ─── CAMPOS AGRUPADOS POR CATEGORÍA ───
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
        doc.fillColor('#000000').fontSize(paragraphFontSize).font('Helvetica-Bold').text(`${field.label}:`, { lineGap: 3 });
        
        if (typeof field.value === 'string' && field.value.startsWith('data:image/')) {
          try {
            const base64Data = field.value.replace(/^data:image\/\w+;base64,/, "");
            const imgBuffer = Buffer.from(base64Data, 'base64');
            checkPageBreak(160);
            doc.moveDown(0.5);
            // Mostrar fotos pequeñas y firmas legibles
            doc.image(imgBuffer, { width: 150 }); 
          } catch(e) {
            doc.font('Helvetica').text(`[Error cargando imagen]`, { lineGap: 3 });
          }
        } else if (Array.isArray(field.value) && field.value.length > 0) {
          const cols = Object.keys(field.value[0]);
          const startX = pdfMargin;
          const tableWidth = doc.page.width - (pdfMargin * 2);
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
          doc.x = pdfMargin; // Reset X
        } else if (Array.isArray(field.value)) {
          doc.font('Helvetica').fontSize(paragraphFontSize).text('Tabla sin datos', { lineGap: 3 });
        } else {
          let textVal = String(field.value || '');
          if (field.type === 'textarea') {
            textVal = textVal.replace(/<br\s*\/?>/gi, '\n')
                             .replace(/<\/p>/gi, '\n')
                             .replace(/<[^>]*>/g, '')
                             .replace(/&nbsp;/gi, ' ')
                             .trim();
          }
          doc.font('Helvetica').fontSize(paragraphFontSize).text(textVal, { lineGap: 3 });
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
    
    const pageNumText = `Página ${i + 1} de ${pages.count}`;
    
    let footerText = '';
    if (formattedFooter) {
      footerText = formattedFooter
        .replace(/<br\s*\/?>/gi, '\n') // Keep linebreaks in the footer
        .replace(/<[^>]*>/g, '')       // Strip all HTML tags
        .trim();
    }

    const footerStartY = doc.page.height - 55;
    
    // Dibujar línea separadora arriba del pie de página
    doc.lineWidth(0.5).strokeColor('#cccccc');
    doc.moveTo(pdfMargin, footerStartY - 5).lineTo(doc.page.width - pdfMargin, footerStartY - 5).stroke();
    
    doc.fillColor('#6B7280').fontSize(8).font('Helvetica');
    
    // Dibujar paginación alineada a la derecha
    doc.text(
      pageNumText,
      doc.page.width - pdfMargin - 100,
      footerStartY,
      { align: 'right', width: 100 }
    );

    if (footerText) {
      doc.fillColor('#4B5563').fontSize(8).font('Helvetica');
      doc.text(
        footerText,
        pdfMargin,
        footerStartY,
        { align: 'left', width: doc.page.width - (pdfMargin * 2) - 110 }
      );

      // Dibujar datos de auditoría al final centrado
      doc.fillColor('#6B7280').fontSize(7);
      doc.text(
        `Diligenciado por: ${user.name} (C.C. ${user.document})  |  Fecha: ${new Date().toLocaleString()}`,
        pdfMargin,
        doc.page.height - 24,
        { align: 'center', width: doc.page.width - (pdfMargin * 2) }
      );
    } else {
      // Solo pie de página estándar
      doc.fillColor('#6B7280').fontSize(8).font('Helvetica');
      doc.text(
        `Diligenciado por: ${user.name} (C.C. ${user.document})  |  Fecha: ${new Date().toLocaleString()}`,
        pdfMargin,
        footerStartY,
        { align: 'left', width: doc.page.width - (pdfMargin * 2) - 110 }
      );
    }
    
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
