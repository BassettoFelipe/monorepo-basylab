"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import styles from "./ServicesSection.module.css";

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  return (
    <section ref={sectionRef} className={styles.section} id="servicos">
      <div className={styles.container}>
        {/* Número 3 decorativo */}
        <motion.div
          className={styles.bigNumber}
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8 }}
        >
          03
        </motion.div>

        {/* Logo decorativa */}
        <motion.div
          className={styles.bgSymbol}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
          }
          transition={{ duration: 1 }}
        >
          <Image
            src="/images/symbol.svg"
            alt=""
            width={200}
            height={200}
            className={styles.bgSymbolImage}
            aria-hidden="true"
            loading="lazy"
          />
        </motion.div>

        {/* Conteúdo central */}
        <div className={styles.content}>
          <motion.p
            className={styles.intro}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Três pilares. Uma entrega.
          </motion.p>

          <div className={styles.pillars}>
            <motion.div
              className={styles.pillar}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className={styles.pillarLabel}>Web</span>
              <p className={styles.pillarText}>
                Plataformas e sistemas que rodam no navegador
              </p>
            </motion.div>

            <motion.div
              className={styles.pillarDivider}
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            />

            <motion.div
              className={styles.pillar}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className={styles.pillarLabel}>Mobile</span>
              <p className={styles.pillarText}>
                Aplicativos para iPhone e Android
              </p>
            </motion.div>

            <motion.div
              className={styles.pillarDivider}
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            />

            <motion.div
              className={styles.pillar}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <span className={styles.pillarLabel}>Sistemas</span>
              <p className={styles.pillarText}>
                Automações e integrações sob medida
              </p>
            </motion.div>
          </div>

          <motion.p
            className={styles.closing}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Você traz o problema. A gente resolve.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
