"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocxTemplate = parseDocxTemplate;
exports.generateDocxFromTemplate = generateDocxFromTemplate;
const pizzip_1 = __importDefault(require("pizzip"));
const docxtemplater_1 = __importDefault(require("docxtemplater"));
const mammoth_1 = __importDefault(require("mammoth"));
const fs_1 = __importDefault(require("fs"));
async function parseDocxTemplate(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`El archivo DOCX no existe en la ruta: ${filePath}`);
    }
    const htmlResult = await mammoth_1.default.convertToHtml({ path: filePath });
    const rawTextResult = await mammoth_1.default.extractRawText({ path: filePath });
    const text = rawTextResult.value || '';
    // Tag match pattern: {{var}}, {var}, or <<var>>
    const tagRegex = /\{\{\s*([^}]+)\s*\}\}|\{([^{}]+)\}|<<\s*([^>]+)\s*>>/g;
    const tagsSet = new Set();
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
function generateDocxFromTemplate(templatePath, formData, fields = []) {
    if (!fs_1.default.existsSync(templatePath)) {
        throw new Error(`El archivo de plantilla DOCX no fue encontrado en: ${templatePath}`);
    }
    const content = fs_1.default.readFileSync(templatePath);
    const zip = new pizzip_1.default(content);
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
    }
    catch (e) {
        console.warn('Advertencia al normalizar delimitadores XML en DOCX:', e);
    }
    const doc = new docxtemplater_1.default(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
    });
    // Build key-value map for rendering
    const data = {};
    // 1. Process defined fields
    fields.forEach(field => {
        let val = formData[field.id];
        if (val === undefined || val === null) {
            val = formData[field.label] || '';
        }
        if (field.type === 'select' && field.options) {
            const option = field.options.find((o) => String(o.id) === String(val) || String(o.value) === String(val));
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
        }
        else if (Array.isArray(v)) {
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
//# sourceMappingURL=docx.service.js.map