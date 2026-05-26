import prisma from '../models/prisma';

export async function getAllSenders() {
  return prisma.sender.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createSender(data: { name: string; nit: string; phone: string }) {
  return prisma.sender.create({ data });
}

export async function updateSender(id: string, data: { name?: string; nit?: string; phone?: string }) {
  const exists = await prisma.sender.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Remitente no encontrado.' };
  }

  return prisma.sender.update({ where: { id }, data });
}

export async function deleteSender(id: string) {
  const exists = await prisma.sender.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Remitente no encontrado.' };
  }

  return prisma.sender.delete({ where: { id } });
}
