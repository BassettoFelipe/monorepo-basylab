"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GlowButton } from "@/components/GlowButton/GlowButton";
import styles from "./HeroSection.module.css";

const codeLines = [
  { text: "// Sua ideia começa aqui", delay: 0 },
  { text: "", delay: 100 },
  { text: "const seuProjeto = {", delay: 200 },
  { text: '  ideia: "Sua visão",', delay: 300 },
  { text: "  prazo: definido,", delay: 400 },
  { text: "  qualidade: garantida,", delay: 500 },
  { text: "};", delay: 600 },
  { text: "", delay: 700 },
  { text: "basylab.transformar(seuProjeto);", delay: 800 },
  { text: "// Resultado: software que funciona", delay: 900 },
];

const floatingChars = ["</>", "{}", "=>", "()", "&&", "[]", "//", "**"];

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

  const getHighlightedText = (text: string) => {
    // Comentários
    if (text.trim().startsWith("//")) {
      return `<span class="${styles.comment}">${text}</span>`;
    }

    let result = text;

    // Strings entre aspas
    result = result.replace(
      /"([^"]*)"/g,
      `<span class="${styles.string}">"$1"</span>`,
    );

    // Keywords
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
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "g");
      result = result.replace(
        regex,
        `<span class="${styles.keyword}">${kw}</span>`,
      );
    });

    // Valores especiais
    const values = [
      "true",
      "false",
      "null",
      "undefined",
      "definido",
      "garantida",
    ];
    values.forEach((val) => {
      const regex = new RegExp(`\\b${val}\\b`, "g");
      result = result.replace(
        regex,
        `<span class="${styles.value}">${val}</span>`,
      );
    });

    // Nomes de funções/métodos (antes de parênteses)
    result = result.replace(
      /(\w+)(\()/g,
      `<span class="${styles.function}">$1</span>$2`,
    );

    // Propriedades (antes de dois pontos)
    result = result.replace(
      /(\w+):/g,
      `<span class="${styles.property}">$1</span>:`,
    );

    // Brackets e pontuação
    result = result.replace(
      /([{}[\]();,.])/g,
      `<span class="${styles.punctuation}">$1</span>`,
    );

    return result;
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
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <pre className={styles.code}>
          {displayedLines.map((line, i) => (
            <div key={i} className={styles.codeLine}>
              <span
                dangerouslySetInnerHTML={{
                  __html: getHighlightedText(line),
                }}
              />
              {i === currentLine && currentLine < codeLines.length && (
                <span
                  className={`${styles.cursor} ${showCursor ? styles.cursorVisible : ""}`}
                >
                  |
                </span>
              )}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className={styles.particles}>
      {floatingChars.map((char, i) => {
        const sectionWidth = 100 / floatingChars.length;
        const baseLeft = sectionWidth * i + sectionWidth * 0.2;
        const randomOffset = sectionWidth * 0.6 * Math.random();

        return (
          <motion.span
            key={i}
            className={styles.particle}
            initial={{
              y: "105%",
              opacity: 0,
            }}
            animate={{
              y: ["105%", "35%"],
              opacity: [0, 0.5, 0.5, 0],
              rotate: [0, Math.random() > 0.5 ? 180 : -180],
            }}
            transition={{
              duration: 14 + Math.random() * 6,
              repeat: Infinity,
              delay: i * 1.5 + Math.random() * 2,
              ease: "linear",
            }}
            style={{
              left: `${baseLeft + randomOffset}%`,
              fontSize: "1rem",
            }}
          >
            {char}
          </motion.span>
        );
      })}
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
  }, [statusMessages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
      className={styles.statusBar}
    >
      <div className={styles.statusContent}>
        <span className={styles.statusBranch}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
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
        transition={{ duration: 2, repeat: Infinity }}
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
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const gridRotateX = useTransform(smoothMouseY, [-500, 500], [5, -5]);
  const gridRotateY = useTransform(smoothMouseX, [-500, 500], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set(clientX - innerWidth / 2);
      mouseY.set(clientY - innerHeight / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section ref={containerRef} className={styles.section}>
      {/* Interactive 3D Grid Background */}
      <div className={styles.background}>
        <div className={styles.backgroundBase} />

        <motion.div
          className={styles.grid3d}
          style={{
            rotateX: gridRotateX,
            rotateY: gridRotateY,
          }}
        />

        <FloatingParticles />

        {/* Gradient orbs */}
        <motion.div
          className={styles.orbPrimary}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={styles.orbSecondary}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 20, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
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
