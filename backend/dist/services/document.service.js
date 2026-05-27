"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDocuments = getAllDocuments;
exports.getDocumentsByUserId = getDocumentsByUserId;
exports.getDocumentById = getDocumentById;
exports.createDocument = createDocument;
exports.updateSyncStatus = updateSyncStatus;
exports.deleteDocument = deleteDocument;
const prisma_1 = __importDefault(require("../models/prisma"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function getAllDocuments() {
    return prisma_1.default.signedDocument.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            template: { select: { name: true, storagePath: true } },
            filledBy: { select: { name: true, document: true } },
        },
    });
}
async function getDocumentsByUserId(userId) {
    return prisma_1.default.signedDocument.findMany({
        where: { filledById: userId },
        orderBy: { createdAt: 'desc' },
        include: {
            template: { select: { name: true, description: true } }
        },
    });
}
async function getDocumentById(id) {
    const doc = await prisma_1.default.signedDocument.findUnique({
        where: { id },
        include: {
            template: true,
            filledBy: { select: { name: true, document: true, position: true } },
        },
    });
    if (!doc) {
        throw { status: 404, message: 'Documento no encontrado.' };
    }
    return doc;
}
async function createDocument(data) {
    // Verificar que la plantilla existe
    const template = await prisma_1.default.template.findUnique({ where: { id: data.templateId } });
    if (!template) {
        throw { status: 404, message: 'Plantilla no encontrada.' };
    }
    // Verificar que el empleado existe
    const user = await prisma_1.default.user.findUnique({ where: { id: data.filledById } });
    if (!user) {
        throw { status: 404, message: 'Empleado no encontrado.' };
    }
    // Construir ruta de archivo en el servidor
    const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
    const storagePath = template.storagePath || 'general';
    const folderPath = path_1.default.join(uploadsDir, storagePath);
    // Crear directorio si no existe
    if (!fs_1.default.existsSync(folderPath)) {
        fs_1.default.mkdirSync(folderPath, { recursive: true });
    }
    // Nombre del archivo: Template_Empleado_Timestamp.json
    const sanitizedName = template.name.replace(/\s+/g, '_');
    const sanitizedUser = user.name.replace(/\s+/g, '_');
    const timestamp = Date.now();
    const fileName = `${sanitizedName}_${sanitizedUser}_${timestamp}.json`;
    const filePath = path_1.default.join(storagePath, fileName);
    // Guardar los datos del formulario en disco
    const fullFilePath = path_1.default.join(folderPath, fileName);
    fs_1.default.writeFileSync(fullFilePath, JSON.stringify({
        templateId: template.id,
        templateName: template.name,
        filledBy: user.name,
        filledByDoc: user.document,
        data: data.formData,
        photoUrl: data.photoUrl,
        signatureUrl: data.signatureUrl,
        submittedAt: new Date().toISOString(),
    }, null, 2));
    // Guardar registro en la base de datos
    return prisma_1.default.signedDocument.create({
        data: {
            templateId: data.templateId,
            filledById: data.filledById,
            data: data.formData,
            photoUrl: data.photoUrl || null,
            signatureUrl: data.signatureUrl || null,
            syncStatus: 'SYNCED',
            filePath,
        },
        include: {
            template: { select: { name: true } },
            filledBy: { select: { name: true } },
        },
    });
}
async function updateSyncStatus(id, syncStatus) {
    const exists = await prisma_1.default.signedDocument.findUnique({ where: { id } });
    if (!exists) {
        throw { status: 404, message: 'Documento no encontrado.' };
    }
    return prisma_1.default.signedDocument.update({
        where: { id },
        data: { syncStatus },
    });
}
async function deleteDocument(id) {
    const doc = await prisma_1.default.signedDocument.findUnique({ where: { id } });
    if (!doc) {
        throw { status: 404, message: 'Documento no encontrado.' };
    }
    // Eliminar archivo físico si existe
    if (doc.filePath) {
        const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
        const fullPath = path_1.default.join(uploadsDir, doc.filePath);
        if (fs_1.default.existsSync(fullPath)) {
            fs_1.default.unlinkSync(fullPath);
        }
    }
    return prisma_1.default.signedDocument.delete({ where: { id } });
}
//# sourceMappingURL=document.service.js.map