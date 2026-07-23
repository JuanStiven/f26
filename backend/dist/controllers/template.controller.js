"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = getAll;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.getVersions = getVersions;
exports.exportRecords = exportRecords;
exports.uploadDocxTemplate = uploadDocxTemplate;
const path_1 = __importDefault(require("path"));
const templateService = __importStar(require("../services/template.service"));
const docx_service_1 = require("../services/docx.service");
const helpers_1 = require("../middlewares/helpers");
async function getAll(req, res) {
    try {
        if (req.user) {
            const templates = await templateService.getTemplatesForUser(req.user.userId, req.user.role);
            res.json({ success: true, data: templates });
            return;
        }
        const templates = await templateService.getAllTemplates();
        res.json({ success: true, data: templates });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function getById(req, res) {
    try {
        const template = await templateService.getTemplateById((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, data: template });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function create(req, res) {
    try {
        const { name, fields } = req.body;
        if (!name || !fields || !Array.isArray(fields)) {
            res.status(400).json({ success: false, message: 'Nombre y campos son requeridos.' });
            return;
        }
        const template = await templateService.createTemplate(req.body);
        res.status(201).json({ success: true, data: template });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function update(req, res) {
    try {
        const template = await templateService.updateTemplate((0, helpers_1.getParam)(req, 'id'), req.body);
        res.json({ success: true, data: template });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function remove(req, res) {
    try {
        await templateService.deleteTemplate((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, message: 'Plantilla eliminada correctamente.' });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function getVersions(req, res) {
    try {
        const versions = await templateService.getTemplateVersions((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, data: versions });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function exportRecords(req, res) {
    try {
        const templateId = (0, helpers_1.getParam)(req, 'id');
        const version = String(req.query.version || 'Sin versión');
        const csvContent = await templateService.exportTemplateRecords(templateId, version);
        // Set headers to trigger file download in Excel-friendly CSV with UTF-8 BOM
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="registros_plantilla_${version}.csv"`);
        res.write('\uFEFF'); // Write Byte Order Mark (BOM) for Excel
        res.end(csvContent);
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function uploadDocxTemplate(req, res) {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No se recibió ningún archivo .docx.' });
            return;
        }
        const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
        const relativePath = path_1.default.relative(uploadsDir, req.file.path);
        const parseResult = await (0, docx_service_1.parseDocxTemplate)(req.file.path);
        res.json({
            success: true,
            data: {
                docxFilePath: relativePath,
                docxOriginalName: req.file.originalname,
                htmlPreview: parseResult.html,
                rawText: parseResult.rawText,
                detectedTags: parseResult.detectedTags,
            },
        });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || 'Error al procesar la plantilla .docx' });
    }
}
//# sourceMappingURL=template.controller.js.map