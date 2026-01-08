"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import styles from "./ContactSection.module.css";

// ============================================
// TYPES & DATA
// ============================================

interface ProjectType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ProjectSize {
  id: string;
  label: string;
  description: string;
  indicator: number; // 1-4 scale
}

interface ProjectTimeline {
  id: string;
  label: string;
  description: string;
}

const PROJECT_TYPES: ProjectType[] = [
  {
    id: "web",
    label: "Sistema Web",
    description: "Plataformas, dashboards, e-commerce",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    id: "mobile",
    label: "App Mobile",
    description: "iOS, Android ou ambos",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    id: "automation",
    label: "Automação",
    description: "Integrações, bots, APIs",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: "other",
    label: "Outro",
    description: "Consultoria, manutenção, etc",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9 9h.01" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.4-1 1-1 1.7v.5" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
];

const PROJECT_SIZES: ProjectSize[] = [
  {
    id: "mvp",
    label: "MVP",
    description: "Versão inicial para validar a ideia",
    indicator: 1,
  },
  {
    id: "standard",
    label: "Padrão",
    description: "Projeto completo com funcionalidades essenciais",
    indicator: 2,
  },
  {
    id: "advanced",
    label: "Avançado",
    description: "Sistema robusto com integrações",
    indicator: 3,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    description: "Solução completa e escalável",
    indicator: 4,
  },
];

const PROJECT_TIMELINES: ProjectTimeline[] = [
  {
    id: "urgent",
    label: "Urgente",
    description: "Prioridade máxima",
  },
  {
    id: "normal",
    label: "Normal",
    description: "Prazo padrão",
  },
  {
    id: "flexible",
    label: "Flexível",
    description: "Sem pressa",
  },
];

// ============================================
// COMPONENTS
// ============================================

function ProjectTypeCard({
  project,
  isSelected,
  onClick,
}: {
  project: ProjectType;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className={`${styles.typeCard} ${isSelected ? styles.typeCardSelected : ""}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.typeCardIcon}>{project.icon}</div>
      <div className={styles.typeCardContent}>
        <span className={styles.typeCardLabel}>{project.label}</span>
        <span className={styles.typeCardDescription}>
          {project.description}
        </span>
      </div>
      <div className={styles.typeCardCheck}>
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isSelected ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path d="M5 12l5 5L20 7" />
        </motion.svg>
      </div>
    </motion.button>
  );
}

function SizeSelector({
  sizes,
  selectedId,
  onSelect,
}: {
  sizes: ProjectSize[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.sizeSelector}>
      <div className={styles.sizeTrack}>
        {sizes.map((size, index) => {
          const isSelected = selectedId === size.id;
          const isPast = selectedId
            ? sizes.findIndex((s) => s.id === selectedId) >= index
            : false;

          return (
            <motion.button
              key={size.id}
              type="button"
              className={`${styles.sizeNode} ${isSelected ? styles.sizeNodeSelected : ""} ${isPast ? styles.sizeNodePast : ""}`}
              onClick={() => onSelect(size.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={styles.sizeNodeDot}>
                <span>{size.indicator}</span>
              </div>
              <div className={styles.sizeNodeInfo}>
                <span className={styles.sizeNodeLabel}>{size.label}</span>
                <span className={styles.sizeNodeDescription}>
                  {size.description}
                </span>
              </div>
            </motion.button>
          );
        })}
        <div className={styles.sizeTrackLine}>
          <motion.div
            className={styles.sizeTrackProgress}
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: selectedId
                ? (sizes.findIndex((s) => s.id === selectedId) + 1) /
                  sizes.length
                : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

function TimelineSelector({
  timelines,
  selectedId,
  onSelect,
}: {
  timelines: ProjectTimeline[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.timelineSelector}>
      {timelines.map((timeline) => {
        const isSelected = selectedId === timeline.id;

        return (
          <motion.button
            key={timeline.id}
            type="button"
            className={`${styles.timelineCard} ${isSelected ? styles.timelineCardSelected : ""}`}
            onClick={() => onSelect(timeline.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className={styles.timelineLabel}>{timeline.label}</span>
            <span className={styles.timelineDescription}>
              {timeline.description}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function ConfigSummary({
  projectTypes,
  projectSize,
  projectTimeline,
  isComplete,
  onSubmit,
}: {
  projectTypes: ProjectType[];
  projectSize: ProjectSize | null;
  projectTimeline: ProjectTimeline | null;
  isComplete: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryHeader}>
        <span className={styles.summaryTitle}>Seu projeto</span>
        <div className={styles.summaryProgress}>
          <div
            className={styles.summaryProgressBar}
            style={{
              width: `${(((projectTypes.length > 0 ? 1 : 0) + (projectSize ? 1 : 0) + (projectTimeline ? 1 : 0)) / 3) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className={styles.summaryItems}>
        <AnimatePresence mode="popLayout">
          {projectTypes.length > 0 && (
            <motion.div
              key="type"
              className={styles.summaryItemTypes}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <span className={styles.summaryItemLabel}>Tipo</span>
              <div className={styles.summaryTags}>
                {projectTypes.map((t) => (
                  <span key={t.id} className={styles.summaryTag}>
                    <span className={styles.summaryTagIcon}>{t.icon}</span>
                    <span>{t.label}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {projectSize && (
            <motion.div
              key="size"
              className={styles.summaryItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <span className={styles.summaryItemLabel}>Escopo</span>
              <span className={styles.summaryItemValue}>
                {projectSize.label}
              </span>
            </motion.div>
          )}

          {projectTimeline && (
            <motion.div
              key="timeline"
              className={styles.summaryItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <span className={styles.summaryItemLabel}>Prazo</span>
              <span className={styles.summaryItemValue}>
                {projectTimeline.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {projectTypes.length === 0 && !projectSize && !projectTimeline && (
          <div className={styles.summaryEmpty}>
            <span>Selecione as opções ao lado</span>
          </div>
        )}
      </div>

      <motion.button
        type="button"
        className={styles.submitButton}
        onClick={onSubmit}
        disabled={!isComplete}
        whileHover={isComplete ? { scale: 1.02 } : {}}
        whileTap={isComplete ? { scale: 0.98 } : {}}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span>Conversar no WhatsApp</span>
      </motion.button>

      <p className={styles.summaryNote}>Resposta em até 24h</p>
    </div>
  );
}

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={`step-${i}`}
          className={`${styles.stepDot} ${i < currentStep ? styles.stepDotCompleted : ""} ${i === currentStep ? styles.stepDotActive : ""}`}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // State
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);

  // Derived data
  const projectTypes = useMemo(
    () => PROJECT_TYPES.filter((p) => selectedTypes.includes(p.id)),
    [selectedTypes],
  );
  const projectSize = useMemo(
    () => PROJECT_SIZES.find((s) => s.id === selectedSize) || null,
    [selectedSize],
  );
  const projectTimeline = useMemo(
    () => PROJECT_TIMELINES.find((t) => t.id === selectedTimeline) || null,
    [selectedTimeline],
  );

  const isComplete = Boolean(
    selectedTypes.length > 0 && selectedSize && selectedTimeline,
  );

  const currentStep = useMemo(() => {
    if (selectedTypes.length === 0) return 0;
    if (!selectedSize) return 1;
    if (!selectedTimeline) return 2;
    return 3;
  }, [selectedTypes, selectedSize, selectedTimeline]);

  // Handler for multi-select types
  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  // Handlers
  const handleSubmit = () => {
    if (!isComplete) return;

    const typesLabel = projectTypes.map((t) => t.label).join(", ");
    const message = encodeURIComponent(
      `Olá! Tenho interesse em um projeto:\n\n` +
        `*Tipo:* ${typesLabel}\n` +
        `*Escopo:* ${projectSize?.label} - ${projectSize?.description}\n` +
        `*Prazo:* ${projectTimeline?.label}\n\n` +
        `Gostaria de conversar sobre os detalhes.`,
    );

    window.open(`https://wa.me/5514996223121?text=${message}`, "_blank");
  };

  return (
    <section ref={sectionRef} id="contato" className={styles.section}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb} />
        <div className={styles.gridPattern} />
      </div>

      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.eyebrow}>Iniciar projeto</span>
          <h2 className={styles.title}>
            Monte seu
            <span className={styles.titleAccent}> briefing</span>
          </h2>
          <p className={styles.description}>
            Selecione as opções abaixo e receba um orçamento personalizado
          </p>
        </motion.div>

        <StepIndicator currentStep={currentStep} totalSteps={3} />

        {/* Main Layout */}
        <div className={styles.layout}>
          {/* Left: Configurator */}
          <motion.div
            className={styles.configurator}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Step 1: Project Type */}
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>01</span>
                <h3 className={styles.stepTitle}>Tipo de projeto</h3>
              </div>
              <div className={styles.typeGrid}>
                {PROJECT_TYPES.map((project) => (
                  <ProjectTypeCard
                    key={project.id}
                    project={project}
                    isSelected={selectedTypes.includes(project.id)}
                    onClick={() => handleTypeToggle(project.id)}
                  />
                ))}
              </div>
            </div>

            {/* Step 2: Project Size */}
            <div
              className={`${styles.step} ${selectedTypes.length === 0 ? styles.stepDisabled : ""}`}
            >
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>02</span>
                <h3 className={styles.stepTitle}>Tamanho do projeto</h3>
              </div>
              <SizeSelector
                sizes={PROJECT_SIZES}
                selectedId={selectedSize}
                onSelect={setSelectedSize}
              />
            </div>

            {/* Step 3: Timeline */}
            <div
              className={`${styles.step} ${!selectedSize ? styles.stepDisabled : ""}`}
            >
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>03</span>
                <h3 className={styles.stepTitle}>Prazo desejado</h3>
              </div>
              <TimelineSelector
                timelines={PROJECT_TIMELINES}
                selectedId={selectedTimeline}
                onSelect={setSelectedTimeline}
              />
            </div>
          </motion.div>

          {/* Right: Summary */}
          <motion.div
            className={styles.summaryWrapper}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ConfigSummary
              projectTypes={projectTypes}
              projectSize={projectSize}
              projectTimeline={projectTimeline}
              isComplete={isComplete}
              onSubmit={handleSubmit}
            />

            {/* Alternative contact */}
            <div className={styles.altContact}>
              <span className={styles.altContactLabel}>
                Ou entre em contato direto
              </span>
              <a
                href="mailto:contato@basylab.com.br"
                className={styles.altContactLink}
              >
                contato@basylab.com.br
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
