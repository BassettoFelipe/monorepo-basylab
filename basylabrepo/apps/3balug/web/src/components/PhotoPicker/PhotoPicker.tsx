import { ImagePlus, Star, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import * as styles from "./PhotoPicker.css";

export interface SelectedPhoto {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
}

interface PhotoPickerProps {
  photos: SelectedPhoto[];
  onChange: (photos: SelectedPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  label?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function PhotoPicker({
  photos,
  onChange,
  maxPhotos = 20,
  disabled = false,
  label = "Fotos",
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUploadMore = photos.length < maxPhotos && !disabled;

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      setError(null);

      const filesToAdd = Array.from(files).slice(0, maxPhotos - photos.length);
      const newPhotos: SelectedPhoto[] = [];

      for (const file of filesToAdd) {
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

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const preview = URL.createObjectURL(file);

        newPhotos.push({
          id,
          file,
          preview,
          isPrimary: photos.length === 0 && newPhotos.length === 0, // First photo is primary
        });
      }

      if (newPhotos.length > 0) {
        onChange([...photos, ...newPhotos]);
      }
    },
    [disabled, maxPhotos, photos, onChange],
  );

  const handleDelete = useCallback(
    (photoId: string) => {
      if (disabled) return;

      const photoToDelete = photos.find((p) => p.id === photoId);
      if (photoToDelete) {
        URL.revokeObjectURL(photoToDelete.preview);
      }

      const remainingPhotos = photos.filter((p) => p.id !== photoId);

      // If we deleted the primary, make the first remaining photo primary
      if (photoToDelete?.isPrimary && remainingPhotos.length > 0) {
        remainingPhotos[0].isPrimary = true;
      }

      onChange(remainingPhotos);
    },
    [disabled, photos, onChange],
  );

  const handleSetPrimary = useCallback(
    (photoId: string) => {
      if (disabled) return;

      const updatedPhotos = photos.map((p) => ({
        ...p,
        isPrimary: p.id === photoId,
      }));

      onChange(updatedPhotos);
    },
    [disabled, photos, onChange],
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

  // Sort photos: primary first
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return 0;
  });

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {label} ({photos.length}/{maxPhotos})
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

          <ImagePlus size={32} className={styles.icon} />
          <span className={styles.dropText}>Arraste fotos aqui ou clique para selecionar</span>
          <span className={styles.dropHint}>JPG, PNG, WebP ou GIF - Max 10MB por foto</span>
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
              <img src={photo.preview} alt="Preview" className={styles.photoImage} loading="lazy" />

              {photo.isPrimary && (
                <div className={styles.primaryBadge}>
                  <Star size={10} />
                  Principal
                </div>
              )}

              <div className={styles.photoOverlay}>
                <div className={styles.photoActions}>
                  {!photo.isPrimary && (
                    <button
                      type="button"
                      className={styles.photoActionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(photo.id);
                      }}
                      disabled={disabled}
                      title="Definir como foto principal"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.photoActionButton} ${styles.photoActionButtonDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    disabled={disabled}
                    title="Remover foto"
                  >
                    <Trash2 size={14} />
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
