"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatest = getLatest;
exports.getAll = getAll;
exports.create = create;
exports.setActive = setActive;
exports.remove = remove;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../models/prisma"));
const helpers_1 = require("../middlewares/helpers");
const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
// ─── Público: última versión activa (para la app móvil) ───
async function getLatest(_req, res) {
    try {
        const latest = await prisma_1.default.appVersion.findFirst({
            where: { isActive: true },
            orderBy: { versionCode: 'desc' },
        });
        if (!latest) {
            res.json({ success: true, data: null });
            return;
        }
        res.json({ success: true, data: latest });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// ─── Admin: listar todas las versiones ───
async function getAll(_req, res) {
    try {
        const versions = await prisma_1.default.appVersion.findMany({
            orderBy: { versionCode: 'desc' },
        });
        res.json({ success: true, data: versions });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// ─── Admin: subir nueva versión con APK ───
async function create(req, res) {
    try {
        const body = (req.body ?? {});
        const versionCode = body.versionCode;
        const versionName = body.versionName;
        const changelog = body.changelog;
        const file = req.file;
        if (!file) {
            res.status(400).json({ success: false, message: 'Debe adjuntar el archivo APK.' });
            return;
        }
        if (!versionCode || !versionName) {
            res.status(400).json({ success: false, message: 'versionCode y versionName son obligatorios.' });
            return;
        }
        const apkPath = `/uploads/apk/${file.filename}`;
        // Desactivar versiones anteriores para que "latest" sea la nueva
        await prisma_1.default.appVersion.updateMany({
            where: { isActive: true },
            data: { isActive: false },
        });
        const version = await prisma_1.default.appVersion.create({
            data: {
                versionCode: parseInt(String(versionCode), 10),
                versionName: String(versionName),
                apkPath,
                apkSize: file.size,
                changelog: changelog ? String(changelog) : null,
                isActive: true,
            },
        });
        res.json({ success: true, data: version });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// ─── Admin: activar/desactivar versión ───
async function setActive(req, res) {
    try {
        const id = (0, helpers_1.getParam)(req, 'id');
        const body = (req.body ?? {});
        const isActive = body.isActive === true || body.isActive === 'true';
        if (isActive) {
            // Al activar una, desactivar las demás
            await prisma_1.default.appVersion.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });
        }
        const version = await prisma_1.default.appVersion.update({
            where: { id },
            data: { isActive },
        });
        res.json({ success: true, data: version });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// ─── Admin: eliminar versión y archivo ───
async function remove(req, res) {
    try {
        const id = (0, helpers_1.getParam)(req, 'id');
        const version = await prisma_1.default.appVersion.findUnique({ where: { id } });
        if (version) {
            // Eliminar archivo físico si existe
            const fileName = path_1.default.basename(version.apkPath);
            const filePath = path_1.default.join(uploadsDir, 'apk', fileName);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            await prisma_1.default.appVersion.delete({ where: { id } });
        }
        res.json({ success: true, message: 'Versión eliminada.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=appVersion.controller.js.map