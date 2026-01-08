"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import styles from "./Header.module.css";

const navItems = [
  { id: "about", label: "Sobre", sectionId: "sobre" },
  { id: "services", label: "Serviços", sectionId: "servicos" },
  { id: "process", label: "Processo", sectionId: "processo" },
  { id: "tech", label: "Tecnologia", sectionId: "tecnologia" },
  { id: "cases", label: "Cases", sectionId: "cases" },
  { id: "contact", label: "Contato", sectionId: "contato" },
];

function smoothScrollTo(targetId: string) {
  const element = document.getElementById(targetId);
  if (!element) return;

  const headerHeight = 20;
  const targetPosition =
    element.getBoundingClientRect().top + window.scrollY - headerHeight;

  window.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  });
}

export function Header() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const { scrollY } = useScroll();
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowNav(latest > 300);
  });

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 150);
  };

  const updateActiveSection = useCallback(() => {
    const sections = navItems.map((item) => ({
      id: item.sectionId,
      element: document.getElementById(item.sectionId),
    }));

    const headerHeight = 150;
    const scrollPosition = window.scrollY + headerHeight;

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.element) {
        const sectionTop = section.element.offsetTop;
        if (scrollPosition >= sectionTop) {
          setActiveSection(section.id);
          return;
        }
      }
    }
    setActiveSection(null);
  }, []);

  useEffect(() => {
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [updateActiveSection]);

  const handleNavClick = (sectionId: string) => {
    smoothScrollTo(sectionId);
    setIsExpanded(false);
  };

  const activeItem = navItems.find((item) => item.sectionId === activeSection);

  return (
    <AnimatePresence>
      {showNav && (
        <motion.nav
          className={styles.floatingNav}
          initial={{ opacity: 0, x: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.8 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Collapsed state - just shows current section */}
          <motion.div
            className={styles.navPill}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            layout
          >
            {/* Progress indicator */}
            <ScrollProgressRing />

            {/* Navigation items */}
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="expanded"
                  className={styles.navExpanded}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {navItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      className={`${styles.navItem} ${activeSection === item.sectionId ? styles.navItemActive : ""}`}
                      onClick={() => handleNavClick(item.sectionId)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {item.label}
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  className={styles.navCollapsed}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={styles.currentSection}>
                    {activeItem?.label || "Menu"}
                  </span>
                  <span className={styles.expandHint}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

function ScrollProgressRing() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(Math.max(scrollPercent, 0), 1));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const circumference = 2 * Math.PI * 10;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className={styles.progressRing}>
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle
          cx="14"
          cy="14"
          r="10"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        <circle
          cx="14"
          cy="14"
          r="10"
          fill="none"
          stroke="var(--color-brand-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 14 14)"
        />
      </svg>
      <div className={styles.progressDot} />
    </div>
  );
}
