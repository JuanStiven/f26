"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBase64ToFile = saveBase64ToFile;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const prisma_1 = __importDefault(require("../models/prisma"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function saveBase64ToFile(base64Str, subfolder, prefix) {
    if (!base64Str || typeof base64Str !== 'string')
        return base64Str;
    const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches)
        return base64Str;
    const mimeExt = matches[1].toLowerCase().replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
    const targetFolder = path_1.default.join(uploadsDir, subfolder);
    if (!fs_1.default.existsSync(targetFolder)) {
        fs_1.default.mkdirSync(targetFolder, { recursive: true });
    }
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${mimeExt}`;
    const fullPath = path_1.default.join(targetFolder, filename);
    fs_1.default.writeFileSync(fullPath, buffer);
    const relativePath = path_1.default.relative(uploadsDir, fullPath).replace(/\\/g, '/');
    return `/uploads/${relativePath}`;
}
async function getSettings() {
    // Siempre debe haber exactamente un registro
    let settings = await prisma_1.default.companySettings.findFirst();
    if (!settings) {
        settings = await prisma_1.default.companySettings.create({ data: {} });
    }
    return settings;
}
async function updateSettings(data) {
    let settings = await prisma_1.default.companySettings.findFirst();
    if (data.logoUrl && data.logoUrl.startsWith('data:image/')) {
        data.logoUrl = saveBase64ToFile(data.logoUrl, 'logo', 'logo');
    }
    if (!settings) {
        return prisma_1.default.companySettings.create({ data });
    }
    return prisma_1.default.companySettings.update({
        where: { id: settings.id },
        data,
    });
}
//# sourceMappingURL=company.service.js.map