"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSenders = getAllSenders;
exports.createSender = createSender;
exports.updateSender = updateSender;
exports.deleteSender = deleteSender;
const prisma_1 = __importDefault(require("../models/prisma"));
async function getAllSenders() {
    return prisma_1.default.sender.findMany({ orderBy: { createdAt: 'desc' } });
}
async function createSender(data) {
    return prisma_1.default.sender.create({ data });
}
async function updateSender(id, data) {
    const exists = await prisma_1.default.sender.findUnique({ where: { id } });
    if (!exists) {
        throw { status: 404, message: 'Remitente no encontrado.' };
    }
    return prisma_1.default.sender.update({ where: { id }, data });
}
async function deleteSender(id) {
    const exists = await prisma_1.default.sender.findUnique({ where: { id } });
    if (!exists) {
        throw { status: 404, message: 'Remitente no encontrado.' };
    }
    return prisma_1.default.sender.delete({ where: { id } });
}
//# sourceMappingURL=sender.service.js.map