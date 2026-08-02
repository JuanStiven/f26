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
const path_1 = __importDefault(require("path"));
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
const ImageModule = require('docxtemplater-image-module-free');
function cleanHtmlText(html) {
    if (!html || typeof html !== 'string')
        return '';
    if (!/<[a-z][\s\S]*>/i.test(html))
        return html;
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/\n\s*\n/g, '\n')
        .trim();
}
function formatTableAsText(rows, columns) {
    if (!Array.isArray(rows) || rows.length === 0)
        return '';
    return rows.map((row, idx) => {
        if (typeof row === 'object' && row !== null) {
            const keys = columns && columns.length > 0 ? columns : Object.keys(row);
            const rowStr = keys.map(k => `${k}: ${row[k] ?? ''}`).join(' | ');
            return `${idx + 1}. ${rowStr}`;
        }
        return `${idx + 1}. ${String(row)}`;
    }).join('\n');
}
function generateDocxFromTemplate(templatePath, formData, fields = []) {
    if (!fs_1.default.existsSync(templatePath)) {
        throw new Error(`El archivo de plantilla DOCX no fue encontrado en: ${templatePath}`);
    }
    const content = fs_1.default.readFileSync(templatePath);
    const zip = new pizzip_1.default(content);
    // Collect tag names for image-type fields (signature, photo, image)
    const imageFieldTags = new Set();
    fields.forEach(field => {
        if (field.type === 'signature' || field.type === 'photo' || field.type === 'image') {
            // Collect all possible tag representations for this field
            if (field.tag) {
                const cleanTag = String(field.tag).replace(/[{}]/g, '').replace(/</g, '').replace(/>/g, '').trim();
                imageFieldTags.add(cleanTag);
            }
            if (field.id)
                imageFieldTags.add(String(field.id));
            if (field.label)
                imageFieldTags.add(String(field.label).trim());
        }
    });
    // Pre-process XML: normalize delimiters and convert image tags to use % prefix
    const xmlFiles = ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'];
    try {
        xmlFiles.forEach(xmlFile => {
            const fileInZip = zip.file(xmlFile);
            if (fileInZip) {
                let xmlStr = fileInZip.asText();
                // Normalize << >> to {{ }}
                xmlStr = xmlStr.replace(/&lt;&lt;/g, '{{').replace(/&gt;&gt;/g, '}}');
                // Convert {{tagName}} → {{%tagName}} for image-type fields
                // This makes docxtemplater-image-module-free recognize them as image placeholders
                imageFieldTags.forEach(tag => {
                    // Escape regex special chars in tag name
                    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Match the tag inside {{ }} even if Word XML may have split it across runs
                    // First, try the simple case where the tag text is intact
                    const simplePattern = new RegExp(`\\{\\{\\s*(${escaped})\\s*\\}\\}`, 'g');
                    xmlStr = xmlStr.replace(simplePattern, '{{%$1}}');
                });
                zip.file(xmlFile, xmlStr);
            }
        });
    }
    catch (e) {
        console.warn('Advertencia al normalizar delimitadores XML en DOCX:', e);
    }
    // Transparent 1x1 PNG fallback for empty/null image values
    const TRANSPARENT_1PX_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
        'Nl7BcQAAAABJRU5ErkJggg==', 'base64');
    const imageOptions = {
        centered: false,
        fileType: 'docx',
        getImage: (tagValue, tagName) => {
            if (!tagValue || typeof tagValue !== 'string' || tagValue.trim() === '') {
                return TRANSPARENT_1PX_PNG;
            }
            // Handle base64 data URI
            if (tagValue.startsWith('data:image/')) {
                const base64Data = tagValue.replace(/^data:image\/[^;]+;base64,/, '');
                try {
                    return Buffer.from(base64Data, 'base64');
                }
                catch {
                    return TRANSPARENT_1PX_PNG;
                }
            }
            // Handle file path
            const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
            const cleanPath = tagValue.replace(/^\/?uploads\//, '');
            const candidatePaths = [
                path_1.default.isAbsolute(cleanPath) ? cleanPath : path_1.default.join(uploadsDir, cleanPath),
                path_1.default.join(uploadsDir, cleanPath),
                path_1.default.join(uploadsDir, tagValue),
                tagValue,
            ];
            for (const p of candidatePaths) {
                try {
                    if (fs_1.default.existsSync(p) && fs_1.default.statSync(p).isFile()) {
                        return fs_1.default.readFileSync(p);
                    }
                }
                catch {
                    // continue
                }
            }
            // Try interpreting as raw base64 (no data URI prefix)
            if (/^[A-Za-z0-9+/]+=*$/.test(tagValue) && tagValue.length > 20) {
                try {
                    return Buffer.from(tagValue, 'base64');
                }
                catch {
                    // fallback
                }
            }
            return TRANSPARENT_1PX_PNG;
        },
        getSize: (imgBuffer, _tagValue, _tagName) => {
            // Signature: wider; Photo: larger
            if (imgBuffer && imgBuffer.length > 100) {
                return [250, 100];
            }
            return [1, 1]; // transparent fallback: tiny
        },
    };
    const imageModule = new ImageModule(imageOptions);
    const doc = new docxtemplater_1.default(zip, {
        modules: [imageModule],
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
            val = formData[field.label] || formData[field.tag] || '';
        }
        // Dropdown / Select handling
        if ((field.type === 'select' || field.type === 'dropdown') && Array.isArray(field.options)) {
            const option = field.options.find((o) => String(o.id || o.value || o) === String(val) ||
                String(o.label || o) === String(val));
            if (option) {
                val = typeof option === 'string' ? option : (option.label || option.value || option.id);
            }
        }
        // RichText / Textarea cleaning
        if ((field.type === 'textarea' || field.type === 'richtext') && typeof val === 'string') {
            val = cleanHtmlText(val);
        }
        // Signature / Photo / Image: ensure value is a data URI for the image module
        if ((field.type === 'signature' || field.type === 'photo' || field.type === 'image') && typeof val === 'string' && val.length > 0) {
            if (!val.startsWith('data:image/')) {
                const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
                const cleanPath = val.replace(/^\/?uploads\//, '');
                const candidatePaths = [
                    path_1.default.join(uploadsDir, cleanPath),
                    path_1.default.join(uploadsDir, val),
                    val,
                ];
                const foundPath = candidatePaths.find(p => {
                    try {
                        return fs_1.default.existsSync(p) && fs_1.default.statSync(p).isFile();
                    }
                    catch {
                        return false;
                    }
                });
                if (foundPath) {
                    const imgBuffer = fs_1.default.readFileSync(foundPath);
                    const ext = path_1.default.extname(foundPath).replace('.', '') || 'png';
                    val = `data:image/${ext};base64,${imgBuffer.toString('base64')}`;
                }
                else if (/^[A-Za-z0-9+/]+=*$/.test(val) && val.length > 20) {
                    // Raw base64 without data URI prefix
                    val = `data:image/png;base64,${val}`;
                }
            }
            // For image fields, the value is the data URI that getImage will process
        }
        // Table array handling: format text representation for simple tag replacement
        if ((field.type === 'table' || field.type === 'table_contents') && Array.isArray(val)) {
            const formattedText = formatTableAsText(val, field.columns);
            if (field.tag) {
                const cleanTag = String(field.tag).replace(/[{}]/g, '').trim();
                data[cleanTag + '_text'] = formattedText;
            }
            data[field.id + '_text'] = formattedText;
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
    // 2. Add all raw formData keys into data (for non-image fields)
    Object.entries(formData).forEach(([k, v]) => {
        let finalVal = v;
        if (typeof v === 'string' && (v.includes('<p>') || v.includes('<br>') || v.includes('<div>'))) {
            finalVal = cleanHtmlText(v);
        }
        if (data[k] === undefined || data[k] === '') {
            data[k] = finalVal ?? '';
        }
        // Also assign clean tag without braces
        const cleanKey = k.replace(/[{}]/g, '').trim();
        if (data[cleanKey] === undefined || data[cleanKey] === '') {
            data[cleanKey] = finalVal ?? '';
        }
    });
    // Render document with data
    doc.render(data);
    return doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    });
}
//# sourceMappingURL=docx.service.js.map