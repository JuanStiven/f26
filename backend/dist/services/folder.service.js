"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFolders = getAllFolders;
exports.getFolderByPath = getFolderByPath;
exports.createFolder = createFolder;
exports.renameFolder = renameFolder;
exports.moveFolder = moveFolder;
exports.deleteFolder = deleteFolder;
exports.listFilesInPath = listFilesInPath;
const prisma_1 = __importDefault(require("../models/prisma"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Listar todas las carpetas del sistema
 */
async function getAllFolders() {
    return prisma_1.default.folder.findMany({ orderBy: { path: 'asc' } });
}
/**
 * Obtener carpeta por path
 */
async function getFolderByPath(folderPath) {
    return prisma_1.default.folder.findUnique({ where: { path: folderPath } });
}
/**
 * Crear carpeta en BD y en disco
 */
async function createFolder(data) {
    const folderPath = data.parentPath ? `${data.parentPath}/${data.name}` : data.name;
    // Verificar duplicado
    const exists = await prisma_1.default.folder.findUnique({ where: { path: folderPath } });
    if (exists) {
        throw { status: 409, message: 'Ya existe una carpeta con esa ruta.' };
    }
    // Crear en disco
    const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
    const fullPath = path_1.default.join(uploadsDir, folderPath);
    if (!fs_1.default.existsSync(fullPath)) {
        fs_1.default.mkdirSync(fullPath, { recursive: true });
    }
    return prisma_1.default.folder.create({
        data: {
            name: data.name,
            path: folderPath,
            parentPath: data.parentPath || null,
        },
    });
}
/**
 * Renombrar carpeta (actualizar nombre y ruta de ella y sus descendientes)
 */
async function renameFolder(id, newName) {
    const folder = await prisma_1.default.folder.findUnique({ where: { id } });
    if (!folder) {
        throw { status: 404, message: 'Carpeta no encontrada.' };
    }
    const oldPath = folder.path;
    const parentPath = folder.parentPath || '';
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
    // Verificar duplicado en nueva ruta
    const duplicate = await prisma_1.default.folder.findUnique({ where: { path: newPath } });
    if (duplicate) {
        throw { status: 409, message: 'Ya existe una carpeta con ese nombre en esa ubicación.' };
    }
    // Renombrar en disco
    const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
    const oldFullPath = path_1.default.join(uploadsDir, oldPath);
    const newFullPath = path_1.default.join(uploadsDir, newPath);
    if (fs_1.default.existsSync(oldFullPath)) {
        fs_1.default.renameSync(oldFullPath, newFullPath);
    }
    // Actualizar carpeta principal
    await prisma_1.default.folder.update({
        where: { id },
        data: { name: newName, path: newPath },
    });
    // Actualizar todos los descendientes (subcarpetas)
    const descendants = await prisma_1.default.folder.findMany({
        where: { path: { startsWith: oldPath + '/' } },
    });
    for (const desc of descendants) {
        const updatedDescPath = newPath + desc.path.substring(oldPath.length);
        const updatedParent = desc.parentPath === oldPath
            ? newPath
            : desc.parentPath
                ? newPath + desc.parentPath.substring(oldPath.length)
                : null;
        await prisma_1.default.folder.update({
            where: { id: desc.id },
            data: { path: updatedDescPath, parentPath: updatedParent },
        });
    }
    return { id, name: newName, path: newPath };
}
/**
 * Mover carpeta a una nueva ubicación
 */
async function moveFolder(id, newParentPath) {
    const folder = await prisma_1.default.folder.findUnique({ where: { id } });
    if (!folder) {
        throw { status: 404, message: 'Carpeta no encontrada.' };
    }
    const oldPath = folder.path;
    const dest = newParentPath || '';
    const newPath = dest ? `${dest}/${folder.name}` : folder.name;
    // No mover dentro de sí misma
    if (newPath.startsWith(oldPath + '/')) {
        throw { status: 400, message: 'No puedes mover una carpeta dentro de sí misma.' };
    }
    // Verificar duplicado en destino
    const duplicate = await prisma_1.default.folder.findUnique({ where: { path: newPath } });
    if (duplicate) {
        throw { status: 409, message: 'Ya existe una carpeta con ese nombre en el destino.' };
    }
    // Mover en disco
    const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
    const oldFullPath = path_1.default.join(uploadsDir, oldPath);
    const newFullPath = path_1.default.join(uploadsDir, newPath);
    // Crear el directorio padre si no existe
    const newParentFull = path_1.default.dirname(newFullPath);
    if (!fs_1.default.existsSync(newParentFull)) {
        fs_1.default.mkdirSync(newParentFull, { recursive: true });
    }
    if (fs_1.default.existsSync(oldFullPath)) {
        fs_1.default.renameSync(oldFullPath, newFullPath);
    }
    // Actualizar carpeta principal
    await prisma_1.default.folder.update({
        where: { id },
        data: { path: newPath, parentPath: newParentPath },
    });
    // Actualizar descendientes
    const descendants = await prisma_1.default.folder.findMany({
        where: { path: { startsWith: oldPath + '/' } },
    });
    for (const desc of descendants) {
        const updatedDescPath = newPath + desc.path.substring(oldPath.length);
        const updatedParent = desc.parentPath === oldPath
            ? newPath
            : desc.parentPath
                ? newPath + desc.parentPath.substring(oldPath.length)
                : null;
        await prisma_1.default.folder.update({
            where: { id: desc.id },
            data: { path: updatedDescPath, parentPath: updatedParent },
        });
    }
    return { id, name: folder.name, path: newPath };
}
/**
 * Eliminar carpeta y todos sus descendientes
 */
async function deleteFolder(id) {
    const folder = await prisma_1.default.folder.findUnique({ where: { id } });
    if (!folder) {
        throw { status: 404, message: 'Carpeta no encontrada.' };
    }
    // Eliminar descendientes primero
    await prisma_1.default.folder.deleteMany({
        where: { path: { startsWith: folder.path + '/' } },
    });
    // Eliminar la carpeta
    await prisma_1.default.folder.delete({ where: { id } });
    // Eliminar del disco
    const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
    const fullPath = path_1.default.join(uploadsDir, folder.path);
    if (fs_1.default.existsSync(fullPath)) {
        fs_1.default.rmSync(fullPath, { recursive: true, force: true });
    }
    return { message: 'Carpeta eliminada correctamente.' };
}
/**
 * Listar archivos físicos en una ruta (complemento al árbol de BD)
 */
async function listFilesInPath(folderPath) {
    const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR || './uploads');
    const fullPath = path_1.default.join(uploadsDir, folderPath);
    if (!fs_1.default.existsSync(fullPath)) {
        return [];
    }
    const entries = fs_1.default.readdirSync(fullPath, { withFileTypes: true });
    return entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'folder' : 'file',
        path: `${folderPath}/${entry.name}`,
        size: entry.isFile()
            ? formatFileSize(fs_1.default.statSync(path_1.default.join(fullPath, entry.name)).size)
            : undefined,
    }));
}
function formatFileSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
//# sourceMappingURL=folder.service.js.map