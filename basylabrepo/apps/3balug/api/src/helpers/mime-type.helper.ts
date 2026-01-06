/**
 * Mapeia extensões de arquivo para MIME types
 */
const MIME_TYPE_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
};

/**
 * Mapeia MIME types para extensões de arquivo
 */
const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
  "image/x-icon": ".ico",

  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

/**
 * Converte uma extensão de arquivo para seu MIME type correspondente
 * @param extension - Extensão do arquivo (com ou sem ponto)
 * @returns O MIME type correspondente ou null se não encontrado
 * @example
 * extensionToMimeType(".pdf") // "application/pdf"
 * extensionToMimeType("jpg") // "image/jpeg"
 */
export function extensionToMimeType(extension: string): string | null {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return MIME_TYPE_MAP[ext.toLowerCase()] || null;
}

/**
 * Converte um MIME type para sua extensão de arquivo correspondente
 * @param mimeType - O MIME type (ex: "image/jpeg")
 * @returns A extensão correspondente (com ponto) ou string vazia se não encontrado
 * @example
 * mimeTypeToExtension("image/jpeg") // ".jpg"
 * mimeTypeToExtension("application/pdf") // ".pdf"
 */
export function mimeTypeToExtension(mimeType: string): string {
  return EXTENSION_MAP[mimeType] || "";
}
