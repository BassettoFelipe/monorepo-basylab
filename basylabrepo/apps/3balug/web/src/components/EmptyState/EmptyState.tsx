import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/Button/Button";
import * as styles from "./EmptyState.css";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <Icon className="empty-state-icon" />
      </div>
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateDescription}>{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
      <style>{`
        .empty-state-icon {
          width: 48px;
          height: 48px;
        }
        @media (max-width: 640px) {
          .empty-state-icon {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </div>
  );
}
