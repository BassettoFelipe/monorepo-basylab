import { Mail } from "lucide-react";
import * as styles from "./PageHeader.css";

interface PageHeaderProps {
  email: string;
}

export function PageHeader({ email }: PageHeaderProps) {
  return (
    <header className={styles.confirmEmailHeader}>
      <div className={styles.confirmEmailIcon} aria-hidden="true">
        <Mail size={48} />
      </div>
      <h1 id="confirm-email-title" className={styles.confirmEmailTitle}>
        Confirme seu Email
      </h1>
      <p className={styles.confirmEmailSubtitle}>Digite o código de 6 dígitos enviado para</p>
      <p className={styles.confirmEmailEmail}>{email}</p>
    </header>
  );
}
