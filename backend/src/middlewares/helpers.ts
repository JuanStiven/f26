import { Request } from 'express';

/**
 * Helper para obtener un parámetro de ruta como string de forma segura.
 * Express 5 tipifica req.params[key] como string | string[].
 */
export function getParam(req: Request, key: string): string {
  const val = req.params[key];
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}
