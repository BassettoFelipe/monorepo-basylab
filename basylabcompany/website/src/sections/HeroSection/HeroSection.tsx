"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { GlowButton } from "@/components/GlowButton/GlowButton";
import styles from "./HeroSection.module.css";

// Hook to detect mobile/tablet devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Hook to detect reduced motion preference
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

const codeLines = [
  { id: "line-1", text: "// Sua ideia começa aqui", delay: 0 },
  { id: "line-2", text: "", delay: 100 },
  { id: "line-3", text: "const seuProjeto = {", delay: 200 },
  { id: "line-4", text: '  ideia: "Sua visão",', delay: 300 },
  { id: "line-5", text: "  prazo: definido,", delay: 400 },
  { id: "line-6", text: "  qualidade: garantida,", delay: 500 },
  { id: "line-7", text: "};", delay: 600 },
  { id: "line-8", text: "", delay: 700 },
  { id: "line-9", text: "basylab.transformar(seuProjeto);", delay: 800 },
  { id: "line-10", text: "// Resultado: software que funciona", delay: 900 },
];

const floatingChars = [
  { id: "char-1", char: "</>" },
  { id: "char-2", char: "{}" },
  { id: "char-3", char: "=>" },
  { id: "char-4", char: "()" },
  { id: "char-5", char: "&&" },
  { id: "char-6", char: "[]" },
  { id: "char-7", char: "//" },
  { id: "char-8", char: "**" },
];

function TypewriterCode() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (currentLine >= codeLines.length) return;

    const line = codeLines[currentLine].text;

    if (currentChar < line.length) {
      const timeout = setTimeout(
        () => {
          setDisplayedLines((prev) => {
            const newLines = [...prev];
            newLines[currentLine] = line.slice(0, currentChar + 1);
            return newLines;
          });
          setCurrentChar((prev) => prev + 1);
        },
        30 + Math.random() * 20,
      );
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setCurrentLine((prev) => prev + 1);
      setCurrentChar(0);
      setDisplayedLines((prev) => [...prev, ""]);
    }, 200);
    return () => clearTimeout(timeout);
  }, [currentLine, currentChar]);

  const getHighlightedText = (
    text: string,
    lineId: string,
  ): React.ReactNode => {
    if (!text) return null;

    // Comentários
    if (text.trim().startsWith("//")) {
      return <span className={styles.comment}>{text}</span>;
    }

    const keywords = [
      "const",
      "let",
      "var",
      "await",
      "async",
      "function",
      "return",
      "if",
      "else",
    ];
    const values = [
      "true",
      "false",
      "null",
      "undefined",
      "definido",
      "garantida",
    ];

    // Tokenizar o texto
    const tokenRegex =
      /("(?:[^"\\]|\\.)*")|(\b(?:const|let|var|await|async|function|return|if|else|true|false|null|undefined|definido|garantida)\b)|(\w+)(?=\()|(\w+)(?=:)|([{}[\]();,.])|(\s+)|(.)/g;

    const matches = Array.from(text.matchAll(tokenRegex));
    const tokens: React.ReactNode[] = [];

    for (const [tokenIndex, match] of matches.entries()) {
      const [
        fullMatch,
        stringMatch,
        keywordOrValue,
        functionName,
        propertyName,
        punctuation,
        whitespace,
        other,
      ] = match;

      const key = `${lineId}-token-${tokenIndex}`;

      if (stringMatch) {
        tokens.push(
          <span key={key} className={styles.string}>
            {stringMatch}
          </span>,
        );
      } else if (keywordOrValue) {
        if (keywords.includes(keywordOrValue)) {
          tokens.push(
            <span key={key} className={styles.keyword}>
              {keywordOrValue}
            </span>,
          );
        } else if (values.includes(keywordOrValue)) {
          tokens.push(
            <span key={key} className={styles.value}>
              {keywordOrValue}
            </span>,
          );
        }
      } else if (functionName) {
        tokens.push(
          <span key={key} className={styles.function}>
            {functionName}
          </span>,
        );
      } else if (propertyName) {
        tokens.push(
          <span key={key} className={styles.property}>
            {propertyName}
          </span>,
        );
      } else if (punctuation) {
        tokens.push(
          <span key={key} className={styles.punctuation}>
            {punctuation}
          </span>,
        );
      } else if (whitespace || other) {
        tokens.push(<span key={key}>{fullMatch}</span>);
      }
    }

    return tokens.length > 0 ? tokens : text;
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalHeader}>
        <div className={styles.terminalDots}>
          <span className={styles.terminalDotRed} />
          <span className={styles.terminalDotYellow} />
          <span className={styles.terminalDotGreen} />
        </div>
        <span className={styles.terminalTitle}>basylab.ts</span>
      </div>
      <div className={styles.terminalBody}>
        <div className={styles.lineNumbers}>
          {displayedLines.map((_, i) => (
            <span key={codeLines[i]?.id ?? `num-extra-${i}`}>{i + 1}</span>
          ))}
        </div>
        <pre className={styles.code}>
          {displayedLines.map((line, i) => {
            const lineId = codeLines[i]?.id ?? `displayed-line-${i}`;
            return (
              <div key={lineId} className={styles.codeLine}>
                <span>{getHighlightedText(line, lineId)}</span>
                {i === currentLine && currentLine < codeLines.length && (
                  <span
                    className={`${styles.cursor} ${showCursor ? styles.cursorVisible : ""}`}
                  >
                    |
                  </span>
                )}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

function FloatingParticles() {
  // Pre-calculate random values to avoid recalculation on re-renders
  const particleConfigs = useMemo(
    () =>
      floatingChars.map((item, i) => {
        const sectionWidth = 100 / floatingChars.length;
        const baseLeft = sectionWidth * i + sectionWidth * 0.2;
        const randomOffset = sectionWidth * 0.6 * Math.random();
        return {
          ...item,
          left: baseLeft + randomOffset,
          duration: 14 + Math.random() * 6,
          delay: i * 1.5 + Math.random() * 2,
          rotateDirection: Math.random() > 0.5 ? 180 : -180,
        };
      }),
    [],
  );

  return (
    <div className={styles.particles}>
      {particleConfigs.map((config) => (
        <motion.span
          key={config.id}
          className={styles.particle}
          initial={{
            y: "105%",
            opacity: 0,
          }}
          animate={{
            y: ["105%", "35%"],
            opacity: [0, 0.5, 0.5, 0],
            rotate: [0, config.rotateDirection],
          }}
          transition={{
            duration: config.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: config.delay,
            ease: "linear",
          }}
          style={{
            left: `${config.left}%`,
            fontSize: "1rem",
          }}
        >
          {config.char}
        </motion.span>
      ))}
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState("");
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = [
    { text: "sistemas operacionais", icon: "●" },
    { text: "aguardando input", icon: "◐" },
    { text: "pronto para deploy", icon: "▲" },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
      className={styles.statusBar}
    >
      <div className={styles.statusContent}>
        <span className={styles.statusBranch}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.5 2.5 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
          </svg>
          main
        </span>

        <span className={styles.statusDivider}>|</span>

        <motion.span
          key={statusIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={styles.statusMessage}
        >
          <span className={styles.statusIcon}>
            {statusMessages[statusIndex].icon}
          </span>
          {statusMessages[statusIndex].text}
        </motion.span>

        <span className={styles.statusDivider}>|</span>

        <span className={styles.statusTime}>{time}</span>
      </div>

      <motion.div
        className={styles.statusPulse}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      />
    </motion.div>
  );
}

function GlitchText({ children }: { children: string }) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      },
      4000 + Math.random() * 2000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`${styles.glitchWrapper} ${isGlitching ? styles.glitching : ""}`}
    >
      <span className={styles.glitchText} data-text={children}>
        {children}
      </span>
    </span>
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = !isMobile && !prefersReducedMotion;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Only use springs on desktop for performance
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const gridRotateX = useTransform(smoothMouseY, [-500, 500], [5, -5]);
  const gridRotateY = useTransform(smoothMouseX, [-500, 500], [-5, 5]);

  useEffect(() => {
    // Skip mouse tracking on mobile
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set(clientX - innerWidth / 2);
      mouseY.set(clientY - innerHeight / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, isMobile]);

  // Memoize orb animations - full animation on desktop, light animation on mobile
  const orbPrimaryAnimation = useMemo(
    () =>
      prefersReducedMotion
        ? {}
        : shouldAnimate
          ? {
              scale: [1, 1.2, 1],
              x: [0, 30, -20, 0],
              y: [0, -20, 30, 0],
            }
          : {
              // Light animation for mobile - just subtle opacity pulse
              opacity: [1, 0.7, 1],
            },
    [shouldAnimate, prefersReducedMotion],
  );

  const orbSecondaryAnimation = useMemo(
    () =>
      prefersReducedMotion
        ? {}
        : shouldAnimate
          ? {
              scale: [1, 1.3, 1],
              x: [0, -40, 20, 0],
              y: [0, 40, -30, 0],
            }
          : {
              // Light animation for mobile - just subtle opacity pulse
              opacity: [1, 0.6, 1],
            },
    [shouldAnimate, prefersReducedMotion],
  );

  return (
    <section ref={containerRef} className={styles.section}>
      {/* Interactive 3D Grid Background */}
      <div className={styles.background}>
        <div className={styles.backgroundBase} />

        <motion.div
          className={styles.grid3d}
          style={
            shouldAnimate
              ? {
                  rotateX: gridRotateX,
                  rotateY: gridRotateY,
                }
              : undefined
          }
        />

        {/* Only render particles on desktop */}
        {!isMobile && <FloatingParticles />}

        {/* Gradient orbs - full animation on desktop, light pulse on mobile */}
        <motion.div
          className={styles.orbPrimary}
          animate={orbPrimaryAnimation}
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: shouldAnimate ? 10 : 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
          }
        />
        <motion.div
          className={styles.orbSecondary}
          animate={orbSecondaryAnimation}
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: shouldAnimate ? 12 : 8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
          }
        />

        <div className={styles.scanlines} />
        <div className={styles.noise} />
        <div className={styles.vignette} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Logo - Centered above content */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className={styles.logo}
        >
          <Image
            src="/images/logo-light.svg"
            alt="Basylab"
            width={320}
            height={107}
            priority
          />
        </motion.div>

        <div className={styles.layout}>
          {/* Left: Text Content */}
          <motion.div
            className={styles.textContent}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className={styles.headline}
            >
              Chega de software <GlitchText>medíocre.</GlitchText>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className={styles.subheadline}
            >
              Desenvolvemos soluções digitais com o{" "}
              <span className={styles.highlight}>rigor técnico</span> que seu
              negócio merece.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={styles.stats}
            >
              <div className={styles.stat}>
                <span className={styles.statValue}>10k+</span>
                <span className={styles.statLabel}>Horas de código</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>30+</span>
                <span className={styles.statLabel}>Projetos entregues</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>100%</span>
                <span className={styles.statLabel}>Clientes satisfeitos</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className={styles.ctas}
            >
              <GlowButton href="#contato" variant="primary">
                Iniciar Projeto
              </GlowButton>
              <GlowButton href="#processo" variant="secondary">
                Ver processo
              </GlowButton>
            </motion.div>
          </motion.div>

          {/* Right: Terminal */}
          <motion.div
            className={styles.terminalWrapper}
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          >
            <TypewriterCode />
          </motion.div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </section>
  );
}
