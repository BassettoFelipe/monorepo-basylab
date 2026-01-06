import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Lock, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { Logo } from "@/components/Logo/Logo";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { confirmPasswordReset } from "@/services/auth/password-reset/confirm-password-reset";
import {
  getPasswordResetStatus,
  type PasswordResetStatus,
} from "@/services/auth/password-reset/get-password-reset-status";
import { resendPasswordResetCode } from "@/services/auth/password-reset/resend-password-reset-code";
import type { ApiError } from "@/types/api.types";
import { BrandSection } from "../LoginPage/components/BrandSection/BrandSection";
import { ErrorBox } from "../LoginPage/components/ErrorBox/ErrorBox";
import * as loginStyles from "../LoginPage/LoginPage.css";
import { ResendSection } from "./components/ResendSection";
import * as styles from "./ResetPasswordPage.css";

const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .min(6, "Código deve ter 6 dígitos")
      .max(6, "Código deve ter 6 dígitos")
      .regex(/^\d{6}$/, "Código deve conter apenas números"),
    newPassword: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .max(128, "Senha muito longa")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Senha deve conter pelo menos um caractere especial"),
    confirmPassword: z.string().min(1, "Confirme sua nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get("email");

  const isValidEmail = emailParam && z.string().email().safeParse(emailParam).success;
  const email = isValidEmail ? emailParam : "";

  const [isLoading, setIsLoading] = useState(true);
  const [resetStatus, setResetStatus] = useState<PasswordResetStatus | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Validate email format with useEffect
  useEffect(() => {
    if (!emailParam || !isValidEmail) {
      toast.error("Email inválido. Por favor, informe um email válido.");
      navigate("/forgot-password", { replace: true });
    }
  }, [emailParam, isValidEmail, navigate]);

  // Fetch initial status (this will send first email if needed)
  useEffect(() => {
    if (!email) return;

    const fetchStatus = async () => {
      try {
        const status = await getPasswordResetStatus(email);
        setResetStatus(status);
        // Calculate seconds from timestamp
        if (status.canResendAt) {
          const secondsUntilCanResend = Math.max(
            0,
            Math.ceil((new Date(status.canResendAt).getTime() - Date.now()) / 1000),
          );
          setResendCooldown(secondsUntilCanResend);
        } else {
          setResendCooldown(0);
        }
      } catch (error) {
        const err = error as ApiError;
        const errorType = err?.type || err?.code;

        if (errorType === "USER_NOT_FOUND") {
          toast.error("Usuário não encontrado.");
        } else if (errorType === "EMAIL_NOT_VERIFIED") {
          toast.warning("Email não verificado. Redirecionando...");
          navigate(`/confirm-email?email=${encodeURIComponent(email)}`, {
            replace: true,
          });
          return;
        } else {
          toast.error(err?.message || "Erro ao carregar status.");
        }
        navigate("/forgot-password", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [email, navigate]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: (data: { code: string; newPassword: string }) =>
      confirmPasswordReset(email, data.code, data.newPassword),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendPasswordResetCode(email),
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (!email) return;

    try {
      await resetMutation.mutateAsync({
        code: data.code,
        newPassword: data.newPassword,
      });
      toast.success("Senha redefinida com sucesso! Faça login com sua nova senha.");
      navigate("/login", { replace: true });
    } catch (error) {
      const err = error as ApiError;
      const errorType = err?.type || err?.code;

      if (errorType === "INVALID_RESET_CODE") {
        toast.error(err?.message || "Código de recuperação inválido.");
        form.setValue("code", "");
        setResetStatus((prev) => {
          if (!prev) return null;
          const newAttempts = Math.max(0, prev.remainingCodeAttempts - 1);
          return { ...prev, remainingCodeAttempts: newAttempts };
        });
        return;
      }

      if (errorType === "RESET_CODE_EXPIRED" || errorType === "PASSWORD_RESET_CODE_EXPIRED") {
        toast.error("Código expirado. Solicite um novo código.");
        form.setValue("code", "");
        return;
      }

      if (errorType === "TOO_MANY_ATTEMPTS" || errorType === "TOO_MANY_REQUESTS") {
        toast.error(err?.message || "Muitas tentativas. Aguarde um momento.");
        form.setValue("code", "");
        return;
      }

      toast.error(err?.message || "Erro ao redefinir senha.");
      form.setValue("code", "");
    }
  });

  const handleResend = async () => {
    if (!email) return;

    try {
      const result = await resendMutation.mutateAsync();
      setResetStatus((prev) =>
        prev
          ? {
              ...prev,
              remainingResendAttempts: result.remainingResendAttempts,
              canResend: false,
              codeExpiresAt: result.codeExpiresAt,
              canResendAt: result.canResendAt,
            }
          : null,
      );
      // Calculate seconds from timestamp
      const secondsUntilCanResend = Math.max(
        0,
        Math.ceil((new Date(result.canResendAt).getTime() - Date.now()) / 1000),
      );
      setResendCooldown(secondsUntilCanResend);
      toast.success("Novo código enviado para seu email!");
      form.setValue("code", "");
    } catch (error) {
      const err = error as ApiError;
      const errorType = err?.type || err?.code;

      if (errorType === "TOO_MANY_ATTEMPTS") {
        toast.error(err?.message || "Muitas tentativas de reenvio. Aguarde alguns minutos.");
        setResetStatus((prev) =>
          prev ? { ...prev, remainingResendAttempts: 0, isResendBlocked: true } : null,
        );
        return;
      }

      toast.error(err?.message || "Erro ao reenviar código.");
    }
  };

  const brandFeatures = [
    {
      icon: <Shield size={32} aria-hidden="true" />,
      label: "Senha forte e segura",
    },
    {
      icon: <Lock size={32} aria-hidden="true" />,
      label: "Proteção avançada dos seus dados",
    },
    {
      icon: <Check size={32} aria-hidden="true" />,
      label: "Acesso imediato após redefinição",
    },
  ];

  // Loading state
  if (isLoading || !email) {
    return (
      <div className={loginStyles.page}>
        <div className={loginStyles.container}>
          <div className={loginStyles.formSection}>
            <div className={loginStyles.header}>
              <Logo variant="primary" size="medium" />
              <Skeleton height="2rem" width="70%" />
              <Skeleton height="1.25rem" width="90%" />
            </div>

            <div className={loginStyles.form}>
              <div>
                <Skeleton height="0.875rem" width="10rem" />
                <Skeleton height="2.75rem" width="100%" />
              </div>
              <div>
                <Skeleton height="0.875rem" width="6rem" />
                <Skeleton height="2.75rem" width="100%" />
              </div>
              <div>
                <Skeleton height="0.875rem" width="11rem" />
                <Skeleton height="2.75rem" width="100%" />
              </div>
              <Skeleton height="2.75rem" width="100%" />
            </div>
          </div>

          <BrandSection
            title="Segurança em Primeiro Lugar"
            subtitle="Sua nova senha será protegida com os mais altos padrões de segurança."
            features={brandFeatures}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={loginStyles.page}>
      <div className={loginStyles.container}>
        <div className={loginStyles.formSection}>
          <div className={loginStyles.header}>
            <Logo variant="primary" size="medium" />
            <h1 className={loginStyles.title}>Redefinir senha</h1>
            <p className={loginStyles.subtitle}>
              Digite o código enviado para {email} e sua nova senha.
            </p>
          </div>

          <form onSubmit={onSubmit} className={loginStyles.form} noValidate>
            {resetMutation.isError && (
              <ErrorBox
                message={
                  resetMutation.error?.message || "Erro ao redefinir senha. Tente novamente."
                }
              />
            )}

            <Input
              {...form.register("code")}
              type="text"
              label="Código de verificação"
              placeholder="000000"
              error={form.formState.errors.code?.message}
              fullWidth
              autoComplete="off"
              maxLength={6}
              autoFocus
              inputMode="numeric"
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter, arrows
                if (
                  [
                    "Backspace",
                    "Delete",
                    "Tab",
                    "Escape",
                    "Enter",
                    "ArrowLeft",
                    "ArrowRight",
                    "ArrowUp",
                    "ArrowDown",
                  ].includes(e.key)
                ) {
                  return;
                }
                // Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
                if (
                  (e.ctrlKey || e.metaKey) &&
                  ["a", "c", "v", "x"].includes(e.key.toLowerCase())
                ) {
                  return;
                }
                // Block if not a number
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const paste = e.clipboardData.getData("text");
                // Only allow paste if all characters are numbers
                if (!/^\d+$/.test(paste)) {
                  e.preventDefault();
                }
              }}
            />

            <Input
              {...form.register("newPassword")}
              type="password"
              label="Nova senha"
              placeholder="Digite sua nova senha"
              error={form.formState.errors.newPassword?.message}
              fullWidth
              autoComplete="new-password"
            />

            <Input
              {...form.register("confirmPassword")}
              type="password"
              label="Confirmar nova senha"
              placeholder="Digite sua nova senha novamente"
              error={form.formState.errors.confirmPassword?.message}
              fullWidth
              autoComplete="new-password"
            />

            <Button type="submit" loading={resetMutation.isPending} fullWidth>
              {resetMutation.isPending ? "Redefinindo..." : "Redefinir senha"}
            </Button>

            <ResendSection
              remainingAttempts={resetStatus?.remainingResendAttempts ?? 5}
              cooldownSeconds={resendCooldown}
              onResend={handleResend}
              isResending={resendMutation.isPending}
              isBlocked={resetStatus?.isResendBlocked ?? false}
            />
          </form>

          <div className={styles.formFooterNoBorder}>
            <p className={styles.footerLink}>
              <Link to="/forgot-password" className={styles.link}>
                ← Voltar para solicitar código
              </Link>
            </p>
          </div>
        </div>

        <BrandSection
          title="Segurança em Primeiro Lugar"
          subtitle="Sua nova senha será protegida com os mais altos padrões de segurança."
          features={brandFeatures}
        />
      </div>
    </div>
  );
}
