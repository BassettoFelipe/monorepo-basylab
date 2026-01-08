"use client";

import { useEffect } from "react";
import Image from "next/image";
import CircularText from "@/components/CircularText";
import { GlowButton } from "@/components/GlowButton/GlowButton";
import styles from "./not-found.module.css";

function HomeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 6L8 1.33333L14 6V13.3333C14 13.687 13.8595 14.0261 13.6095 14.2761C13.3594 14.5262 13.0203 14.6667 12.6667 14.6667H3.33333C2.97971 14.6667 2.64057 14.5262 2.39052 14.2761C2.14048 14.0261 2 13.687 2 13.3333V6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14.6667V8H10V14.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotFound() {
  useEffect(() => {
    document.body.classList.add("hide-layout");
    return () => document.body.classList.remove("hide-layout");
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.glow} />

      <div className={styles.center}>
        <div className={styles.circularWrapper}>
          <CircularText
            text="• PÁGINA NÃO ENCONTRADA • ERRO 404 "
            spinDuration={12}
            onHover="slowDown"
          />
          <div className={styles.logoBox}>
            <Image
              src="/images/logo-light.svg"
              alt="Basylab"
              width={100}
              height={100}
              priority
            />
          </div>
        </div>

        <div className={styles.text}>
          <h1 className={styles.title}>Ops, você se perdeu</h1>
          <p className={styles.desc}>
            O endereço que você procura não existe ou foi movido.
          </p>
        </div>

        <GlowButton href="/" variant="primary" icon={<HomeIcon />}>
          Voltar ao início
        </GlowButton>
      </div>
    </main>
  );
}
