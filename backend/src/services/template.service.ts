import prisma from '../models/prisma';

export async function getAllTemplates() {
  return prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { signedDocuments: true } },
    },
  });
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
}) {
  return prisma.template.create({
    data: {
      name: data.name,
      description: data.description || '',
      storagePath: data.storagePath || '',
      fields: data.fields,
    },
  });
}

export async function updateTemplate(
  id: string,
  data: { name?: string; description?: string; storagePath?: string; fields?: any[] }
) {
  const exists = await prisma.template.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  return prisma.template.update({
    where: { id },
    data,
  });
}

export async function deleteTemplate(id: string) {
  const exists = await prisma.template.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Plantilla no encontrada.' };
  }

  return prisma.template.delete({ where: { id } });
}
