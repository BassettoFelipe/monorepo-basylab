"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import styles from "./LegalPageLayout.module.css";

// ============================================
// TYPES
// ============================================

export interface Section {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  lastUpdated: string;
  version: string;
  sections: Section[];
}

// ============================================
// ICONS
// ============================================

const ChevronDownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ListIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// ============================================
// SUB-COMPONENTS
// ============================================

function Breadcrumb({ currentPage }: { currentPage: string }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Navegação">
      <Link href="/" className={styles.breadcrumbLink}>
        ~
      </Link>
      <span className={styles.breadcrumbSeparator}>/</span>
      <span className={styles.breadcrumbCurrent}>{currentPage}</span>
    </nav>
  );
}

function TableOfContents({ sections }: { sections: Section[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.tocWrapper}>
      <button
        type="button"
        className={styles.tocToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.tocIcon}>
          <ListIcon />
        </span>
        <span className={styles.tocLabel}>Índice do documento</span>
        <span className={styles.tocCount}>{sections.length} seções</span>
        <span
          className={`${styles.tocChevron} ${isOpen ? styles.tocChevronOpen : ""}`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.tocContent}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ol className={styles.tocList}>
              {sections.map((section, index) => (
                <li key={section.id} className={styles.tocItem}>
                  <span className={styles.tocNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.section
      ref={ref}
      id={section.id}
      className={styles.section}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 className={styles.sectionTitle}>{section.title}</h2>
      </div>
      <div className={styles.sectionBody}>{section.content}</div>
    </motion.section>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LegalPageLayout({
  title,
  subtitle,
  icon,
  lastUpdated,
  version,
  sections,
}: LegalPageLayoutProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true });

  return (
    <main className={styles.page}>
      {/* Background */}
      <div className={styles.background}>
        <div className={`${styles.gradientOrb} ${styles.orbPrimary}`} />
        <div className={`${styles.gradientOrb} ${styles.orbSecondary}`} />
        <div className={styles.gridPattern} />
      </div>

      <div className={styles.container}>
        {/* Header */}
        <motion.header
          ref={headerRef}
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={
            isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.5 }}
        >
          <Breadcrumb currentPage={title.toLowerCase()} />

          <div className={styles.titleWrapper}>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>{icon}</span>
            </div>
            <div className={styles.titleContent}>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
          </div>

          <div className={styles.metaBar}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>versão:</span>
              <span className={styles.metaValueHighlight}>{version}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>atualizado em:</span>
              <span className={styles.metaValue}>{lastUpdated}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>vigência:</span>
              <span className={styles.metaValue}>imediata</span>
            </div>
          </div>
        </motion.header>

        {/* Table of Contents */}
        <TableOfContents sections={sections} />

        {/* Content */}
        <div className={styles.content}>
          {sections.map((section, index) => (
            <SectionCard key={section.id} section={section} index={index} />
          ))}
        </div>

        {/* Footer */}
        <footer className={styles.pageFooter}>
          <Link href="/" className={styles.backLink}>
            <span className={styles.backIcon}>
              <ArrowLeftIcon />
            </span>
            Voltar ao início
          </Link>
          <p className={styles.footerNote}>Basylab</p>
        </footer>
      </div>
    </main>
  );
}

// ============================================
// EXPORTED HELPERS (for building sections)
// ============================================

export function List({ items }: { items: string[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item} className={styles.listItem}>
          <span className={styles.listBullet} />
          <span className={styles.listContent}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Highlight({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.highlight}>
      <div className={styles.highlightTitle}>
        <svg
          className={styles.highlightIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {title}
      </div>
      <div className={styles.highlightContent}>{children}</div>
    </div>
  );
}

export function InfoBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.infoBox}>
      <div className={styles.infoTitle}>
        <svg
          className={styles.infoIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        {title}
      </div>
      <div className={styles.infoContent}>{children}</div>
    </div>
  );
}

export function ContactCard() {
  return (
    <div className={styles.contactCard}>
      <div className={styles.contactRow}>
        <svg
          className={styles.contactIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <a href="mailto:contato@basylab.com.br" className={styles.contactLink}>
          contato@basylab.com.br
        </a>
      </div>
      <div className={styles.contactRow}>
        <svg
          className={styles.contactIcon}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <a href="https://wa.me/5514996223121" className={styles.contactLink}>
          (14) 99622-3121
        </a>
      </div>
    </div>
  );
}
