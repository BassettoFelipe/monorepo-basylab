import { Download, FileImage, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  useDeleteDocumentMutation,
  useDocumentsQuery,
  useUploadDocumentMutation,
} from "@/queries/documents/documents.queries";
import type { Document, DocumentEntityType, DocumentType } from "@/types/document.types";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from "@/types/document.types";
import * as styles from "./DocumentUpload.css";

interface DocumentUploadProps {
  entityType: DocumentEntityType;
  entityId: string;
  maxDocuments?: number;
  disabled?: boolean;
  onDocumentsChange?: () => void;
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

export function DocumentUpload({
  entityType,
  entityId,
  maxDocuments = 50,
  disabled = false,
  onDocumentsChange,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>(DOCUMENT_TYPES.OUTROS);
  const [error, setError] = useState<string | null>(null);

  const { data: documentsData, isLoading } = useDocumentsQuery(entityType, entityId, {
    enabled: !!entityId,
  });
  const uploadMutation = useUploadDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();

  const documents = documentsData?.data ?? [];
  const canUploadMore = documents.length < maxDocuments && !disabled;

  const handleFile = useCallback(
    async (file: File) => {
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

      try {
        setIsUploading(true);

        await uploadMutation.mutateAsync({
          entityType,
          entityId,
          documentType: selectedType,
          file,
        });

        toast.success("Documento enviado com sucesso");
        onDocumentsChange?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao enviar documento";
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [canUploadMore, entityType, entityId, selectedType, uploadMutation, onDocumentsChange],
  );

  const handleDelete = useCallback(
    async (document: Document) => {
      if (disabled) return;

      try {
        await deleteMutation.mutateAsync({
          documentId: document.id,
          entityType,
          entityId,
        });
        toast.success("Documento removido com sucesso");
        onDocumentsChange?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao remover documento";
        toast.error(errorMessage);
      }
    },
    [disabled, entityType, entityId, deleteMutation, onDocumentsChange],
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

  const handleDownload = useCallback((document: Document) => {
    window.open(document.url, "_blank");
  }, []);

  const dropZoneClasses = [
    styles.dropZone,
    isDragging && styles.dropZoneDragging,
    (disabled || !canUploadMore) && styles.dropZoneDisabled,
  ]
    .filter(Boolean)
    .join(" ");

  // Sort documents by type, then by creation date
  const sortedDocuments = [...documents].sort((a, b) => {
    if (a.documentType !== b.documentType) {
      return a.documentType.localeCompare(b.documentType);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <label className={styles.label}>Documentos</label>
        <div className={styles.emptyState}>
          <Loader2 size={24} className={styles.spinner} />
          <span>Carregando documentos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Documentos ({documents.length}/{maxDocuments})
      </label>

      {canUploadMore && (
        <div className={styles.uploadSection}>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              disabled={disabled || isUploading}
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
              disabled={disabled || !canUploadMore || isUploading}
            />

            {isUploading ? (
              <>
                <Loader2 size={24} className={styles.spinner} />
                <span className={styles.dropText}>Enviando documento...</span>
              </>
            ) : (
              <>
                <Upload size={24} className={styles.icon} />
                <span className={styles.dropText}>Arraste ou clique para enviar</span>
                <span className={styles.dropHint}>PDF, JPG, PNG ou WebP - Max 10MB</span>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}

      {sortedDocuments.length > 0 ? (
        <div className={styles.documentsList}>
          {sortedDocuments.map((doc) => {
            const { icon: Icon, className: iconClass } = getDocumentIcon(doc.mimeType);
            return (
              <div key={doc.id} className={styles.documentCard}>
                <div className={`${styles.documentIcon} ${iconClass}`}>
                  <Icon size={20} />
                </div>

                <div className={styles.documentInfo}>
                  <span className={styles.documentName}>{doc.originalName}</span>
                  <div className={styles.documentMeta}>
                    <span className={styles.documentTypeBadge}>
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </span>
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                </div>

                <div className={styles.documentActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => handleDownload(doc)}
                    title="Baixar documento"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={() => handleDelete(doc)}
                    disabled={disabled || deleteMutation.isPending}
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
        <div className={styles.emptyState}>Nenhum documento anexado</div>
      )}
    </div>
  );
}
