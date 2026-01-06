export { MinioStorageService } from "./minio.storage";
export type { IStorageService, UploadResult } from "./storage.contract";

import { MinioStorageService } from "./minio.storage";

let storageServiceInstance: MinioStorageService | null = null;

export function getStorageService(): MinioStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new MinioStorageService();
  }
  return storageServiceInstance;
}
