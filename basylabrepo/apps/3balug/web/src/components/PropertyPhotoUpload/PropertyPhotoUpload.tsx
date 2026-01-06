import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDeletePropertyPhotoMutation } from "@/queries/property-photos/useDeletePropertyPhotoMutation";
import { useSetPrimaryPhotoMutation } from "@/queries/property-photos/useSetPrimaryPhotoMutation";
import { useUploadPropertyPhotoMutation } from "@/queries/property-photos/useUploadPropertyPhotoMutation";
import type { PropertyPhoto } from "@/types/property.types";
import * as styles from "./PropertyPhotoUpload.css";

interface PropertyPhotoUploadProps {
  propertyId: string;
  photos: PropertyPhoto[];
  maxPhotos?: number;
  disabled?: boolean;
  onPhotosChange?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function PropertyPhotoUpload({
  propertyId,
  photos = [],
  maxPhotos = 20,
  disabled = false,
  onPhotosChange,
}: PropertyPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadPropertyPhotoMutation();
  const deleteMutation = useDeletePropertyPhotoMutation();
  const setPrimaryMutation = useSetPrimaryPhotoMutation();

  const canUploadMore = photos.length < maxPhotos && !disabled;
  const isUploading = uploadingCount > 0;

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      setError(null);

      const filesToUpload = Array.from(files).slice(0, maxPhotos - photos.length);

      for (const file of filesToUpload) {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`Tipo de arquivo nao permitido: ${file.name}`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setError(`Arquivo muito grande (max 10MB): ${file.name}`);
          continue;
        }

        try {
          setUploadingCount((prev) => prev + 1);

          await uploadMutation.mutateAsync({
            propertyId,
            file,
            isPrimary: photos.length === 0, // First photo is primary
          });

          onPhotosChange?.();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Erro ao enviar foto";
          toast.error(errorMessage);
        } finally {
          setUploadingCount((prev) => prev - 1);
        }
      }
    },
    [disabled, maxPhotos, photos.length, propertyId, uploadMutation, onPhotosChange],
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (disabled) return;

      try {
        await deleteMutation.mutateAsync({
          propertyId,
          photoId,
        });
        toast.success("Foto removida com sucesso");
        onPhotosChange?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao remover foto";
        toast.error(errorMessage);
      }
    },
    [disabled, propertyId, deleteMutation, onPhotosChange],
  );

  const handleSetPrimary = useCallback(
    async (photoId: string) => {
      if (disabled) return;

      try {
        await setPrimaryMutation.mutateAsync({
          propertyId,
          photoId,
        });
        toast.success("Foto principal definida");
        onPhotosChange?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao definir foto principal";
        toast.error(errorMessage);
      }
    },
    [disabled, propertyId, setPrimaryMutation, onPhotosChange],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && canUploadMore) {
        setIsDragging(true);
      }
    },
    [disabled, canUploadMore],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled && canUploadMore) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, canUploadMore, handleFiles],
  );

  const handleClick = useCallback(() => {
    if (!disabled && canUploadMore) {
      inputRef.current?.click();
    }
  }, [disabled, canUploadMore]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  const dropZoneClasses = [
    styles.dropZone,
    isDragging && styles.dropZoneDragging,
    (disabled || !canUploadMore) && styles.dropZoneDisabled,
  ]
    .filter(Boolean)
    .join(" ");

  // Sort photos: primary first, then by order
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.order - b.order;
  });

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Fotos do Imovel ({photos.length}/{maxPhotos})
      </label>

      {canUploadMore && (
        <div
          className={dropZoneClasses}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            className={styles.hiddenInput}
            onChange={handleInputChange}
            accept={ALLOWED_TYPES.join(",")}
            multiple
            disabled={disabled || !canUploadMore}
          />

          {isUploading ? (
            <>
              <Loader2 size={32} className={styles.spinner} />
              <span className={styles.dropText}>Enviando {uploadingCount} foto(s)...</span>
            </>
          ) : (
            <>
              <ImagePlus size={32} className={styles.icon} />
              <span className={styles.dropText}>Arraste fotos aqui ou clique para selecionar</span>
              <span className={styles.dropHint}>JPG, PNG, WebP ou GIF - Max 10MB por foto</span>
            </>
          )}
        </div>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}

      {sortedPhotos.length > 0 && (
        <div className={styles.photosGrid}>
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`${styles.photoCard} ${photo.isPrimary ? styles.photoCardPrimary : ""}`}
            >
              <img
                src={photo.url}
                alt="Foto do imovel"
                className={styles.photoImage}
                loading="lazy"
              />

              {photo.isPrimary && (
                <div className={styles.primaryBadge}>
                  <Star size={12} />
                  Principal
                </div>
              )}

              <div className={styles.photoOverlay}>
                <div className={styles.photoActions}>
                  {!photo.isPrimary && (
                    <button
                      type="button"
                      className={styles.photoActionButton}
                      onClick={() => handleSetPrimary(photo.id)}
                      disabled={disabled || setPrimaryMutation.isPending}
                      title="Definir como foto principal"
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.photoActionButton} ${styles.photoActionButtonDanger}`}
                    onClick={() => handleDelete(photo.id)}
                    disabled={disabled || deleteMutation.isPending}
                    title="Remover foto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
