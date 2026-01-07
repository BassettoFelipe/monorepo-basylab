"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./GlowButton.module.css";

interface GlowButtonProps {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.icon}
    >
      <path
        d="M3.33337 8H12.6667M12.6667 8L8.00004 3.33333M12.6667 8L8.00004 12.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.icon}
    >
      <path
        d="M1.33337 8C1.33337 8 3.33337 3.33333 8.00004 3.33333C12.6667 3.33333 14.6667 8 14.6667 8C14.6667 8 12.6667 12.6667 8.00004 12.6667C3.33337 12.6667 1.33337 8 1.33337 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GlowButton({
  href,
  variant = "primary",
  children,
  icon,
}: GlowButtonProps) {
  const defaultIcon = variant === "primary" ? <ArrowIcon /> : <EyeIcon />;
  const displayIcon = icon !== undefined ? icon : defaultIcon;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={styles.wrapper}
    >
      <Link
        href={href}
        className={`${styles.button} ${variant === "primary" ? styles.primary : styles.secondary}`}
      >
        {variant === "primary" && <span className={styles.glow} />}
        <span className={styles.text}>
          {children}
          {displayIcon}
        </span>
      </Link>
    </motion.div>
  );
}
