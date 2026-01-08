"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, useMemo } from "react";
import styles from "./TrueFocus.module.css";

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
  activeGradient?: string;
}

export const TrueFocus = ({
  sentence = "True Focus",
  separator = " ",
  manualMode = false,
  blurAmount = 5,
  borderColor = "green",
  glowColor = "rgba(0, 255, 0, 0.6)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className,
  activeGradient,
}: TrueFocusProps) => {
  const words = useMemo(() => sentence.split(separator), [sentence, separator]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Auto-rotation interval (only when not in manual mode)
  useEffect(() => {
    if (manualMode) return;

    const interval = setInterval(
      () => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      },
      (animationDuration + pauseBetweenAnimations) * 1000,
    );

    return () => clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  // Update focus rect when currentIndex changes
  useEffect(() => {
    const wordEl = wordRefs.current[currentIndex];
    const containerEl = containerRef.current;

    if (!wordEl || !containerEl) return;

    const parentRect = containerEl.getBoundingClientRect();
    const activeRect = wordEl.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setCurrentIndex(index);
    }
  };

  return (
    <div
      className={`${styles.container} ${className || ""}`}
      ref={containerRef}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: words array is static from sentence prop, index is necessary to handle duplicate words
          <button
            type="button"
            key={`word-${index}`}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className={`${styles.word} ${manualMode ? styles.manual : ""} ${isActive && !manualMode ? styles.active : ""}`}
            style={
              {
                filter: isActive ? "blur(0px)" : `blur(${blurAmount}px)`,
                background:
                  isActive && activeGradient ? activeGradient : undefined,
                WebkitBackgroundClip:
                  isActive && activeGradient ? "text" : undefined,
                WebkitTextFillColor:
                  isActive && activeGradient ? "transparent" : undefined,
                backgroundClip: isActive && activeGradient ? "text" : undefined,
                "--border-color": borderColor,
                "--glow-color": glowColor,
                transition: `filter ${animationDuration}s ease, background ${animationDuration}s ease`,
              } as React.CSSProperties
            }
            onMouseEnter={() => handleMouseEnter(index)}
          >
            {word}
          </button>
        );
      })}

      <motion.div
        className={styles.frame}
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
        }}
        style={
          {
            "--border-color": borderColor,
            "--glow-color": glowColor,
          } as React.CSSProperties
        }
      >
        <span className={`${styles.corner} ${styles.topLeft}`} />
        <span className={`${styles.corner} ${styles.topRight}`} />
        <span className={`${styles.corner} ${styles.bottomLeft}`} />
        <span className={`${styles.corner} ${styles.bottomRight}`} />
      </motion.div>
    </div>
  );
};
