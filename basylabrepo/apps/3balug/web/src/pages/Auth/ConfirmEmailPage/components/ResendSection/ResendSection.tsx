import { useSyncExternalStore } from "react";
import { Button } from "@/components/Button/Button";
import * as styles from "./ResendSection.css";

interface ResendSectionProps {
  isBlocked: boolean;
  blockedUntil: string | null;
  canResendAt: string | null;
  remainingAttempts: number;
  isResending: boolean;
  onResend: () => void;
}

function subscribeToTime(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function getServerTime() {
  return Date.now();
}

function useRemainingSeconds(targetTime: string | null): number {
  const now = useSyncExternalStore(subscribeToTime, getServerTime, getServerTime);

  if (!targetTime) return 0;

  const target = new Date(targetTime).getTime();
  const remaining = Math.max(0, Math.ceil((target - now) / 1000));

  return remaining;
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
}

function formatBlockedTime(blockedUntil: string): string {
  const date = new Date(blockedUntil);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return "alguns instantes";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`;
  }
  return `${minutes} minuto${minutes !== 1 ? "s" : ""}`;
}

export function ResendSection({
  isBlocked,
  blockedUntil,
  canResendAt,
  remainingAttempts,
  isResending,
  onResend,
}: ResendSectionProps) {
  const countdown = useRemainingSeconds(canResendAt);
  const canResend = countdown === 0 && !isResending;

  if (isBlocked && blockedUntil) {
    const timeRemaining = formatBlockedTime(blockedUntil);
    return (
      <output className={styles.blockedContainer} aria-live="polite" aria-atomic="true">
        <p className={styles.blockedTitle}>Não recebeu o código?</p>
        <p className={styles.blockedText}>
          Limite de reenvios atingido. Tente novamente em{" "}
          <time dateTime={blockedUntil}>{timeRemaining}</time> ou entre em contato com o suporte.
        </p>
      </output>
    );
  }

  return (
    <>
      <p className={styles.footerText}>Não recebeu o código?</p>
      <Button
        type="button"
        variant="outline"
        onClick={onResend}
        disabled={!canResend || isResending}
        loading={isResending}
        fullWidth
        aria-label={
          isResending
            ? "Reenviando código de verificação"
            : countdown > 0
              ? `Aguarde ${formatCountdown(countdown)} para reenviar o código`
              : "Reenviar código de verificação"
        }
      >
        {isResending
          ? "Reenviando..."
          : countdown > 0
            ? `Aguarde ${formatCountdown(countdown)}`
            : "Reenviar código"}
      </Button>
      {remainingAttempts < 5 && remainingAttempts > 0 && (
        <output className={styles.remainingAttemptsText} aria-live="polite" aria-atomic="true">
          {remainingAttempts} reenvio(s) restante(s)
        </output>
      )}
    </>
  );
}
