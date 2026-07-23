import prisma from '../models/prisma';
import path from 'path';
import fs from 'fs';

export function saveBase64ToFile(base64Str: string, subfolder: string, prefix: string): string {
  if (!base64Str || typeof base64Str !== 'string') return base64Str;
  const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches) return base64Str;

  const mimeExt = matches[1].toLowerCase().replace('jpeg', 'jpg');
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
  const targetFolder = path.join(uploadsDir, subfolder);

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${mimeExt}`;
  const fullPath = path.join(targetFolder, filename);
  fs.writeFileSync(fullPath, buffer);

  const relativePath = path.relative(uploadsDir, fullPath).replace(/\\/g, '/');
  return `/uploads/${relativePath}`;
}

export async function getSettings() {
  // Siempre debe haber exactamente un registro
  let settings = await prisma.companySettings.findFirst();

  if (!settings) {
    settings = await prisma.companySettings.create({ data: {} });
  }

  return settings;
}

export async function updateSettings(data: {
  name?: string;
  nit?: string;
  address?: string;
  phone?: string;
  manager?: string;
  email?: string;
  country?: string;
  department?: string;
  branch?: string;
  logoUrl?: string;
}) {
  let settings = await prisma.companySettings.findFirst();

  if (data.logoUrl && data.logoUrl.startsWith('data:image/')) {
    data.logoUrl = saveBase64ToFile(data.logoUrl, 'logo', 'logo');
  }

  if (!settings) {
    return prisma.companySettings.create({ data });
  }

  return prisma.companySettings.update({
    where: { id: settings.id },
    data,
  });
}

