import prisma from '../models/prisma';
import path from 'path';
import fs from 'fs';

export async function getAllDocuments() {
  return prisma.signedDocument.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true, storagePath: true } },
      filledBy: { select: { name: true, document: true } },
    },
  });
}

export async function getDocumentsByUserId(userId: string) {
  return prisma.signedDocument.findMany({
    where: { filledById: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true, description: true } }
    },
  });
}

export async function getDocumentById(id: string) {
  const doc = await prisma.signedDocument.findUnique({
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

export async function createDocument(data: {
  templateId: string;
  filledById: string;
  formData: any;
  photoUrl?: string;
  signatureUrl?: string;
}) {
  // Verificar que la plantilla existe
  const template = await prisma.template.findUnique({ where: { id: data.templateId } });
  if (!template) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  // Verificar que el empleado existe
  const user = await prisma.user.findUnique({ where: { id: data.filledById } });
  if (!user) {
    throw { status: 404, message: 'Empleado no encontrado.' };
  }

  // Construir ruta de archivo en el servidor
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const storagePath = template.storagePath || 'general';
  const folderPath = path.join(uploadsDir, storagePath);

  // Crear directorio si no existe
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Nombre del archivo: Template_Empleado_Timestamp.json
  const sanitizedName = template.name.replace(/\s+/g, '_');
  const sanitizedUser = user.name.replace(/\s+/g, '_');
  const timestamp = Date.now();
  const fileName = `${sanitizedName}_${sanitizedUser}_${timestamp}.json`;
  const filePath = path.join(storagePath, fileName);

  // Guardar los datos del formulario en disco
  const fullFilePath = path.join(folderPath, fileName);
  fs.writeFileSync(fullFilePath, JSON.stringify({
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
  return prisma.signedDocument.create({
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

export async function updateSyncStatus(id: string, syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE') {
  const exists = await prisma.signedDocument.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Documento no encontrado.' };
  }

  return prisma.signedDocument.update({
    where: { id },
    data: { syncStatus },
  });
}

export async function deleteDocument(id: string) {
  const doc = await prisma.signedDocument.findUnique({ where: { id } });
  if (!doc) {
    throw { status: 404, message: 'Documento no encontrado.' };
  }

  // Eliminar archivo físico si existe
  if (doc.filePath) {
    const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
    const fullPath = path.join(uploadsDir, doc.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  return prisma.signedDocument.delete({ where: { id } });
}
