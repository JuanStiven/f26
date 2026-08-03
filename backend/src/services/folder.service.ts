import prisma from '../models/prisma';
import path from 'path';
import fs from 'fs';
import { deleteTemplate } from './template.service';
import { deleteDocument } from './document.service';

/**
 * Listar todas las carpetas del sistema
 */
export async function getAllFolders() {
  const folders = await prisma.folder.findMany({ orderBy: { path: 'asc' } });
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  for (const f of folders) {
    const fullPath = path.join(uploadsDir, f.path);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
  return folders;
}

/**
 * Obtener carpeta por path
 */
export async function getFolderByPath(folderPath: string) {
  return prisma.folder.findUnique({ where: { path: folderPath } });
}

/**
 * Crear carpeta en BD y en disco
 */
export async function createFolder(data: { name: string; parentPath?: string }) {
  const folderPath = data.parentPath ? `${data.parentPath}/${data.name}` : data.name;

  // Verificar duplicado
  const exists = await prisma.folder.findUnique({ where: { path: folderPath } });
  if (exists) {
    throw { status: 409, message: 'Ya existe una carpeta con esa ruta.' };
  }

  // Crear en disco
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const fullPath = path.join(uploadsDir, folderPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return prisma.folder.create({
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
export async function renameFolder(id: string, newName: string) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) {
    throw { status: 404, message: 'Carpeta no encontrada.' };
  }

  const oldPath = folder.path;
  const parentPath = folder.parentPath || '';
  const newPath = parentPath ? `${parentPath}/${newName}` : newName;

  // Verificar duplicado en nueva ruta
  const duplicate = await prisma.folder.findUnique({ where: { path: newPath } });
  if (duplicate) {
    throw { status: 409, message: 'Ya existe una carpeta con ese nombre en esa ubicación.' };
  }

  // Renombrar en disco
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const oldFullPath = path.join(uploadsDir, oldPath);
  const newFullPath = path.join(uploadsDir, newPath);
  if (fs.existsSync(oldFullPath)) {
    fs.renameSync(oldFullPath, newFullPath);
  }

  // Actualizar carpeta principal
  await prisma.folder.update({
    where: { id },
    data: { name: newName, path: newPath },
  });

  // Actualizar todos los descendientes (subcarpetas)
  const descendants = await prisma.folder.findMany({
    where: { path: { startsWith: oldPath + '/' } },
  });

  for (const desc of descendants) {
    const updatedDescPath = newPath + desc.path.substring(oldPath.length);
    const updatedParent = desc.parentPath === oldPath 
      ? newPath 
      : desc.parentPath 
        ? newPath + desc.parentPath.substring(oldPath.length) 
        : null;

    await prisma.folder.update({
      where: { id: desc.id },
      data: { path: updatedDescPath, parentPath: updatedParent },
    });
  }

  return { id, name: newName, path: newPath };
}

/**
 * Mover carpeta a una nueva ubicación
 */
export async function moveFolder(id: string, newParentPath: string | null) {
  const folder = await prisma.folder.findUnique({ where: { id } });
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
  const duplicate = await prisma.folder.findUnique({ where: { path: newPath } });
  if (duplicate) {
    throw { status: 409, message: 'Ya existe una carpeta con ese nombre en el destino.' };
  }

  // Mover en disco
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const oldFullPath = path.join(uploadsDir, oldPath);
  const newFullPath = path.join(uploadsDir, newPath);
  
  // Crear el directorio padre si no existe
  const newParentFull = path.dirname(newFullPath);
  if (!fs.existsSync(newParentFull)) {
    fs.mkdirSync(newParentFull, { recursive: true });
  }

  if (fs.existsSync(oldFullPath)) {
    fs.renameSync(oldFullPath, newFullPath);
  }

  // Actualizar carpeta principal
  await prisma.folder.update({
    where: { id },
    data: { path: newPath, parentPath: newParentPath },
  });

  // Actualizar descendientes
  const descendants = await prisma.folder.findMany({
    where: { path: { startsWith: oldPath + '/' } },
  });

  for (const desc of descendants) {
    const updatedDescPath = newPath + desc.path.substring(oldPath.length);
    const updatedParent = desc.parentPath === oldPath 
      ? newPath 
      : desc.parentPath
        ? newPath + desc.parentPath.substring(oldPath.length)
        : null;

    await prisma.folder.update({
      where: { id: desc.id },
      data: { path: updatedDescPath, parentPath: updatedParent },
    });
  }

  return { id, name: folder.name, path: newPath };
}

/**
 * Eliminar carpeta y todos sus descendientes
 * Incluye cascada: borra plantillas cuyo storagePath está dentro de la carpeta
 * y documentos cuyo filePath está dentro de la carpeta (BD + archivo físico).
 */
export async function deleteFolder(id: string) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) {
    throw { status: 404, message: 'Carpeta no encontrada.' };
  }

  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const prefix = folder.path + '/';
  const inside = (p?: string | null) => !!p && (p === folder.path || p.startsWith(prefix));

  // ─── 1. Eliminar documentos cuyo filePath esté dentro de la carpeta (BD + PDF físico) ───
  const docs = await prisma.signedDocument.findMany({
    where: {
      OR: [
        { filePath: folder.path },
        { filePath: { startsWith: prefix } },
      ],
    },
    select: { id: true },
  });

  for (const doc of docs) {
    await deleteDocument(doc.id);
  }

  // ─── 2. Eliminar plantillas cuyo storagePath esté dentro de la carpeta ───
  const tpls = await prisma.template.findMany({
    where: {
      OR: [
        { storagePath: folder.path },
        { storagePath: { startsWith: prefix } },
      ],
    },
    select: { id: true },
  });
  for (const tpl of tpls) {
    await deleteTemplate(tpl.id);
  }

  // ─── 3. Eliminar subcarpetas (BD) ───
  await prisma.folder.deleteMany({
    where: { path: { startsWith: prefix } },
  });

  // ─── 4. Eliminar la carpeta (BD) ───
  await prisma.folder.delete({ where: { id } });

  // ─── 5. Eliminar del disco (contenido restante) ───
  const fullPath = path.join(uploadsDir, folder.path);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }

  return { message: 'Carpeta y su contenido eliminados correctamente.' };
}

/**
 * Listar archivos físicos en una ruta (complemento al árbol de BD)
 */
export async function listFilesInPath(folderPath: string) {
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const fullPath = path.join(uploadsDir, folderPath);

  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  return entries.map(entry => ({
    name: entry.name,
    type: entry.isDirectory() ? 'folder' : 'file',
    path: `${folderPath}/${entry.name}`,
    size: entry.isFile() 
      ? formatFileSize(fs.statSync(path.join(fullPath, entry.name)).size) 
      : undefined,
  }));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
