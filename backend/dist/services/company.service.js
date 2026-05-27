"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const prisma_1 = __importDefault(require("../models/prisma"));
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
    if (!settings) {
        return prisma_1.default.companySettings.create({ data });
    }
    return prisma_1.default.companySettings.update({
        where: { id: settings.id },
        data,
    });
}
//# sourceMappingURL=company.service.js.map