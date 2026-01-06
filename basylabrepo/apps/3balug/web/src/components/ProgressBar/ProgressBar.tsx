import * as styles from "./ProgressBar.css";

export interface ProgressBarProps {
  completedFields: number;
  totalFields: number;
}

export function ProgressBar({ completedFields, totalFields }: ProgressBarProps) {
  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.info}>
          <span className={styles.title}>Progresso</span>
          <span className={styles.subtitle}>
            {completedFields} de {totalFields} campos obrigatórios
          </span>
        </div>
        <span className={styles.percentage}>{percentage}%</span>
      </div>

      <div className={styles.barContainer}>
        <div
          className={styles.barFill}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
