import { AlertCircle } from "lucide-react";
import * as styles from "./ErrorBox.css";

interface ErrorBoxProps {
  message: string;
}

export function ErrorBox({ message }: ErrorBoxProps) {
  return (
    <div className={styles.errorBox}>
      <AlertCircle size={20} className={styles.errorIcon} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
