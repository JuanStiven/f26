import prisma from '../models/prisma';
import { Prisma } from '@prisma/client';

export async function getAllTemplates() {
  return prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { signedDocuments: true } },
      assignedUsers: { select: { id: true, name: true, document: true } }
    },
  });
}

export async function getTemplatesForUser(userId: string, role: string) {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return getAllTemplates();
  } else {
    return prisma.template.findMany({
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

export async function getTemplateById(id: string) {
  const template = await prisma.template.findUnique({
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

export async function createTemplate(data: {
  name: string;
  description?: string;
  descriptionStyles?: string;
  footer?: string;
  storagePath?: string;
  fields: any[];
  assignedUsers?: string[];
  isQualityDocument?: boolean;
  qualityCode?: string;
  qualityVersion?: string;
  qualityDate?: string;
  isCreativeMode?: boolean;
  creativeElements?: any;
  isDocxTemplate?: boolean;
  docxFilePath?: string;
  docxOriginalName?: string;
}) {
  return prisma.template.create({
    data: {
      name: data.name,
      description: data.description || '',
      descriptionStyles: data.descriptionStyles || '',
      footer: data.footer || '',
      storagePath: data.storagePath || '',
      fields: data.fields,
      isQualityDocument: data.isQualityDocument || false,
      qualityCode: data.qualityCode || '',
      qualityVersion: data.qualityVersion || '',
      qualityDate: data.qualityDate || '',
      isCreativeMode: data.isCreativeMode || false,
      creativeElements: data.creativeElements || [],
      isDocxTemplate: data.isDocxTemplate || false,
      docxFilePath: data.docxFilePath || null,
      docxOriginalName: data.docxOriginalName || null,
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

export async function updateTemplate(
  id: string,
  data: { name?: string; description?: string; descriptionStyles?: string; footer?: string; storagePath?: string; fields?: any[]; assignedUsers?: string[]; isQualityDocument?: boolean; qualityCode?: string; qualityVersion?: string; qualityDate?: string; isCreativeMode?: boolean; creativeElements?: any; isDocxTemplate?: boolean; docxFilePath?: string; docxOriginalName?: string; }
) {
  const exists = await prisma.template.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  return prisma.template.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.descriptionStyles !== undefined && { descriptionStyles: data.descriptionStyles }),
      ...(data.footer !== undefined && { footer: data.footer }),
      ...(data.storagePath !== undefined && { storagePath: data.storagePath }),
      ...(data.fields !== undefined && { fields: data.fields }),
      ...(data.isQualityDocument !== undefined && { isQualityDocument: data.isQualityDocument }),
      ...(data.qualityCode !== undefined && { qualityCode: data.qualityCode }),
      ...(data.qualityVersion !== undefined && { qualityVersion: data.qualityVersion }),
      ...(data.qualityDate !== undefined && { qualityDate: data.qualityDate }),
      ...(data.isCreativeMode !== undefined && { isCreativeMode: data.isCreativeMode }),
      ...(data.creativeElements !== undefined && { creativeElements: data.creativeElements }),
      ...(data.isDocxTemplate !== undefined && { isDocxTemplate: data.isDocxTemplate }),
      ...(data.docxFilePath !== undefined && { docxFilePath: data.docxFilePath }),
      ...(data.docxOriginalName !== undefined && { docxOriginalName: data.docxOriginalName }),
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

export async function deleteTemplate(id: string) {
  const exists = await prisma.template.findUnique({
    where: { id },
    include: { assignedUsers: { select: { id: true } } }
  });
  if (!exists) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  // Before deleting, ensure all related documents have a templateSnapshot
  // so they don't lose their template info when templateId becomes null
  const docsWithoutSnapshot = await prisma.signedDocument.findMany({
    where: { templateId: id, templateSnapshot: { equals: Prisma.DbNull } },
    select: { id: true }
  });

  if (docsWithoutSnapshot.length > 0) {
    // Build the snapshot from the template being deleted
    const snapshot = {
      id: exists.id,
      name: exists.name,
      description: exists.description,
      descriptionStyles: exists.descriptionStyles,
      footer: exists.footer,
      fields: exists.fields,
      isQualityDocument: exists.isQualityDocument,
      qualityCode: exists.qualityCode,
      qualityVersion: exists.qualityVersion,
      qualityDate: exists.qualityDate,
      isDocxTemplate: exists.isDocxTemplate,
      docxFilePath: exists.docxFilePath,
      docxOriginalName: exists.docxOriginalName,
    };

    await prisma.signedDocument.updateMany({
      where: { templateId: id, templateSnapshot: { equals: Prisma.DbNull } },
      data: { templateSnapshot: snapshot as any }
    });
  }

  // Now safely delete — onDelete: SetNull will set templateId to null
  // on remaining documents, preserving them with their snapshot
  return prisma.template.delete({ where: { id } });
}

export async function getTemplateVersions(templateId: string) {
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  const documents = await prisma.signedDocument.findMany({
    where: { templateId },
    select: {
      templateSnapshot: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const versionsMap = new Map<string, { version: string; fieldsCount: number; documentCount: number; lastUsed: Date }>();

  for (const doc of documents) {
    const snapshot = doc.templateSnapshot as any;
    const version = snapshot?.qualityVersion || 'Sin versión';
    const fields = snapshot?.fields || [];
    
    if (!versionsMap.has(version)) {
      versionsMap.set(version, {
        version,
        fieldsCount: fields.length,
        documentCount: 1,
        lastUsed: doc.createdAt
      });
    } else {
      const entry = versionsMap.get(version)!;
      entry.documentCount++;
      if (doc.createdAt > entry.lastUsed) {
        entry.lastUsed = doc.createdAt;
      }
    }
  }

  // Also include the current template's version if not already present
  const currentVersion = template.qualityVersion || 'Sin versión';
  if (!versionsMap.has(currentVersion)) {
    versionsMap.set(currentVersion, {
      version: currentVersion,
      fieldsCount: (template.fields as any[] || []).length,
      documentCount: 0,
      lastUsed: template.updatedAt
    });
  }

  return Array.from(versionsMap.values());
}

export async function exportTemplateRecords(templateId: string, version: string) {
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  // Get all documents filled for this template
  const documents = await prisma.signedDocument.findMany({
    where: { templateId },
    include: {
      filledBy: {
        select: {
          name: true,
          document: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter documents by templateSnapshot version
  // If version is "Sin versión", we match empty or missing versions
  const targetVersion = version === 'Sin versión' ? '' : version;
  const filteredDocs = documents.filter(doc => {
    const snapshot = doc.templateSnapshot as any;
    const docVer = snapshot?.qualityVersion || '';
    if (!targetVersion) {
      return !docVer;
    }
    return docVer.toLowerCase() === targetVersion.toLowerCase();
  });

  // Get the fields schema for this version.
  let fields: any[] = [];
  if (filteredDocs.length > 0) {
    const firstSnapshot = filteredDocs[0].templateSnapshot as any;
    fields = firstSnapshot?.fields || [];
  } else {
    // If version matches current version of template, use template's fields
    const currentVersion = template.qualityVersion || '';
    if (currentVersion.toLowerCase() === targetVersion.toLowerCase()) {
      fields = template.fields as any[] || [];
    }
  }

  // Helper to escape cells according to RFC 4180
  const escapeCsvCell = (val: any): string => {
    if (val === undefined || val === null) return '""';
    let str = '';
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        str = val.map((row: any, idx: number) => {
          const rowStr = Object.entries(row)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          return `[Fila ${idx + 1}: ${rowStr}]`;
        }).join('\n');
      } else {
        str = JSON.stringify(val);
      }
    } else {
      str = String(val);
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Build CSV
  const headers = [
    '"ID Documento"',
    '"Fecha Diligenciamiento"',
    '"Diligenciado Por (Nombre)"',
    '"Diligenciado Por (Cédula)"',
    '"Estado Sincronización"',
    ...fields.map(f => escapeCsvCell(f.label))
  ];

  const rows = [headers.join(',')];

  for (const doc of filteredDocs) {
    const formData = (doc.data || {}) as Record<string, any>;
    const rowCells = [
      escapeCsvCell(doc.id),
      escapeCsvCell(doc.createdAt.toISOString()),
      escapeCsvCell(doc.filledBy?.name || 'Sistema'),
      escapeCsvCell(doc.filledBy?.document || 'N/A'),
      escapeCsvCell(doc.syncStatus),
      ...fields.map(f => {
        const val = formData[f.id];
        return escapeCsvCell(val);
      })
    ];
    rows.push(rowCells.join(','));
  }

  return rows.join('\r\n');
}
