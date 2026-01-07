"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./GlowButton.module.css";

interface GlowButtonProps {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function GlowButton({
  href,
  variant = "primary",
  children,
}: GlowButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={styles.wrapper}
    >
      <Link
        href={href}
        className={`${styles.button} ${variant === "primary" ? styles.primary : styles.secondary}`}
      >
        {variant === "primary" && <span className={styles.glow} />}
        <span className={styles.text}>{children}</span>
      </Link>
    </motion.div>
  );
}
