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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = getAll;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.remove = remove;
const templateService = __importStar(require("../services/template.service"));
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
        const { name, description, storagePath, fields } = req.body;
        if (!name || !fields || !Array.isArray(fields)) {
            res.status(400).json({ success: false, message: 'Nombre y campos son requeridos.' });
            return;
        }
        const template = await templateService.createTemplate({ name, description, storagePath, fields });
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
//# sourceMappingURL=template.controller.js.map