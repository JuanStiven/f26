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
exports.create = create;
exports.rename = rename;
exports.move = move;
exports.remove = remove;
exports.listFiles = listFiles;
const folderService = __importStar(require("../services/folder.service"));
const helpers_1 = require("../middlewares/helpers");
async function getAll(req, res) {
    try {
        const folders = await folderService.getAllFolders();
        res.json({ success: true, data: folders });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function create(req, res) {
    try {
        const { name, parentPath } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: 'Nombre de la carpeta es requerido.' });
            return;
        }
        const folder = await folderService.createFolder({ name, parentPath });
        res.status(201).json({ success: true, data: folder });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function rename(req, res) {
    try {
        const { newName } = req.body;
        if (!newName) {
            res.status(400).json({ success: false, message: 'Nuevo nombre es requerido.' });
            return;
        }
        const result = await folderService.renameFolder((0, helpers_1.getParam)(req, 'id'), newName);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function move(req, res) {
    try {
        const { newParentPath } = req.body;
        const result = await folderService.moveFolder((0, helpers_1.getParam)(req, 'id'), newParentPath || null);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function remove(req, res) {
    try {
        const result = await folderService.deleteFolder((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function listFiles(req, res) {
    try {
        const folderPath = req.query.path || '';
        const files = await folderService.listFilesInPath(folderPath);
        res.json({ success: true, data: files });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=folder.controller.js.map