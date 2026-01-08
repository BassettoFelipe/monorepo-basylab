"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import styles from "./ContactSection.module.css";

// ============================================
// TYPES & DATA
// ============================================

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface Step {
  id: string;
  question: string;
  options: Option[];
}

const STEPS: Step[] = [
  {
    id: "type",
    question: "Que tipo de projeto você precisa?",
    options: [
      {
        id: "web",
        label: "Sistema Web",
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
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "size",
    question: "Qual o tamanho do projeto?",
    options: [
      { id: "mvp", label: "MVP - Versão inicial" },
      { id: "medium", label: "Médio - Funcionalidades completas" },
      { id: "large", label: "Grande - Sistema robusto" },
    ],
  },
  {
    id: "timeline",
    question: "Qual a urgência?",
    options: [
      { id: "urgent", label: "Urgente - Preciso logo" },
      { id: "normal", label: "Normal - 1 a 3 meses" },
      { id: "flexible", label: "Flexível - Sem pressa" },
    ],
  },
];

// ============================================
// COMPONENTS
// ============================================

function MessageBubble({
  children,
  isUser = false,
  delay = 0,
}: {
  children: React.ReactNode;
  isUser?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}

function OptionButton({
  option,
  onSelect,
  delay = 0,
  hasIcon = false,
}: {
  option: Option;
  onSelect: (id: string) => void;
  delay?: number;
  hasIcon?: boolean;
}) {
  return (
    <motion.button
      type="button"
      className={`${styles.optionButton} ${hasIcon ? styles.optionButtonWithIcon : ""}`}
      onClick={() => onSelect(option.id)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
      <span className={styles.optionLabel}>{option.label}</span>
    </motion.button>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      className={styles.typing}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <span />
      <span />
      <span />
    </motion.div>
  );
}

function FinalStep({
  selections,
  onSubmit,
  onReset,
}: {
  selections: Record<string, string>;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const getLabel = (stepId: string, optionId: string) => {
    const step = STEPS.find((s) => s.id === stepId);
    const option = step?.options.find((o) => o.id === optionId);
    return option?.label || optionId;
  };

  return (
    <motion.div
      className={styles.finalStep}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.summaryCard}>
        <span className={styles.summaryTitle}>Resumo do seu projeto</span>

        <div className={styles.summaryList}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Tipo</span>
            <span className={styles.summaryValue}>
              {getLabel("type", selections.type)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Tamanho</span>
            <span className={styles.summaryValue}>
              {getLabel("size", selections.size)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Urgência</span>
            <span className={styles.summaryValue}>
              {getLabel("timeline", selections.timeline)}
            </span>
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        className={styles.submitButton}
        onClick={onSubmit}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span>Continuar no WhatsApp</span>
      </motion.button>

      <button type="button" className={styles.resetButton} onClick={onReset}>
        Recomeçar
      </button>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  const currentStep = STEPS[currentStepIndex];
  const isComplete = currentStepIndex >= STEPS.length;

  // Build conversation history
  const conversationHistory = useMemo(() => {
    const history: Array<{ stepId: string; question: string; answer: string }> =
      [];

    for (let i = 0; i < currentStepIndex; i++) {
      const step = STEPS[i];
      const selectedOption = step.options.find(
        (o) => o.id === selections[step.id],
      );
      if (selectedOption) {
        history.push({
          stepId: step.id,
          question: step.question,
          answer: selectedOption.label,
        });
      }
    }

    return history;
  }, [currentStepIndex, selections]);

  const handleSelect = (optionId: string) => {
    if (!currentStep) return;

    // Save selection
    setSelections((prev) => ({ ...prev, [currentStep.id]: optionId }));
    setShowOptions(false);

    // Show typing indicator then next question
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setCurrentStepIndex((prev) => prev + 1);
      setShowOptions(true);

      // Scroll to bottom with smooth behavior
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }, 600);
  };

  const handleSubmit = () => {
    const typeLabel = STEPS[0].options.find(
      (o) => o.id === selections.type,
    )?.label;
    const sizeLabel = STEPS[1].options.find(
      (o) => o.id === selections.size,
    )?.label;
    const timelineLabel = STEPS[2].options.find(
      (o) => o.id === selections.timeline,
    )?.label;

    const message = encodeURIComponent(
      `Olá! Tenho interesse em um projeto:\n\n` +
        `*Tipo:* ${typeLabel}\n` +
        `*Tamanho:* ${sizeLabel}\n` +
        `*Urgência:* ${timelineLabel}\n\n` +
        `Podemos conversar?`,
    );

    window.open(`https://wa.me/5514996223121?text=${message}`, "_blank");
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setSelections({});
    setShowOptions(true);
  };

  return (
    <section ref={sectionRef} id="contato" className={styles.section}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb} />
      </div>

      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.eyebrow}>Vamos conversar</span>
          <h2 className={styles.title}>
            Conte sobre seu
            <span className={styles.titleAccent}> projeto</span>
          </h2>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          className={styles.chatContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar}>
              <span>B</span>
            </div>
            <div className={styles.chatInfo}>
              <span className={styles.chatName}>Basylab</span>
              <span className={styles.chatStatus}>
                <span className={styles.statusDot} />
                Online agora
              </span>
            </div>
          </div>

          <div ref={chatRef} className={styles.chatBody}>
            {/* Initial greeting */}
            <MessageBubble delay={0.2}>
              Olá! Vou te ajudar a montar um briefing rápido.
            </MessageBubble>

            {/* Conversation history */}
            {conversationHistory.map((item, index) => (
              <div key={item.stepId} className={styles.exchangeGroup}>
                <MessageBubble delay={0}>{item.question}</MessageBubble>
                <MessageBubble isUser delay={0.05}>
                  {item.answer}
                </MessageBubble>
              </div>
            ))}

            {/* Current question */}
            {!isComplete && !isTyping && (
              <MessageBubble
                delay={conversationHistory.length === 0 ? 0.4 : 0.1}
              >
                {currentStep?.question}
              </MessageBubble>
            )}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <div className={styles.bubble}>
                  <TypingIndicator />
                </div>
              )}
            </AnimatePresence>

            {/* Options or Final step */}
            <AnimatePresence mode="wait">
              {!isComplete && showOptions && !isTyping && currentStep && (
                <motion.div
                  key={currentStep.id}
                  className={styles.optionsGrid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep.options.map((option, index) => (
                    <OptionButton
                      key={option.id}
                      option={option}
                      onSelect={handleSelect}
                      delay={0.1 + index * 0.05}
                      hasIcon={Boolean(option.icon)}
                    />
                  ))}
                </motion.div>
              )}

              {isComplete && (
                <FinalStep
                  key="final"
                  selections={selections}
                  onSubmit={handleSubmit}
                  onReset={handleReset}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Alternative contact */}
        <motion.div
          className={styles.altContact}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span>Prefere email?</span>
          <a href="mailto:contato@basylab.com.br">contato@basylab.com.br</a>
        </motion.div>
      </div>
    </section>
  );
}
