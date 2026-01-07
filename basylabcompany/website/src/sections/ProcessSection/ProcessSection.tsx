'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './ProcessSection.module.css';

const processSteps = [
  {
    id: 'discovery',
    number: '01',
    title: 'Escuta',
    description: 'Entendemos seu negócio antes de escrever uma linha de código',
    detail: 'Reuniões, pesquisa, imersão no problema',
  },
  {
    id: 'architecture',
    number: '02',
    title: 'Arquitetura',
    description: 'Desenhamos a solução técnica que faz sentido pro seu contexto',
    detail: 'Stack, infraestrutura, integrações',
  },
  {
    id: 'build',
    number: '03',
    title: 'Construção',
    description: 'Desenvolvimento iterativo com entregas constantes',
    detail: 'Sprints semanais, demos, ajustes',
  },
  {
    id: 'launch',
    number: '04',
    title: 'Lançamento',
    description: 'Deploy, monitoramento e suporte pós-entrega',
    detail: 'CI/CD, observabilidade, manutenção',
  },
];

function StepCard({
  step,
  index,
  isInView,
}: {
  step: (typeof processSteps)[0];
  index: number;
  isInView: boolean;
}) {
  const isEven = index % 2 === 0;

  return (
    <div className={styles.stepRow}>
      <motion.div
        className={styles.timelineDot}
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ duration: 0.4, delay: 0.3 + index * 0.15 }}
      />
      <motion.div
        className={`${styles.stepCard} ${isEven ? styles.stepCardLeft : styles.stepCardRight}`}
        initial={{ opacity: 0, x: isEven ? -60 : 60 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? -60 : 60 }}
        transition={{ duration: 0.6, delay: index * 0.15 }}
      >
        <div className={styles.stepNumber}>{step.number}</div>
        <div className={styles.stepContent}>
          <h3 className={styles.stepTitle}>{step.title}</h3>
          <p className={styles.stepDescription}>{step.description}</p>
          <span className={styles.stepDetail}>{step.detail}</span>
        </div>
      </motion.div>
    </div>
  );
}

function TimelineLine({ isInView }: { isInView: boolean }) {
  return (
    <div className={styles.timeline}>
      <motion.div
        className={styles.timelineLine}
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </div>
  );
}

function FloatingTag({
  children,
  delay,
  position,
}: {
  children: string;
  delay: number;
  position: { top?: string; bottom?: string; left?: string; right?: string };
}) {
  return (
    <motion.span
      className={styles.floatingTag}
      style={position}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.span>
  );
}

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Background Elements */}
      <motion.div className={styles.backgroundGradient} style={{ y: backgroundY }} />
      <div className={styles.gridOverlay} />

      <div className={styles.container}>
        {/* Header - Assimétrico */}
        <div className={styles.header}>
          <motion.div
            className={styles.headerLeft}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.eyebrow}>Processo</span>
            <h2 className={styles.title}>
              Do problema
              <br />
              <span className={styles.titleAccent}>à solução.</span>
            </h2>
          </motion.div>

          <motion.p
            className={styles.headerRight}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Não trabalhamos com achismos. Cada projeto segue um fluxo testado que garante entregas
            previsíveis sem sacrificar a qualidade técnica.
          </motion.p>
        </div>

        {/* Steps Grid com Timeline */}
        <div className={styles.stepsWrapper}>
          <TimelineLine isInView={isInView} />

          <div className={styles.stepsGrid}>
            {processSteps.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} isInView={isInView} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className={styles.bottomCta}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className={styles.ctaLine} />
          <p className={styles.ctaText}>
            Tempo médio de entrega: <strong>4-12 semanas</strong>
          </p>
          <div className={styles.ctaLine} />
        </motion.div>
      </div>

      {/* Floating Tags - Elementos decorativos */}
      {isInView && (
        <>
          <FloatingTag delay={1} position={{ top: '15%', left: '5%' }}>
            git commit
          </FloatingTag>
          <FloatingTag delay={1.2} position={{ top: '45%', right: '3%' }}>
            npm run build
          </FloatingTag>
          <FloatingTag delay={1.4} position={{ bottom: '20%', left: '8%' }}>
            deploy --prod
          </FloatingTag>
        </>
      )}
    </section>
  );
}
