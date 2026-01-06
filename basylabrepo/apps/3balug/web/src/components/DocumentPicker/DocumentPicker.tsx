import { Eye, FileImage, FileText, Trash2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { DocumentType } from "@/types/document.types";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from "@/types/document.types";
import * as styles from "./DocumentPicker.css";

export interface SelectedDocument {
  id: string;
  file: File;
  documentType: DocumentType;
  preview?: string;
}

interface DocumentPickerProps {
  documents: SelectedDocument[];
  onChange: (documents: SelectedDocument[]) => void;
  maxDocuments?: number;
  disabled?: boolean;
  label?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentIcon(mimeType: string) {
  if (mimeType === "application/pdf") {
    return { icon: FileText, className: styles.documentIconPdf };
  }
  if (mimeType.startsWith("image/")) {
    return { icon: FileImage, className: styles.documentIconImage };
  }
  return { icon: FileText, className: "" };
}

export function DocumentPicker({
  documents,
  onChange,
  maxDocuments = 50,
  disabled = false,
  label = "Documentos",
}: DocumentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>(DOCUMENT_TYPES.OUTROS);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const canUploadMore = documents.length < maxDocuments && !disabled;

  const handleFile = useCallback(
    (file: File) => {
      if (!canUploadMore) return;

      setError(null);

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Tipo de arquivo nao permitido: ${file.name}. Use PDF, JPG, PNG ou WebP.`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`Arquivo muito grande (max 10MB): ${file.name}`);
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

      const newDocument: SelectedDocument = {
        id,
        file,
        documentType: selectedType,
        preview,
      };

      onChange([...documents, newDocument]);
    },
    [canUploadMore, documents, onChange, selectedType],
  );

  const handleDelete = useCallback(
    (docId: string) => {
      if (disabled) return;

      const docToDelete = documents.find((d) => d.id === docId);
      if (docToDelete?.preview) {
        URL.revokeObjectURL(docToDelete.preview);
      }

      onChange(documents.filter((d) => d.id !== docId));
    },
    [disabled, documents, onChange],
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
      if (!disabled && canUploadMore && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [disabled, canUploadMore, handleFile],
  );

  const handleClick = useCallback(() => {
    if (!disabled && canUploadMore) {
      inputRef.current?.click();
    }
  }, [disabled, canUploadMore]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFile],
  );

  const dropZoneClasses = [
    styles.dropZone,
    isDragging && styles.dropZoneDragging,
    (disabled || !canUploadMore) && styles.dropZoneDisabled,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {label} ({documents.length}/{maxDocuments})
      </label>

      {canUploadMore && (
        <div className={styles.uploadSection}>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              disabled={disabled}
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, labelText]) => (
                <option key={value} value={value}>
                  {labelText}
                </option>
              ))}
            </select>
          </div>

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
              disabled={disabled || !canUploadMore}
            />

            <Upload size={24} className={styles.icon} />
            <span className={styles.dropText}>Arraste ou clique para enviar</span>
            <span className={styles.dropHint}>PDF, JPG, PNG ou WebP - Max 10MB</span>
          </div>
        </div>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}

      {documents.length > 0 ? (
        <div className={styles.documentsList}>
          {documents.map((doc) => {
            const { icon: Icon, className: iconClass } = getDocumentIcon(doc.file.type);
            const isImage = doc.file.type.startsWith("image/");
            return (
              <div key={doc.id} className={styles.documentCard}>
                {isImage && doc.preview ? (
                  <div
                    className={styles.documentPreview}
                    onClick={() => setPreviewImage(doc.preview || null)}
                  >
                    <img src={doc.preview} alt={doc.file.name} className={styles.previewImage} />
                  </div>
                ) : (
                  <div className={`${styles.documentIcon} ${iconClass}`}>
                    <Icon size={20} />
                  </div>
                )}

                <div className={styles.documentInfo}>
                  <span className={styles.documentName}>{doc.file.name}</span>
                  <div className={styles.documentMeta}>
                    <span className={styles.documentTypeBadge}>
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </span>
                    <span>{formatFileSize(doc.file.size)}</span>
                  </div>
                </div>

                <div className={styles.documentActions}>
                  {isImage && doc.preview && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => setPreviewImage(doc.preview || null)}
                      title="Visualizar imagem"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={() => handleDelete(doc.id)}
                    disabled={disabled}
                    title="Remover documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>Nenhum documento selecionado</div>
      )}

      {/* Modal de preview de imagem */}
      {previewImage && (
        <div className={styles.previewOverlay} onClick={() => setPreviewImage(null)}>
          <div className={styles.previewModal}>
            <button
              type="button"
              className={styles.previewCloseButton}
              onClick={() => setPreviewImage(null)}
              title="Fechar"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Preview do documento"
              className={styles.previewModalImage}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
