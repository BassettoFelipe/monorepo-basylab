import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../Button/Button";
import * as styles from "./ConfirmDialog.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
  requireConfirmation?: boolean;
  confirmationText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
  variant = "danger",
  requireConfirmation = false,
  confirmationText = "EXCLUIR",
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  // Unified effect for keyboard handling and body overflow
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isLoading]);

  const handleOverlayClick = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.toUpperCase());
  }, []);

  if (!isOpen) return null;

  const isConfirmDisabled = requireConfirmation && inputValue !== confirmationText;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={24} />
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description} dangerouslySetInnerHTML={{ __html: description }} />

        {requireConfirmation && (
          <>
            <p className={styles.confirmText}>
              Digite <strong>{confirmationText}</strong> para confirmar:
            </p>
            <input
              type="text"
              className={styles.confirmInput}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={confirmationText}
              disabled={isLoading}
              autoFocus
            />
          </>
        )}

        <div className={styles.actions}>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isConfirmDisabled || isLoading}
          >
            {confirmText}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
}
