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
exports.getHistory = getHistory;
exports.getById = getById;
exports.create = create;
exports.updateSync = updateSync;
exports.remove = remove;
const documentService = __importStar(require("../services/document.service"));
const helpers_1 = require("../middlewares/helpers");
async function getAll(req, res) {
    try {
        const documents = await documentService.getAllDocuments();
        res.json({ success: true, data: documents });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function getHistory(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'No autenticado' });
            return;
        }
        const documents = await documentService.getDocumentsByUserId(userId);
        res.json({ success: true, data: documents });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function getById(req, res) {
    try {
        const document = await documentService.getDocumentById((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, data: document });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function create(req, res) {
    try {
        const { templateId, formData, photoUrl, signatureUrl } = req.body;
        if (!templateId || !formData) {
            res.status(400).json({ success: false, message: 'templateId y formData son requeridos.' });
            return;
        }
        // El filledById viene del token JWT del empleado autenticado
        const filledById = req.user?.userId;
        if (!filledById) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
            return;
        }
        const document = await documentService.createDocument({
            templateId,
            filledById,
            formData,
            photoUrl,
            signatureUrl,
        });
        res.status(201).json({ success: true, data: document });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function updateSync(req, res) {
    try {
        const { syncStatus } = req.body;
        const document = await documentService.updateSyncStatus((0, helpers_1.getParam)(req, 'id'), syncStatus);
        res.json({ success: true, data: document });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function remove(req, res) {
    try {
        await documentService.deleteDocument((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, message: 'Documento eliminado correctamente.' });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=document.controller.js.map