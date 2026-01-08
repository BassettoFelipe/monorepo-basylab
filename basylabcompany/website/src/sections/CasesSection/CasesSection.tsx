"use client";

import { CardSwap, Card } from "@/components/CardSwap/CardSwap";
import { TrueFocus } from "@/components/TrueFocus/TrueFocus";
import { motion, useInView } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./CasesSection.module.css";

interface CaseStudy {
  id: string;
  client: string;
  segment: string;
  challenge: string;
  result: string;
  metric: {
    value: string;
    label: string;
  };
  image?: string;
  accentColor: string;
}

const CASES: CaseStudy[] = [
  {
    id: "case-1",
    client: "Rede de Restaurantes",
    segment: "Food Service",
    challenge: "Gestão manual de pedidos causando erros e atrasos",
    result: "Sistema integrado de pedidos e estoque em tempo real",
    metric: {
      value: "-40%",
      label: "tempo de atendimento",
    },
    image: "/images/cases/restaurant.jpg",
    accentColor: "#FF6B35",
  },
  {
    id: "case-2",
    client: "Imobiliária Regional",
    segment: "Real Estate",
    challenge: "Processos burocráticos e documentação descentralizada",
    result: "Plataforma de gestão de contratos e acompanhamento de vendas",
    metric: {
      value: "3x",
      label: "mais contratos/mês",
    },
    image: "/images/cases/realestate.jpg",
    accentColor: "#4ECDC4",
  },
  {
    id: "case-3",
    client: "Startup de Logística",
    segment: "Logistics",
    challenge: "Rastreamento de entregas por planilhas Excel",
    result: "App mobile para motoristas + painel de controle para operação",
    metric: {
      value: "98%",
      label: "entregas rastreadas",
    },
    image: "/images/cases/logistics.jpg",
    accentColor: "#A855F7",
  },
];

function CaseCardImage({
  src,
  alt,
  accentColor,
}: {
  src?: string;
  alt: string;
  accentColor: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={styles.cardImagePlaceholder}
        style={{ "--case-accent": accentColor } as React.CSSProperties}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-label="Imagem do case"
          role="img"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={styles.cardImage}
      sizes="340px"
      onError={() => setHasError(true)}
    />
  );
}

function CaseCardContent({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <div
      className={styles.cardInner}
      style={{ "--case-accent": caseStudy.accentColor } as React.CSSProperties}
    >
      <div className={styles.cardImageWrapper}>
        <CaseCardImage
          src={caseStudy.image}
          alt={caseStudy.client}
          accentColor={caseStudy.accentColor}
        />
        <div className={styles.cardImageOverlay} />
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <span className={styles.cardSegment}>{caseStudy.segment}</span>
          <h3 className={styles.cardClient}>{caseStudy.client}</h3>
        </div>

        <div className={styles.cardDetails}>
          <div className={styles.flowItem}>
            <span className={styles.flowLabel}>Desafio</span>
            <p className={styles.flowText}>{caseStudy.challenge}</p>
          </div>
          <div className={styles.flowItem}>
            <span className={styles.flowLabel}>Solução</span>
            <p className={styles.flowText}>{caseStudy.result}</p>
          </div>
        </div>

        <div className={styles.cardMetric}>
          <span className={styles.metricValue}>{caseStudy.metric.value}</span>
          <span className={styles.metricLabel}>{caseStudy.metric.label}</span>
        </div>
      </div>
    </div>
  );
}

export function CasesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className={styles.section} id="cases">
      <div className={styles.background}>
        <div className={styles.gradientOrb} />
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          <motion.div
            className={styles.leftContent}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.eyebrow}>Resultados reais</span>
            <h2 className={styles.title}>
              Problemas resolvidos.
              <br />
              <span className={styles.titleAccent}>
                Negócios transformados.
              </span>
            </h2>
            <p className={styles.description}>
              Cada projeto é uma história de transformação. Entendemos o
              problema, desenvolvemos a solução e entregamos resultados
              mensuráveis.
            </p>
            <p className={styles.footer}>
              Seu problema pode ser o próximo da lista.
            </p>

            <motion.div
              className={styles.trueFocusWrapper}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <TrueFocus
                sentence="Entender Desenvolver Entregar"
                manualMode={false}
                blurAmount={4}
                borderColor="#E7343A"
                glowColor="rgba(231, 52, 58, 0.5)"
                animationDuration={0.6}
                pauseBetweenAnimations={1.5}
                className={styles.trueFocus}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.rightContent}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <CardSwap
              width={340}
              height={440}
              cardDistance={35}
              verticalDistance={40}
              delay={4000}
              pauseOnHover={true}
              skewAmount={4}
              easing="elastic"
            >
              {CASES.map((caseStudy) => (
                <Card key={caseStudy.id} customClass={styles.swapCard}>
                  <CaseCardContent caseStudy={caseStudy} />
                </Card>
              ))}
            </CardSwap>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
