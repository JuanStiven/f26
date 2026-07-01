import prisma from '../models/prisma';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

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

    // 2. Replace {{variable}} tokens with actual data values
    const blockTokens: any[] = [];

    Object.entries(data.formData).forEach(([key, value]) => {
      const fieldDef = fields?.find(f => f.id === key);
      if (fieldDef && fieldDef.label) {
        const regex = new RegExp(`{{\\s*${fieldDef.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}}`, 'gi');
        
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
          formattedDescription = formattedDescription.replace(regex, String(value));
        }
      }
    });

    // 3. Simple HTML-to-PDF renderer
    // Strip HTML tags and render formatted content
    const renderHtmlToPdf = (html: string) => {
      // Split into blocks based on HTML block-level elements
      // Process: remove outer tags, handle inline formatting
      const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '');
      
      // Parse HTML into structural blocks
      const blockRegex = /<(h[1-3]|p|li|blockquote|hr)((?:\s+[^>]*)?)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
      let lastIndex = 0;
      let match;
      const blocks: { tag: string; content: string; attrs: string }[] = [];
      
      // Also handle text that's not wrapped in tags
      const tempHtml = html
        // Normalize self-closing hr
        .replace(/<hr\s*\/?>/gi, '<hr></hr>')
        // Wrap bare text lines in <p>
        .replace(/^([^<]+)$/gm, '<p>$1</p>');

      const blockPattern = /<(h[1-3]|p|li|blockquote|hr)((?:\s+[^>]*)?)>([\s\S]*?)<\/\1>/gi;
      
      // Handle list wrappers - extract <li> from <ul>/<ol>
      let processedHtml = tempHtml
        .replace(/<\/?ul[^>]*>/gi, '')
        .replace(/<\/?ol[^>]*>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n');

      while ((match = blockPattern.exec(processedHtml)) !== null) {
        const tag = match[1].toLowerCase();
        const attrs = match[2] || '';
        const content = match[3];
        blocks.push({ tag, content, attrs });
      }
      
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
                doc.text(trimmedPart, { align: 'justify' });
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
                    doc.fillColor('#4B5563').fontSize(paragraphFontSize).font('Helvetica').text(`[Error cargando imagen]`);
                  }
                } else if (bt.type === 'table') {
                  const tValue = bt.value;
                  if (tValue.length > 0) {
                    const cols = Object.keys(tValue[0]);
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
                    doc.x = 50;
                    doc.moveDown(0.5);
                  }
                }
              }
            });
            return; // Block fully handled
          }
        }
        
        if (block.tag === 'hr') {
          doc.moveDown(0.3);
          doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke();
          doc.moveDown(0.5);
          return;
        }

        // Determine alignment from style attribute
        let align: 'left' | 'center' | 'right' | 'justify' = 'justify';
        const styleMatch = block.attrs.match(/style="[^"]*text-align:\s*(left|center|right|justify)/i);
        if (styleMatch) {
          align = styleMatch[1].toLowerCase() as typeof align;
        }

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
          doc.x = 70;
        } else if (block.tag === 'li') {
          // Add bullet point
          doc.font('Helvetica').fontSize(paragraphFontSize).fillColor('#000000');
          doc.text('• ', { continued: true, align: 'left' });
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
        
        doc.fillColor('#000000').fontSize(fontSize);
        
        if (tokens.length === 0) {
          doc.moveDown(0.3);
          if (block.tag === 'blockquote') doc.x = 50;
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
            });
          }
        });

        // Reset indent for blockquote
        if (block.tag === 'blockquote') doc.x = 50;
        
        if (block.tag.startsWith('h')) {
          doc.moveDown(0.3);
        }
      });
    };

    renderHtmlToPdf(formattedDescription);

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
