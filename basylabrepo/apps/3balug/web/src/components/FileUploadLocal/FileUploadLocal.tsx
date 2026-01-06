import { type ReactNode, useCallback, useRef, useState } from "react";
import * as styles from "./FileUploadLocal.css";

export interface LocalFile {
  file: File;
  preview?: string;
  id: string;
}

export interface ExistingFile {
  url: string;
  name: string;
  id: string;
}

interface FileUploadLocalProps {
  label?: string;
  required?: boolean;
  maxFileSize?: number; // MB
  maxFiles?: number;
  allowedTypes?: string[];
  value?: LocalFile[];
  existingFiles?: ExistingFile[];
  onChange?: (files: LocalFile[]) => void;
  onRemoveExisting?: (file: ExistingFile) => void;
  disabled?: boolean;
  error?: string;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  "image/*": "Imagens",
  "application/pdf": "PDF",
  ".doc,.docx": "Word",
  ".xls,.xlsx": "Excel",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(urlOrName: string, contentType?: string): boolean {
  if (contentType?.startsWith("image/")) {
    return true;
  }
  const cleanUrl = urlOrName.split("?")[0].split("#")[0];
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(cleanUrl);
}

function getFileIcon(contentType: string): ReactNode {
  if (contentType.startsWith("image/")) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (contentType === "application/pdf") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function validateFile(file: File, maxFileSize: number, allowedTypes: string[]): string | null {
  const maxBytes = maxFileSize * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
  }

  if (allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      if (type === "image/*") {
        return file.type.startsWith("image/");
      }
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return "Tipo de arquivo não permitido";
    }
  }

  return null;
}

export function FileUploadLocal({
  label,
  required,
  maxFileSize = 5,
  maxFiles = 1,
  allowedTypes = [],
  value = [],
  existingFiles = [],
  onChange,
  onRemoveExisting,
  disabled = false,
  error,
}: FileUploadLocalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const totalFiles = value.length + existingFiles.length;
  const canUploadMore = totalFiles < maxFiles;

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      setLocalError(null);

      const filesToAdd = Array.from(files).slice(0, maxFiles - value.length);
      const newFiles: LocalFile[] = [];

      for (const file of filesToAdd) {
        const validationError = validateFile(file, maxFileSize, allowedTypes);
        if (validationError) {
          setLocalError(validationError);
          continue;
        }

        const localFile: LocalFile = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        if (isImageFile(file.name, file.type)) {
          localFile.preview = URL.createObjectURL(file);
        }

        newFiles.push(localFile);
      }

      if (newFiles.length > 0) {
        onChange?.([...value, ...newFiles]);
      }
    },
    [disabled, maxFileSize, maxFiles, allowedTypes, value, onChange],
  );

  const handleRemove = useCallback(
    (fileToRemove: LocalFile) => {
      if (disabled) return;

      // Revogar URL do preview se existir
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      onChange?.(value.filter((f) => f.id !== fileToRemove.id));
    },
    [disabled, value, onChange],
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

  const getAcceptString = useCallback(() => {
    if (allowedTypes.length === 0) return undefined;

    return allowedTypes
      .map((type) => {
        if (type.startsWith(".")) return type;
        return type;
      })
      .join(",");
  }, [allowedTypes]);

  const displayError = error || localError;

  const dropZoneClasses = [
    styles.dropZone,
    isDragging && styles.dropZoneDragging,
    (disabled || !canUploadMore) && styles.dropZoneDisabled,
    displayError && styles.dropZoneError,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

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
            accept={getAcceptString()}
            multiple={maxFiles > 1}
            disabled={disabled || !canUploadMore}
          />

          <svg
            className={styles.icon}
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          <span className={styles.dropText}>Arraste arquivos aqui ou clique para selecionar</span>

          <span className={styles.dropHint}>
            Máx: {maxFiles} {maxFiles === 1 ? "arquivo" : "arquivos"} de {maxFileSize}MB cada
          </span>

          {allowedTypes.length > 0 && (
            <span className={styles.dropTypes}>
              {allowedTypes.map((t) => FILE_TYPE_LABELS[t] || t).join(", ")}
            </span>
          )}
        </div>
      )}

      {displayError && <p className={styles.errorMessage}>{displayError}</p>}

      {(value.length > 0 || existingFiles.length > 0) && (
        <div className={styles.fileList}>
          {existingFiles.map((existingFile) => (
            <div key={existingFile.id} className={styles.fileItem}>
              <div className={styles.fileIcon}>
                {isImageFile(existingFile.url) || isImageFile(existingFile.name) ? (
                  <img
                    src={existingFile.url}
                    alt={existingFile.name}
                    className={styles.filePreviewImage}
                    onError={(e) => {
                      // Se a imagem falhar ao carregar, esconder e mostrar ícone
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  getFileIcon("application/octet-stream")
                )}
              </div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{existingFile.name}</span>
                <span className={styles.fileSize}>Enviado</span>
              </div>
              {onRemoveExisting && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => onRemoveExisting(existingFile)}
                  disabled={disabled}
                  title="Remover"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {value.map((localFile) => (
            <div key={localFile.id} className={styles.fileItem}>
              <div className={styles.fileIcon}>
                {localFile.preview ? (
                  <img
                    src={localFile.preview}
                    alt={localFile.file.name}
                    className={styles.filePreviewImage}
                    onError={(e) => {
                      // Se a imagem falhar ao carregar, esconder
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : isImageFile(localFile.file.name, localFile.file.type) ? (
                  getFileIcon("image/")
                ) : (
                  getFileIcon(localFile.file.type)
                )}
              </div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{localFile.file.name}</span>
                <span className={styles.fileSize}>{formatFileSize(localFile.file.size)}</span>
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemove(localFile)}
                disabled={disabled}
                title="Remover"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
