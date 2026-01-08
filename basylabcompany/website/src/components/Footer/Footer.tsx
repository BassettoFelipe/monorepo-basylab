"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import styles from "./Footer.module.css";

// ============================================
// DATA
// ============================================

const quickLinks = [
  { label: "Sobre nós", href: "#sobre", command: "about" },
  { label: "Serviços", href: "#servicos", command: "services" },
  { label: "Processo", href: "#processo", command: "process" },
  { label: "Tecnologia", href: "#tecnologia", command: "tech" },
  { label: "Cases", href: "#cases", command: "cases" },
  { label: "Contato", href: "#contato", command: "contact" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/basylab",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/basylab",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/5514996223121",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
];

// ============================================
// COMPONENTS
// ============================================

function TerminalPrompt() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.terminalPrompt}>
      <span className={styles.promptUser}>visitante</span>
      <span className={styles.promptAt}>@</span>
      <span className={styles.promptHost}>basylab</span>
      <span className={styles.promptColon}>:</span>
      <span className={styles.promptPath}>~</span>
      <span className={styles.promptSymbol}>$</span>
      <span className={styles.promptTime}>{currentTime}</span>
    </div>
  );
}

function NavigationBlock() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={styles.navBlock}>
      <div className={styles.navHeader}>
        <span className={styles.navHeaderIcon}>{">"}</span>
        <span>Navegação rápida</span>
      </div>
      <nav className={styles.navGrid}>
        {quickLinks.map((link, index) => (
          <motion.a
            key={link.command}
            href={link.href}
            className={styles.navLink}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <span className={styles.navLinkPrefix}>
              {hoveredIndex === index ? "→" : "$"}
            </span>
            <span className={styles.navLinkCommand}>{link.command}</span>
            <span className={styles.navLinkLabel}>{link.label}</span>
          </motion.a>
        ))}
      </nav>
    </div>
  );
}

function ContactBlock() {
  return (
    <div className={styles.contactBlock}>
      <div className={styles.contactHeader}>
        <span className={styles.contactHeaderIcon}>@</span>
        <span>Fale conosco</span>
      </div>
      <div className={styles.contactContent}>
        <a href="mailto:contato@basylab.com.br" className={styles.contactEmail}>
          <span className={styles.contactEmailIcon}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <span className={styles.contactEmailText}>
            contato@basylab.com.br
          </span>
        </a>

        <a href="https://wa.me/5514996223121" className={styles.contactPhone}>
          <span className={styles.contactPhoneIcon}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </span>
          <span className={styles.contactPhoneText}>(14) 99622-3121</span>
        </a>
      </div>
    </div>
  );
}

function SocialBlock() {
  return (
    <div className={styles.socialBlock}>
      <div className={styles.socialHeader}>
        <span className={styles.socialHeaderIcon}>#</span>
        <span>Redes sociais</span>
      </div>
      <div className={styles.socialGrid}>
        {socialLinks.map((social) => (
          <motion.a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title={social.label}
          >
            <span className={styles.socialIcon}>{social.icon}</span>
            <span className={styles.socialLabel}>{social.label}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

function StatusIndicator() {
  const [status, setStatus] = useState<"online" | "away">("online");

  useEffect(() => {
    const hour = new Date().getHours();
    setStatus(hour >= 9 && hour < 18 ? "online" : "away");
  }, []);

  return (
    <div className={styles.statusIndicator}>
      <motion.span
        className={`${styles.statusDot} ${status === "online" ? styles.statusOnline : styles.statusAway}`}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className={styles.statusText}>
        {status === "online"
          ? "Disponível para novos projetos"
          : "Responderemos em breve"}
      </span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-50px" });

  const currentYear = new Date().getFullYear();

  return (
    <footer ref={footerRef} className={styles.footer}>
      {/* Background effects */}
      <div className={styles.background}>
        <div className={styles.gradientTop} />
        <div className={styles.gridPattern} />
        <div className={styles.noise} />
      </div>

      <div className={styles.container}>
        {/* Terminal header */}
        <motion.div
          className={styles.terminalHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.terminalDots}>
            <span className={styles.dotRed} />
            <span className={styles.dotYellow} />
            <span className={styles.dotGreen} />
          </div>
          <span className={styles.terminalTitle}>footer.sh</span>
          <TerminalPrompt />
        </motion.div>

        {/* Main content */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Brand column */}
          <div className={styles.brandColumn}>
            <div className={styles.logoWrapper}>
              <Image
                src="/images/logo-light.svg"
                alt="Basylab"
                width={180}
                height={60}
                className={styles.logo}
              />
            </div>
            <p className={styles.tagline}>
              Transformando ideias em software que funciona.
            </p>
            <StatusIndicator />
          </div>

          {/* Navigation column */}
          <NavigationBlock />

          {/* Contact column */}
          <ContactBlock />

          {/* Social column */}
          <SocialBlock />
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className={styles.bottomBar}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className={styles.copyright}>
            <span className={styles.copyrightSymbol}>©</span>
            <span>{currentYear}</span>
            <span className={styles.copyrightDivider}>|</span>
            <span>Basylab</span>
            <span className={styles.copyrightDivider}>|</span>
            <span className={styles.copyrightText}>
              CNPJ 00.000.000/0001-00
            </span>
          </div>

          <div className={styles.bottomLinks}>
            <a href="/privacidade" className={styles.bottomLink}>
              Privacidade
            </a>
            <span className={styles.bottomDivider}>•</span>
            <a href="/termos" className={styles.bottomLink}>
              Termos
            </a>
          </div>
        </motion.div>

        {/* ASCII art signature */}
        <motion.div
          className={styles.signature}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <pre className={styles.ascii}>
            {`     _                 _       _
    | |__   __ _ ___ _| |_   _| |__
    | '_ \\ / _\` / __| | | | | | '_ \\
    | |_) | (_| \\__ \\ | | |_| | |_) |
    |_.__/ \\__,_|___/_|_|\\__, |_.__/
                         |___/       `}
          </pre>
        </motion.div>
      </div>
    </footer>
  );
}
