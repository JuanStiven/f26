import bcrypt from 'bcryptjs';
import prisma from '../models/prisma';

export async function getAllEmployees() {
  return prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      document: true,
      position: true,
      status: true,
      createdAt: true,
      _count: { select: { signedDocuments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      document: true,
      position: true,
      status: true,
      createdAt: true,
      signedDocuments: {
        include: { template: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!employee) {
    throw { status: 404, message: 'Empleado no encontrado.' };
  }

  return employee;
}

export async function createEmployee(data: {
  name: string;
  document: string;
  pin: string;
  position?: string;
}) {
  // Verificar duplicado de cédula
  const exists = await prisma.user.findUnique({ where: { document: data.document } });
  if (exists) {
    throw { status: 409, message: 'Ya existe un usuario con esa cédula.' };
  }

  const hashedPin = await bcrypt.hash(data.pin, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      document: data.document,
      password: hashedPin,
      role: 'EMPLOYEE',
      position: data.position || 'Operario de Campo',
      status: 'Activo',
    },
    select: {
      id: true,
      name: true,
      document: true,
      position: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function updateEmployee(
  id: string,
  data: { name?: string; position?: string; status?: string; pin?: string }
) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Empleado no encontrado.' };
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.position) updateData.position = data.position;
  if (data.status) updateData.status = data.status;
  if (data.pin) updateData.password = await bcrypt.hash(data.pin, 10);

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      document: true,
      position: true,
      status: true,
    },
  });
}

export async function deleteEmployee(id: string) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Empleado no encontrado.' };
  }

  return prisma.user.delete({ where: { id } });
}
