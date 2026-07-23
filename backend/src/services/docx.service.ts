import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export async function parseDocxTemplate(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`El archivo DOCX no existe en la ruta: ${filePath}`);
  }

  const htmlResult = await mammoth.convertToHtml({ path: filePath });
  const rawTextResult = await mammoth.extractRawText({ path: filePath });

  const text = rawTextResult.value || '';
  
  // Tag match pattern: {{var}}, {var}, or <<var>>
  const tagRegex = /\{\{\s*([^}]+)\s*\}\}|\{([^{}]+)\}|<<\s*([^>]+)\s*>>/g;
  const tagsSet = new Set<string>();
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const tagName = (match[1] || match[2] || match[3] || '').trim();
    if (tagName && !tagName.includes('\n') && tagName.length < 100) {
      tagsSet.add(tagName);
    }
  }

  return {
    html: htmlResult.value || '',
    rawText: text,
    detectedTags: Array.from(tagsSet),
  };
}

export function generateDocxFromTemplate(
  templatePath: string,
  formData: Record<string, any>,
  fields: any[] = []
): Buffer {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`El archivo de plantilla DOCX no fue encontrado en: ${templatePath}`);
  }

  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  // If template XML uses <<var>> delimiters, normalize them to {{var}} inside zip document.xml files
  try {
    ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/footer1.xml', 'word/footer2.xml'].forEach(xmlFile => {
      const fileInZip = zip.file(xmlFile);
      if (fileInZip) {
        let xmlStr = fileInZip.asText();
        // Replace << with {{ and >> with }}
        xmlStr = xmlStr.replace(/&lt;&lt;/g, '{{').replace(/&gt;&gt;/g, '}}');
        zip.file(xmlFile, xmlStr);
      }
    });
  } catch (e) {
    console.warn('Advertencia al normalizar delimitadores XML en DOCX:', e);
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });

  // Build key-value map for rendering
  const data: Record<string, any> = {};

  // 1. Process defined fields
  fields.forEach(field => {
    let val = formData[field.id];
    if (val === undefined || val === null) {
      val = formData[field.label] || '';
    }

    if (field.type === 'select' && field.options) {
      const option = field.options.find(
        (o: any) => String(o.id) === String(val) || String(o.value) === String(val)
      );
      if (option) {
        val = option.label || option.value;
      }
    }

    if (val === undefined || val === null) {
      val = '';
    }

    // Assign to multiple possible tag representations
    data[field.id] = val;
    if (field.tag) {
      const cleanTag = String(field.tag).replace(/[{}]/g, '').trim();
      data[field.tag] = val;
      data[cleanTag] = val;
    }
    if (field.label) {
      data[field.label] = val;
      data[field.label.trim()] = val;
    }
  });

  // 2. Add all raw formData keys into data
  Object.entries(formData).forEach(([k, v]) => {
    let finalVal = v;
    if (typeof v === 'string' && v.startsWith('data:image/')) {
      // Signature / Image placeholder representation
      finalVal = '[Firma / Imagen Registrada]';
    } else if (Array.isArray(v)) {
      finalVal = JSON.stringify(v);
    }
    data[k] = finalVal ?? '';
  });

  // Render document with data
  doc.render(data);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}
