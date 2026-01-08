"use client";

import { LayoutGroup, motion, useInView } from "motion/react";
import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { RotatingText } from "@/components/RotatingText";
import styles from "./TechSection.module.css";

type BenefitPosition = "top" | "right" | "bottom" | "left";

interface Benefit {
  id: string;
  label: string;
  points: string[];
  color: string;
  description: string;
  position: BenefitPosition;
}

const BENEFITS: Benefit[] = [
  {
    id: "transparency",
    label: "Transparência",
    points: ["Acompanhamento semanal", "Acesso ao código", "Sem surpresas"],
    color: "#68A063",
    description: "Você sabe exatamente o que está acontecendo",
    position: "top",
  },
  {
    id: "quality",
    label: "Qualidade",
    points: ["Código testado", "Performance otimizada", "Sem gambiarras"],
    color: "#61DAFB",
    description: "Software que funciona de verdade",
    position: "right",
  },
  {
    id: "ownership",
    label: "Autonomia",
    points: ["Código 100% seu", "Documentação completa", "Sem dependência"],
    color: "#FF9900",
    description: "Você é dono do que a gente constrói",
    position: "bottom",
  },
  {
    id: "support",
    label: "Suporte",
    points: ["Pós-entrega incluso", "Correções rápidas", "Evolução contínua"],
    color: "#A855F7",
    description: "Não te abandonamos depois do lançamento",
    position: "left",
  },
];

const AURA_ANIMATION = {
  opacity: [0.2, 0.6, 0.2],
};

const AURA_TRANSITION_BASE = {
  duration: 3.5,
  repeat: Number.POSITIVE_INFINITY,
  ease: "easeInOut" as const,
};

const ARROW_ANIMATION = {
  animate: { x: [0, 3, 0] },
  idle: { x: 0 },
};

interface BenefitNodeProps {
  benefit: Benefit;
  index: number;
  isActive: boolean;
  hasAnyActive: boolean;
  onHover: (id: string | null) => void;
  isInView: boolean;
}

function NodeAura({ color, index }: { color: string; index: number }) {
  return (
    <motion.div
      className={styles.nodeAura}
      animate={AURA_ANIMATION}
      transition={{
        ...AURA_TRANSITION_BASE,
        delay: index * 0.7,
      }}
      style={{ "--node-color": color } as CSSProperties}
    />
  );
}

function NodeArrow({ isAnimating }: { isAnimating: boolean }) {
  return (
    <motion.span
      className={styles.nodeArrow}
      animate={isAnimating ? ARROW_ANIMATION.animate : ARROW_ANIMATION.idle}
      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </motion.span>
  );
}

function BenefitNode({
  benefit,
  index,
  isActive,
  hasAnyActive,
  onHover,
  isInView,
}: BenefitNodeProps) {
  const showAura = !hasAnyActive;
  const positionClass = styles[`techNode--${benefit.position}`];

  return (
    <motion.div
      className={`${styles.techNode} ${positionClass}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
      onMouseEnter={() => onHover(benefit.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={styles.nodeWrapper}>
        {showAura && <NodeAura color={benefit.color} index={index} />}
        <motion.div
          className={`${styles.nodeBox} ${isActive ? styles.nodeBoxActive : ""}`}
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          style={{ "--node-color": benefit.color } as CSSProperties}
        >
          <span className={styles.nodeLabel}>{benefit.label}</span>
          <NodeArrow isAnimating={!hasAnyActive} />
        </motion.div>
      </div>
    </motion.div>
  );
}

interface BenefitDetailsProps {
  benefit: Benefit | null;
  isVisible: boolean;
}

function BenefitDetails({ benefit, isVisible }: BenefitDetailsProps) {
  return (
    <div className={styles.techDetails}>
      {benefit && (
        <motion.div
          key={benefit.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
          transition={{ duration: 0.25 }}
        >
          <p className={styles.techDescription}>{benefit.description}</p>
          <div className={styles.techList}>
            {benefit.points.map((point) => (
              <span
                key={point}
                className={styles.techTag}
                style={{ "--accent": benefit.color } as React.CSSProperties}
              >
                {point}
              </span>
            ))}
          </div>
        </motion.div>
      )}
      {!benefit && (
        <motion.div
          className={styles.techHintWrapper}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <span className={styles.techHintIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </span>
          <p className={styles.techHint}>Passe o mouse para explorar</p>
        </motion.div>
      )}
    </div>
  );
}

const ROTATING_WORDS = [
  "respeita prazos",
  "comunica de verdade",
  "entrega qualidade",
  "não te abandona",
  "resolve problemas",
];

function TechSignals({ isInView }: { isInView: boolean }) {
  return (
    <motion.div
      className={styles.signals}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <LayoutGroup>
        <motion.p className={styles.rotatingTextContainer} layout>
          <motion.span
            className={styles.rotatingTextStatic}
            layout
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            Uma equipe que{" "}
          </motion.span>
          <RotatingText
            texts={ROTATING_WORDS}
            mainClassName={styles.rotatingTextMain}
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName={styles.rotatingTextSplit}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={3500}
          />
        </motion.p>
      </LayoutGroup>
    </motion.div>
  );
}

export function TechSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [activeBenefit, setActiveBenefit] = useState<string | null>(null);

  const activeBenefitData =
    BENEFITS.find((b) => b.id === activeBenefit) || null;

  return (
    <section ref={sectionRef} className={styles.section} id="tecnologia">
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb} />
        <div className={styles.gridPattern} />
      </div>

      <div className={styles.container}>
        {/* Layout Assimétrico */}
        <div className={styles.layout}>
          {/* Lado Esquerdo - Texto */}
          <motion.div
            className={styles.textSide}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.7 }}
          >
            <span className={styles.eyebrow}>Diferenciais</span>

            <h2 className={styles.title}>
              Por que a <span className={styles.titleBrand}>Basylab</span>?
              <br />
              <span className={styles.titleMuted}>Entenda nosso jeito.</span>
            </h2>

            <p className={styles.description}>
              Não somos só mais uma software house. Construímos parcerias de
              verdade, com entregas que fazem sentido pro seu negócio.
            </p>

            <TechSignals isInView={isInView} />
          </motion.div>

          {/* Lado Direito - Orbital Interativo */}
          <motion.div
            className={styles.orbitalSide}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
            }
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className={styles.orbitalContainer}>
              {/* Nodes */}
              {BENEFITS.map((benefit, index) => (
                <BenefitNode
                  key={benefit.id}
                  benefit={benefit}
                  index={index}
                  isActive={activeBenefit === benefit.id}
                  hasAnyActive={!!activeBenefit}
                  onHover={setActiveBenefit}
                  isInView={isInView}
                />
              ))}

              {/* Centro com círculos */}
              <div className={styles.orbitRings}>
                <div className={styles.orbitRing} />
                <div className={styles.orbitRingInner} />

                {/* Linhas conectoras */}
                <svg
                  className={styles.connectorLines}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line
                    x1="50"
                    y1="0"
                    x2="50"
                    y2="25"
                    className={styles.connectorLine}
                  />
                  <line
                    x1="100"
                    y1="50"
                    x2="75"
                    y2="50"
                    className={styles.connectorLine}
                  />
                  <line
                    x1="50"
                    y1="100"
                    x2="50"
                    y2="75"
                    className={styles.connectorLine}
                  />
                  <line
                    x1="0"
                    y1="50"
                    x2="25"
                    y2="50"
                    className={styles.connectorLine}
                  />
                </svg>

                {/* Logo central */}
                <motion.div
                  className={styles.orbitCenter}
                  animate={{ opacity: activeBenefit ? 0.6 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src="/images/symbol-mono-light.svg"
                    alt="Basylab"
                    width={36}
                    height={36}
                    className={styles.orbitCenterLogo}
                  />
                </motion.div>
              </div>
            </div>

            {/* Detalhes do benefício ativo */}
            <BenefitDetails
              benefit={activeBenefitData}
              isVisible={!!activeBenefit}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
