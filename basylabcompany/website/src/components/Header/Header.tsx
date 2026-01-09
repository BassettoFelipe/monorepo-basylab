"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

const LEGAL_PAGES = ["/privacidade", "/termos"];

const navItems = [
  { id: "about", label: "Sobre", sectionId: "sobre" },
  { id: "services", label: "Serviços", sectionId: "servicos" },
  { id: "process", label: "Processo", sectionId: "processo" },
  { id: "tech", label: "Tecnologia", sectionId: "tecnologia" },
  { id: "cases", label: "Cases", sectionId: "cases" },
  { id: "contact", label: "Contato", sectionId: "contato" },
];

const CIRCUMFERENCE = 2 * Math.PI * 10;

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
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLegalPage = LEGAL_PAGES.includes(pathname);

  // Single unified scroll handler for all scroll-related state
  useEffect(() => {
    // Skip scroll handling on legal pages
    if (isLegalPage) return;

    // Cache DOM references para evitar queries repetidas
    let footerEl: Element | null = null;
    let sectionEls: Map<string, HTMLElement | null> = new Map();
    let rafId: number | null = null;
    let lastScrollTop = -1;

    // Inicializar cache de elementos
    const initCache = () => {
      footerEl = document.querySelector("footer");
      for (const item of navItems) {
        sectionEls.set(item.sectionId, document.getElementById(item.sectionId));
      }
    };

    const handleScroll = () => {
      // Usar RAF para throttle natural
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const scrollTop = window.scrollY;

        // Skip se scroll nao mudou significativamente
        if (Math.abs(scrollTop - lastScrollTop) < 5) return;
        lastScrollTop = scrollTop;

        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;

        // Update scroll progress
        const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
        setScrollProgress(Math.min(Math.max(scrollPercent, 0), 1));

        // Update nav visibility (usando cache)
        if (footerEl) {
          const footerTop = footerEl.getBoundingClientRect().top;
          const windowHeight = window.innerHeight;
          const isFooterVisible = footerTop < windowHeight - 100;
          setShowNav(scrollTop > 300 && !isFooterVisible);
        } else {
          setShowNav(scrollTop > 300);
        }

        // Update active section (usando cache)
        const headerHeight = 150;
        const scrollPosition = scrollTop + headerHeight;

        for (let i = navItems.length - 1; i >= 0; i--) {
          const element = sectionEls.get(navItems[i].sectionId);
          if (element && scrollPosition >= element.offsetTop) {
            setActiveSection(navItems[i].sectionId);
            return;
          }
        }
        setActiveSection(null);
      });
    };

    initCache();
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      // Limpar cache
      footerEl = null;
      sectionEls.clear();
    };
  }, [isLegalPage]);

  // Don't render on legal pages
  if (isLegalPage) {
    return null;
  }

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

  const handleNavClick = (sectionId: string) => {
    smoothScrollTo(sectionId);
    setIsExpanded(false);
  };

  const activeItem = navItems.find((item) => item.sectionId === activeSection);
  const strokeDashoffset = CIRCUMFERENCE - scrollProgress * CIRCUMFERENCE;

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
          <motion.div
            className={styles.navPill}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            layout
          >
            {/* Progress indicator - inline to avoid extra component overhead */}
            <div className={styles.progressRing}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                aria-hidden="true"
              >
                <title>Progresso da pagina</title>
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
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 14 14)"
                />
              </svg>
              <div className={styles.progressDot} />
            </div>

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
                      aria-hidden="true"
                    >
                      <title>Expandir menu</title>
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
