/**
 * Resolves full image URL for image paths, data URLs, or relative /uploads paths.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
}
