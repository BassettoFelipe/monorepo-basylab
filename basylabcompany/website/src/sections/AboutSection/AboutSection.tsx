"use client";

import { motion, useInView } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import styles from "./AboutSection.module.css";

const consoleData = [
  {
    id: "focus",
    label: "Foco",
    value: "Software sob medida para seu negócio",
    iconClass: styles["lineIcon--focus"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <title>Foco</title>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: "approach",
    label: "Comunicação",
    value: "Direta, sem intermediários ou burocracia",
    iconClass: styles["lineIcon--approach"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <title>Comunicacao</title>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "delivery",
    label: "Entrega",
    value: "Código limpo, documentado e 100% seu",
    iconClass: styles["lineIcon--delivery"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <title>Entrega</title>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "support",
    label: "Suporte",
    value: "Acompanhamento pós-entrega incluso",
    iconClass: styles["lineIcon--support"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <title>Suporte</title>
        <path d="M18 18.72a9.1 9.1 0 0 0 3.74-7.22A10.5 10.5 0 0 0 12 1C6.477 1 2 5.477 2 11a9.1 9.1 0 0 0 3.74 7.22" />
        <circle cx="12" cy="11" r="3" />
        <path d="M12 17v4M8 21h8" />
      </svg>
    ),
  },
];

function ConsoleLine({
  data,
  index,
  isInView,
}: {
  data: (typeof consoleData)[0];
  index: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      className={styles.consoleLine}
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
    >
      <div className={`${styles.lineIcon} ${data.iconClass}`}>{data.icon}</div>
      <div className={styles.lineContent}>
        <span className={styles.lineLabel}>{data.label}</span>
        <span className={styles.lineValue}>{data.value}</span>
      </div>
    </motion.div>
  );
}

function StatusDot() {
  return (
    <motion.div
      className={styles.statusDot}
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
  );
}

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className={styles.section} id="sobre">
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb} />
        <Image
          src="/images/symbol.svg"
          alt=""
          width={900}
          height={900}
          className={styles.backgroundLogo}
          aria-hidden="true"
          loading="lazy"
        />
        <div className={styles.gridPattern} />
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          {/* Text Side */}
          <motion.div
            className={styles.textSide}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.eyebrow}>Quem somos</span>

            <h2 className={styles.title}>
              Código é nosso ofício.
              <span className={styles.titleAccent}>
                Qualidade, nossa obsessão.
              </span>
            </h2>

            <p className={styles.description}>
              A Basylab nasceu da frustração com software mal feito. Escolhemos
              qualidade técnica ao invés de escala. Cada projeto recebe
              dedicação total, do início ao deploy.
            </p>

            {/* Quote */}
            <motion.div
              className={styles.quote}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className={styles.quoteText}>
                "Se não dá pra fazer direito, a gente prefere não fazer."
              </p>
              <div className={styles.quoteAuthor}>
                <Image
                  src="/images/symbol-mono-light.svg"
                  alt="Basylab"
                  width={20}
                  height={20}
                  className={styles.quoteIcon}
                  loading="lazy"
                />
                <span className={styles.quoteBrand}>Basylab</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual Side - Console */}
          <motion.div
            className={styles.visualSide}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.consoleWrapper}>
              {/* Console */}
              <div className={styles.console}>
                <div className={styles.consoleHeader}>
                  <div className={styles.consoleDots}>
                    <span
                      className={`${styles.consoleDot} ${styles.consoleDotRed}`}
                    />
                    <span
                      className={`${styles.consoleDot} ${styles.consoleDotYellow}`}
                    />
                    <span
                      className={`${styles.consoleDot} ${styles.consoleDotGreen}`}
                    />
                  </div>
                  <span className={styles.consoleTitle}>sobre.basylab</span>
                </div>

                <div className={styles.consoleBody}>
                  {consoleData.map((data, index) => (
                    <ConsoleLine
                      key={data.id}
                      data={data}
                      index={index}
                      isInView={isInView}
                    />
                  ))}
                </div>

                <div className={styles.consoleFooter}>
                  <StatusDot />
                  <span className={styles.statusText}>online</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
