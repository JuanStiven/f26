import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../models/prisma';
import { AuthPayload } from '../middlewares/auth.middleware';

/**
 * Login para Administradores (email + password)
 */
export async function loginAdmin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || ((user.role as string) !== 'ADMIN' && (user.role as string) !== 'SUPER_ADMIN')) {
    throw { status: 401, message: 'Credenciales inválidas.' };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw { status: 401, message: 'Contraseña incorrecta.' };
  }

  const payload: AuthPayload = {
    userId: user.id,
    role: user.role,
    email: user.email || undefined,
    document: user.document,
  };

  const secret = process.env.JWT_SECRET || 'default_secret';
  const expiresInSeconds = 60 * 60 * 24; // 24 horas
  const token = jwt.sign(payload, secret, { expiresIn: expiresInSeconds });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      document: user.document,
    },
  };
}

/**
 * Login para Empleados (cédula + PIN)
 */
export async function loginEmployee(document: string, pin: string) {
  const user = await prisma.user.findUnique({ where: { document } });

  if (!user || user.role !== 'EMPLOYEE') {
    throw { status: 401, message: 'Cédula no registrada en el sistema.' };
  }

  if (user.status !== 'Activo') {
    throw { status: 403, message: 'Tu cuenta está inactiva. Contacta al administrador.' };
  }

  const isValid = await bcrypt.compare(pin, user.password);
  if (!isValid) {
    throw { status: 401, message: 'PIN incorrecto.' };
  }

  const payload: AuthPayload = {
    userId: user.id,
    role: user.role,
    document: user.document,
  };

  const secret = process.env.JWT_SECRET || 'default_secret';
  const expiresInSeconds = 60 * 60 * 24; // 24 horas
  const token = jwt.sign(payload, secret, { expiresIn: expiresInSeconds });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      document: user.document,
      position: user.position,
    },
  };
}

/**
 * Obtener perfil del usuario autenticado
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      document: true,
      role: true,
      status: true,
      position: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw { status: 404, message: 'Usuario no encontrado.' };
  }

  return user;
}
