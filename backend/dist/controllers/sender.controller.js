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
exports.update = update;
exports.remove = remove;
const senderService = __importStar(require("../services/sender.service"));
const helpers_1 = require("../middlewares/helpers");
async function getAll(req, res) {
    try {
        const senders = await senderService.getAllSenders();
        res.json({ success: true, data: senders });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function create(req, res) {
    try {
        const { name, nit, phone } = req.body;
        if (!name || !nit || !phone) {
            res.status(400).json({ success: false, message: 'Nombre, NIT y teléfono son requeridos.' });
            return;
        }
        const sender = await senderService.createSender({ name, nit, phone });
        res.status(201).json({ success: true, data: sender });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function update(req, res) {
    try {
        const sender = await senderService.updateSender((0, helpers_1.getParam)(req, 'id'), req.body);
        res.json({ success: true, data: sender });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
async function remove(req, res) {
    try {
        await senderService.deleteSender((0, helpers_1.getParam)(req, 'id'));
        res.json({ success: true, message: 'Remitente eliminado correctamente.' });
    }
    catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=sender.controller.js.map