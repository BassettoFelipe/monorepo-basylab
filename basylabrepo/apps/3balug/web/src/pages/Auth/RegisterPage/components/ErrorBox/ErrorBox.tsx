import { AlertCircle } from "lucide-react";
import * as styles from "./ErrorBox.css";

interface ErrorBoxProps {
  message: string;
  id?: string;
}

export function ErrorBox({ message, id }: ErrorBoxProps) {
  return (
    <div
      id={id}
      className={styles.registerError}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AlertCircle size={16} className={styles.errorIcon} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
