import { mimeTypeToExtension } from "./mime-type.helper";

/**
 * Extrai a extensão de um nome de arquivo ou retorna extensão baseada no content type
 * @param fileName - Nome do arquivo
 * @param contentType - Content type do arquivo (fallback)
 * @returns A extensão do arquivo (com ponto) ou string vazia
 * @example
 * getExtension("document.pdf", "application/pdf") // ".pdf"
 * getExtension("file_without_ext", "image/jpeg") // ".jpg"
 */
export function getExtension(fileName: string, contentType: string): string {
  // Tentar obter extensão do nome do arquivo
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot !== -1) {
    return fileName.slice(lastDot);
  }

  // Fallback baseado no content type
  return mimeTypeToExtension(contentType);
}

/**
 * Sanitiza um nome de arquivo removendo caracteres especiais e acentos
 * @param fileName - Nome do arquivo original
 * @returns Nome do arquivo sanitizado (sem extensão)
 * @example
 * sanitizeFileName("Meu Arquivo.pdf") // "Meu_Arquivo"
 * sanitizeFileName("relatório-ção.doc") // "relatorio-cao"
 */
export function sanitizeFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const nameWithoutExt = lastDot !== -1 ? fileName.slice(0, lastDot) : fileName;

  return nameWithoutExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);
}
