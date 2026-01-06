/**
 * Extrai a chave (key) de uma URL do S3
 * @param url - URL completa do S3
 * @returns A chave do arquivo ou null se não for possível extrair
 * @example
 * extractKeyFromUrl('https://bucket.s3.amazonaws.com/avatars/user-123/avatar.webp')
 * // returns 'avatars/user-123/avatar.webp'
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const parts = path.split("/").filter(Boolean);
    parts.shift();
    return parts.join("/");
  } catch {
    return null;
  }
}
