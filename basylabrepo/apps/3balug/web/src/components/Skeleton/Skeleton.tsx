import type { CSSProperties } from "react";
import * as styles from "./Skeleton.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
  variant?: "rectangular" | "rounded" | "circular";
}

export function Skeleton({
  width,
  height,
  borderRadius,
  className,
  style,
  variant = "rectangular",
}: SkeletonProps) {
  const variantClass = styles.variants[variant];

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className || ""}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width || "100%",
        height: typeof height === "number" ? `${height}px` : height || "1rem",
        borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
}
