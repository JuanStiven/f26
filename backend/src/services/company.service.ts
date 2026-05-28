import prisma from '../models/prisma';

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

  if (!settings) {
    return prisma.companySettings.create({ data });
  }

  return prisma.companySettings.update({
    where: { id: settings.id },
    data,
  });
}
