import { AlertCircle } from "lucide-react";
import * as styles from "./ErrorMessage.css";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className={styles.errorMessage} role="alert" aria-live="polite" aria-atomic="true">
      <AlertCircle size={20} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
