"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./ReferralModal.module.css";

// ============================================
// REFERRAL CONFIGURATIONS
// ============================================

interface ReferralConfig {
  id: string;
  platform: string;
  greeting: string;
  message: string;
  cta: string;
  whatsappMessage: string;
  accentColor?: string;
}

const REFERRAL_CONFIGS: Record<string, ReferralConfig> = {
  workana: {
    id: "workana",
    platform: "Workana",
    greeting: "Que bom que veio!",
    message:
      "Você chegou através do Workana. Já vimos seu projeto e estamos muito interessados em ajudar. Dá uma olhada no nosso portfólio e, quando quiser, é só clicar abaixo para a gente conversar.",
    cta: "Bora conversar",
    whatsappMessage:
      "Oi! Vi vocês no Workana e vim pelo link do perfil. Quero falar sobre meu projeto!",
  },
  "99freelas": {
    id: "99freelas",
    platform: "99Freelas",
    greeting: "Eaí, tudo bem?",
    message:
      "Chegou pelo 99Freelas! Analisamos seu projeto e achamos que podemos entregar exatamente o que você precisa. Explore nosso trabalho e me chama quando estiver pronto.",
    cta: "Vamos conversar",
    whatsappMessage:
      "Oi! Vim do 99Freelas pelo link do perfil de vocês. Quero discutir meu projeto!",
  },
  freelancer: {
    id: "freelancer",
    platform: "Freelancer.com",
    greeting: "Welcome!",
    message:
      "Você veio do Freelancer.com. Ficamos animados com seu projeto! Dê uma olhada no que fazemos e entre em contato quando quiser começar.",
    cta: "Iniciar conversa",
    whatsappMessage:
      "Hi! I came from Freelancer.com through your profile link. I'd like to discuss my project!",
  },
  upwork: {
    id: "upwork",
    platform: "Upwork",
    greeting: "Great to see you!",
    message:
      "Chegou via Upwork! Seu projeto chamou nossa atenção e queremos entender melhor como podemos ajudar. Confira nosso portfólio abaixo.",
    cta: "Let's talk",
    whatsappMessage:
      "Hello! I found you on Upwork and came through your profile link. Let's discuss the project!",
  },
  fiverr: {
    id: "fiverr",
    platform: "Fiverr",
    greeting: "Hey there!",
    message:
      "Você veio do Fiverr. Estamos prontos para transformar sua ideia em realidade. Explore nosso trabalho e vamos conversar!",
    cta: "Bora lá",
    whatsappMessage:
      "Oi! Achei vocês no Fiverr e vim pelo link. Quero saber mais sobre como vocês podem me ajudar!",
  },
  linkedin: {
    id: "linkedin",
    platform: "LinkedIn",
    greeting: "Prazer em conhecer!",
    message:
      "Você chegou pelo LinkedIn. Adoramos conectar com profissionais que buscam qualidade. Veja nossos cases e vamos marcar uma call.",
    cta: "Agendar conversa",
    whatsappMessage:
      "Olá! Vim pelo LinkedIn e gostaria de saber mais sobre os serviços de vocês.",
  },
  indicacao: {
    id: "indicacao",
    platform: "Indicação",
    greeting: "Que honra!",
    message:
      "Alguém de confiança te indicou para nós. Isso é muito especial! Veja o que fazemos e vamos entender como podemos te ajudar.",
    cta: "Vamos conversar",
    whatsappMessage:
      "Oi! Recebi uma indicação sobre vocês e vim conhecer o trabalho. Vamos conversar?",
  },
  default: {
    id: "default",
    platform: "Referência",
    greeting: "Bem-vindo!",
    message:
      "Que bom que está aqui! Somos a Basylab, uma empresa de desenvolvimento de software focada em entregar soluções que funcionam. Explore nosso site e entre em contato quando quiser.",
    cta: "Falar conosco",
    whatsappMessage:
      "Oi! Vim pelo site de vocês e quero saber mais sobre os serviços.",
  },
};

// ============================================
// ANIMATED BACKGROUND
// ============================================

function AnimatedBackground() {
  return (
    <div className={styles.animatedBg}>
      <motion.div
        className={styles.orb1}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={styles.orb2}
        animate={{
          scale: [1, 0.8, 1],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <div className={styles.noise} />
    </div>
  );
}

// ============================================
// TYPING ANIMATION COMPONENT
// ============================================

function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const timeoutId = setTimeout(() => {
      let currentIndex = 0;
      intervalId = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          if (intervalId) clearInterval(intervalId);
          setIsComplete(true);
        }
      }, 25);
    }, delay);

    // Cleanup correto: limpar tanto timeout quanto interval
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay]);

  return (
    <span className={styles.typingText}>
      {displayedText}
      {!isComplete && <span className={styles.cursor}>|</span>}
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ReferralModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [showContent, setShowContent] = useState(false);

  // Check for ref parameter on mount
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      const referralConfig = REFERRAL_CONFIGS[ref] || REFERRAL_CONFIGS.default;
      setConfig(referralConfig);
      setIsOpen(true);
      // Small delay before showing content for smoother animation
      setTimeout(() => setShowContent(true), 300);
    }
  }, [searchParams]);

  // Handle close
  const handleClose = useCallback(() => {
    setShowContent(false);
    setTimeout(() => {
      setIsOpen(false);
      // Remove ref from URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      router.replace(url.pathname, { scroll: false });
    }, 300);
  }, [router]);

  // Handle WhatsApp click
  const handleWhatsApp = useCallback(() => {
    if (!config) return;
    const message = encodeURIComponent(config.whatsappMessage);
    window.open(`https://wa.me/5514996223121?text=${message}`, "_blank");
    handleClose();
  }, [config, handleClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!config) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-modal-title"
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
          >
            <AnimatedBackground />

            {/* Close button */}
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Fechar modal"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <title>Fechar</title>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className={styles.content}>
              {/* Platform badge */}
              <motion.div
                className={styles.badge}
                initial={{ opacity: 0, y: -10 }}
                animate={showContent ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 }}
              >
                <span className={styles.badgeIcon}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>Verificado</title>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
                <span>via {config.platform}</span>
              </motion.div>

              {/* Greeting */}
              <motion.h2
                id="referral-modal-title"
                className={styles.greeting}
                initial={{ opacity: 0, y: 10 }}
                animate={showContent ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
              >
                {showContent && (
                  <TypingText text={config.greeting} delay={200} />
                )}
              </motion.h2>

              {/* Message */}
              <motion.p
                className={styles.message}
                initial={{ opacity: 0, y: 10 }}
                animate={showContent ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                {config.message}
              </motion.p>

              {/* Actions */}
              <motion.div
                className={styles.actions}
                initial={{ opacity: 0, y: 10 }}
                animate={showContent ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleWhatsApp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>WhatsApp</title>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>{config.cta}</span>
                </motion.button>

                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleClose}
                >
                  Ver portfólio primeiro
                </button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                className={styles.trust}
                initial={{ opacity: 0 }}
                animate={showContent ? { opacity: 1 } : {}}
                transition={{ delay: 0.8 }}
              >
                <div className={styles.trustItem}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>Estrela</title>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>+30 projetos entregues</span>
                </div>
                <div className={styles.trustItem}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>Informacao</title>
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
                  </svg>
                  <span>Resposta em até 2h</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
