import type { LucideIcon } from "lucide-react";
import * as styles from "./StatCard.css";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "error" | "info";
}

export function StatCard({ title, value, icon: Icon, trend, color = "primary" }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardHeader}>
        <span className={styles.statCardTitle}>{title}</span>
        <div className={`${styles.statCardIcon} ${styles.statCardIconColor[color]}`}>
          <Icon className={styles.statCardIconSvg} />
        </div>
      </div>

      <div className={styles.statCardBody}>
        <h3 className={styles.statCardValue}>{value}</h3>
        {trend && (
          <div
            className={`${styles.trend} ${trend.isPositive ? styles.trendPositive : styles.trendNegative}`}
          >
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
