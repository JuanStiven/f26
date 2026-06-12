import prisma from '../models/prisma';

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
  if (role === 'ADMIN') {
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
  storagePath?: string;
  fields: any[];
  assignedUsers?: string[];
  isQualityDocument?: boolean;
  qualityCode?: string;
  qualityVersion?: string;
  qualityDate?: string;
  isCreativeMode?: boolean;
  creativeElements?: any;
}) {
  return prisma.template.create({
    data: {
      name: data.name,
      description: data.description || '',
      storagePath: data.storagePath || '',
      fields: data.fields,
      isQualityDocument: data.isQualityDocument || false,
      qualityCode: data.qualityCode || '',
      qualityVersion: data.qualityVersion || '',
      qualityDate: data.qualityDate || '',
      isCreativeMode: data.isCreativeMode || false,
      creativeElements: data.creativeElements || [],
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
  data: { name?: string; description?: string; storagePath?: string; fields?: any[]; assignedUsers?: string[]; isQualityDocument?: boolean; qualityCode?: string; qualityVersion?: string; qualityDate?: string; isCreativeMode?: boolean; creativeElements?: any; }
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
      ...(data.storagePath !== undefined && { storagePath: data.storagePath }),
      ...(data.fields !== undefined && { fields: data.fields }),
      ...(data.isQualityDocument !== undefined && { isQualityDocument: data.isQualityDocument }),
      ...(data.qualityCode !== undefined && { qualityCode: data.qualityCode }),
      ...(data.qualityVersion !== undefined && { qualityVersion: data.qualityVersion }),
      ...(data.qualityDate !== undefined && { qualityDate: data.qualityDate }),
      ...(data.isCreativeMode !== undefined && { isCreativeMode: data.isCreativeMode }),
      ...(data.creativeElements !== undefined && { creativeElements: data.creativeElements }),
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
  const exists = await prisma.template.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  return prisma.template.delete({ where: { id } });
}
