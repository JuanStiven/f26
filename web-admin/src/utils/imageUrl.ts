/**
 * Resolves the API base URL used to build absolute paths to /uploads assets.
 *
 * En producción VITE_API_URL="/api" (definido en el Dockerfile), por lo que
 * "replace('/api','')" devuelve "" (falsy) y caía al fallback localhost:3000.
 * Ahora usamos window.location.origin para que las descargas apunten al mismo
 * dominio (formatos.esenorte.lat) y Nginx enrute /uploads al backend.
 */
export function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const base = apiUrl.replace(/\/api\/?$/, '');
  if (base) return base;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/**
 * Resolves full image URL for image paths, data URLs, or relative /uploads paths.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = getApiBaseUrl();
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
}
