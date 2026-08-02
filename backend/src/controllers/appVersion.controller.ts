import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { getParam } from '../middlewares/helpers';

const prisma = new PrismaClient();
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');

// ─── Público: última versión activa (para la app móvil) ───
export async function getLatest(_req: Request, res: Response): Promise<void> {
  try {
    const latest = await prisma.appVersion.findFirst({
      where: { isActive: true },
      orderBy: { versionCode: 'desc' },
    });
    if (!latest) {
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: latest });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Admin: listar todas las versiones ───
export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const versions = await prisma.appVersion.findMany({
      orderBy: { versionCode: 'desc' },
    });
    res.json({ success: true, data: versions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Admin: subir nueva versión con APK ───
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, any>;
    const versionCode = body.versionCode;
    const versionName = body.versionName;
    const changelog = body.changelog;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'Debe adjuntar el archivo APK.' });
      return;
    }
    if (!versionCode || !versionName) {
      res.status(400).json({ success: false, message: 'versionCode y versionName son obligatorios.' });
      return;
    }

    const apkPath = `/uploads/apk/${file.filename}`;

    // Desactivar versiones anteriores para que "latest" sea la nueva
    await prisma.appVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const version = await prisma.appVersion.create({
      data: {
        versionCode: parseInt(String(versionCode), 10),
        versionName: String(versionName),
        apkPath,
        apkSize: file.size,
        changelog: changelog ? String(changelog) : null,
        isActive: true,
      },
    });

    res.json({ success: true, data: version });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Admin: activar/desactivar versión ───
export async function setActive(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req, 'id');
    const body = (req.body ?? {}) as Record<string, any>;
    const isActive = body.isActive === true || body.isActive === 'true';

    if (isActive) {
      // Al activar una, desactivar las demás
      await prisma.appVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const version = await prisma.appVersion.update({
      where: { id },
      data: { isActive },
    });

    res.json({ success: true, data: version });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Admin: eliminar versión y archivo ───
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req, 'id');
    const version = await prisma.appVersion.findUnique({ where: { id } });

    if (version) {
      // Eliminar archivo físico si existe
      const fileName = path.basename(version.apkPath);
      const filePath = path.join(uploadsDir, 'apk', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.appVersion.delete({ where: { id } });
    }

    res.json({ success: true, message: 'Versión eliminada.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
