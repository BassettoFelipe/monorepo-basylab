import { AlertCircle } from "lucide-react";
import * as styles from "./ErrorAlert.css";

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className={styles.checkoutError} role="alert" aria-live="polite">
      <AlertCircle className={styles.errorIcon} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
