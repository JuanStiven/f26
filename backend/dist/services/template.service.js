"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTemplates = getAllTemplates;
exports.getTemplatesForUser = getTemplatesForUser;
exports.getTemplateById = getTemplateById;
exports.createTemplate = createTemplate;
exports.updateTemplate = updateTemplate;
exports.deleteTemplate = deleteTemplate;
const prisma_1 = __importDefault(require("../models/prisma"));
async function getAllTemplates() {
    return prisma_1.default.template.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { signedDocuments: true } },
            assignedUsers: { select: { id: true, name: true, document: true } }
        },
    });
}
async function getTemplatesForUser(userId, role) {
    if (role === 'ADMIN') {
        return getAllTemplates();
    }
    else {
        return prisma_1.default.template.findMany({
            where: {
                assignedUsers: {
                    some: {
                        id: userId
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { signedDocuments: true } },
            },
        });
    }
}
async function getTemplateById(id) {
    const template = await prisma_1.default.template.findUnique({
        where: { id },
        include: {
            signedDocuments: {
                include: { filledBy: { select: { name: true, document: true } } },
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    });
    if (!template) {
        throw { status: 404, message: 'Plantilla no encontrada.' };
    }
    return template;
}
async function createTemplate(data) {
    return prisma_1.default.template.create({
        data: {
            name: data.name,
            description: data.description || '',
            storagePath: data.storagePath || '',
            fields: data.fields,
            assignedUsers: data.assignedUsers ? {
                connect: data.assignedUsers.map(id => ({ id }))
            } : undefined
        },
        include: {
            _count: { select: { signedDocuments: true } },
            assignedUsers: { select: { id: true, name: true, document: true } }
        }
    });
}
async function updateTemplate(id, data) {
    const exists = await prisma_1.default.template.findUnique({ where: { id } });
    if (!exists) {
        throw { status: 404, message: 'Plantilla no encontrada.' };
    }
    return prisma_1.default.template.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.storagePath !== undefined && { storagePath: data.storagePath }),
            ...(data.fields !== undefined && { fields: data.fields }),
            ...(data.assignedUsers !== undefined && {
                assignedUsers: {
                    set: data.assignedUsers.map(userId => ({ id: userId }))
                }
            })
        },
        include: {
            _count: { select: { signedDocuments: true } },
            assignedUsers: { select: { id: true, name: true, document: true } }
        }
    });
}
async function deleteTemplate(id) {
    const exists = await prisma_1.default.template.findUnique({ where: { id } });
    if (!exists) {
        throw { status: 404, message: 'Plantilla no encontrada.' };
    }
    return prisma_1.default.template.delete({ where: { id } });
}
//# sourceMappingURL=template.service.js.map