/**
 * Contrato para serviço de storage de arquivos
 */

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
}

export interface PresignedUrlResult {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface IStorageService {
  /**
   * Faz upload de um arquivo
   * @param file Buffer ou stream do arquivo
   * @param key Caminho/nome do arquivo no storage
   * @param contentType Tipo MIME do arquivo
   * @returns Resultado do upload com URL pública
   */
  upload(file: Buffer, key: string, contentType: string): Promise<UploadResult>;

  /**
   * Remove um arquivo do storage
   * @param key Caminho/nome do arquivo no storage
   */
  delete(key: string): Promise<void>;

  /**
   * Obtém URL pública de um arquivo
   * @param key Caminho/nome do arquivo no storage
   * @returns URL pública do arquivo
   */
  getPublicUrl(key: string): string;

  /**
   * Verifica se um arquivo existe
   * @param key Caminho/nome do arquivo no storage
   */
  exists(key: string): Promise<boolean>;

  /**
   * Gera uma URL pré-assinada para upload direto
   * @param key Caminho/nome do arquivo no storage
   * @param contentType Tipo MIME do arquivo
   * @param expiresInSeconds Tempo de expiração em segundos (default: 300)
   * @returns URL pré-assinada para upload
   */
  getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUrlResult>;

  /**
   * Gera uma URL pré-assinada para download
   * @param key Caminho/nome do arquivo no storage
   * @param expiresInSeconds Tempo de expiração em segundos (default: 3600 = 1 hora)
   * @returns URL pré-assinada para download
   */
  getPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<PresignedUrlResult>;
}
