import { extensionToMimeType } from "./mime-type.helper";

/**
 * Verifica se um tipo de arquivo é permitido
 * @param contentType - O content type do arquivo (ex: "image/jpeg")
 * @param allowedTypes - Array de tipos permitidos (suporta wildcards e extensões)
 * @returns true se o tipo é permitido, false caso contrário
 * @example
 * isTypeAllowed("image/jpeg", ["image/*"]) // true
 * isTypeAllowed("application/pdf", [".pdf", ".doc"]) // true
 * isTypeAllowed("video/mp4", ["image/*"]) // false
 */
export function isTypeAllowed(contentType: string, allowedTypes: string[]): boolean {
  for (const allowed of allowedTypes) {
    if (allowed.endsWith("/*")) {
      const prefix = allowed.slice(0, -2);
      if (contentType.startsWith(prefix)) {
        return true;
      }
    } else if (allowed.startsWith(".")) {
      const extensions = allowed.split(",").map((ext) => ext.trim());
      for (const ext of extensions) {
        const mimeType = extensionToMimeType(ext);
        if (mimeType && contentType === mimeType) {
          return true;
        }
      }
    } else if (contentType === allowed) {
      return true;
    }
  }
  return false;
}
