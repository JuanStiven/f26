import bcrypt from 'bcryptjs';
import prisma from '../models/prisma';
import { Role } from '@prisma/client';

export async function getAllEmployees(role?: string) {
  let whereClause: any = undefined;
  if (role === 'ADMIN') {
    whereClause = { role: { in: ['ADMIN', 'SUPER_ADMIN'] } };
  } else if (role === 'EMPLOYEE') {
    whereClause = { role: 'EMPLOYEE' };
  } else if (role) {
    whereClause = { role: role as any };
  }

  return prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      document: true,
      position: true,
      status: true,
      role: true,
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
      email: true,
      document: true,
      position: true,
      status: true,
      role: true,
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
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  email?: string;
}) {
  // Verificar duplicado de cédula
  const exists = await prisma.user.findUnique({ where: { document: data.document } });
  if (exists) {
    throw { status: 409, message: 'Ya existe un usuario con esa cédula.' };
  }

  if (data.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      throw { status: 409, message: 'Ya existe un usuario con este correo electrónico.' };
    }
  }

  const hashedPin = await bcrypt.hash(data.pin, 10);
  const userRole = data.role || 'EMPLOYEE';

  return prisma.user.create({
    data: {
      name: data.name,
      document: data.document,
      password: hashedPin,
      role: userRole as Role,
      position: data.position || (userRole === 'SUPER_ADMIN' ? 'Super Administrador' : userRole === 'ADMIN' ? 'Administrador' : 'Operario de Campo'),
      status: 'Activo',
      email: data.email || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      document: true,
      position: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function updateEmployee(
  id: string,
  data: { name?: string; position?: string; status?: string; pin?: string; role?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE'; email?: string },
  requester?: { userId: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' }
) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) {
    throw { status: 404, message: 'Empleado no encontrado.' };
  }

  if (requester) {
    const isTargetAdmin = (exists.role as string) === 'ADMIN' || (exists.role as string) === 'SUPER_ADMIN';
    const isSelf = requester.userId === id;
    const isSuper = requester.role === 'SUPER_ADMIN';

    if (isTargetAdmin && !isSelf && !isSuper) {
      throw { status: 403, message: 'Un Administrador no puede actualizar la información o contraseña de otro Administrador.' };
    }

    if (data.role && (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') && !isSuper) {
      throw { status: 403, message: 'Sólo el Super Administrador puede asignar roles administrativos.' };
    }
  }

  if (data.email && data.email !== exists.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      throw { status: 409, message: 'Ya existe un usuario con este correo electrónico.' };
    }
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.position) updateData.position = data.position;
  if (data.status) updateData.status = data.status;
  if (data.role) updateData.role = data.role as Role;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.pin) updateData.password = await bcrypt.hash(data.pin, 10);

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      document: true,
      position: true,
      role: true,
      status: true,
    },
  });
}

export async function deleteEmployee(
  id: string,
  requester?: { userId: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' }
) {
  const exists = await prisma.user.findUnique({ 
    where: { id },
    include: { _count: { select: { signedDocuments: true } } }
  });
  
  if (!exists) {
    throw { status: 404, message: 'Empleado no encontrado.' };
  }

  if (requester) {
    if (requester.userId === id) {
      throw { status: 400, message: 'No puedes eliminar tu propio usuario en sesión.' };
    }

    const isTargetAdmin = (exists.role as string) === 'ADMIN' || (exists.role as string) === 'SUPER_ADMIN';
    const isSuper = requester.role === 'SUPER_ADMIN';

    if (isTargetAdmin && !isSuper) {
      throw { status: 403, message: 'Un Administrador no puede borrar a otro Administrador.' };
    }
  }

  if (exists._count.signedDocuments > 0) {
    throw { status: 400, message: 'No se puede eliminar el empleado porque tiene documentos firmados asociados.' };
  }

  return prisma.user.delete({ where: { id } });
}
