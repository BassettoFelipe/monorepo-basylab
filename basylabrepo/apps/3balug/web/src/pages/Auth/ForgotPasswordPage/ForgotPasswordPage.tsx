import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Clock, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { Logo } from "@/components/Logo/Logo";
import { validateEmailForReset } from "@/services/auth/password-reset/validate-email-for-reset";
import type { ApiError } from "@/types/api.types";
import { BrandSection } from "../LoginPage/components/BrandSection/BrandSection";
import * as styles from "../LoginPage/LoginPage.css";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .toLowerCase()
    .pipe(z.email("Digite um email válido")),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await validateEmailForReset(email);
      return { email: result.email };
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const result = await mutation.mutateAsync(data.email);
      navigate(`/reset-password?email=${encodeURIComponent(result.email)}`);
    } catch (error) {
      const err = error as ApiError;
      const errorType = err?.type || err?.code;

      if (errorType === "EMAIL_NOT_VERIFIED") {
        toast.warning("Sua conta precisa ser verificada primeiro. Redirecionando...");
        navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      if (errorType === "USER_NOT_FOUND") {
        toast.error("Email não encontrado. Verifique e tente novamente.");
        return;
      }

      toast.error(err?.message || "Erro ao validar email");
    }
  };

  const brandFeatures = [
    {
      icon: <CheckCircle2 size={32} aria-hidden="true" />,
      label: "Processo rápido e simples",
    },
    {
      icon: <Shield size={32} aria-hidden="true" />,
      label: "Senha criptografada",
    },
    {
      icon: <Clock size={32} aria-hidden="true" />,
      label: "Código válido por 5 minutos",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.formSection}>
          <div className={styles.header}>
            <Logo variant="primary" size="medium" />
            <h1 className={styles.title}>Esqueceu sua senha?</h1>
            <p className={styles.subtitle}>
              Não se preocupe! Digite seu email e enviaremos um código de recuperação.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            <Input
              {...register("email")}
              type="email"
              label="Email"
              placeholder="nome@empresa.com"
              error={errors.email?.message}
              fullWidth
              autoComplete="email"
              autoFocus
              disabled={mutation.isPending}
            />

            <Button type="submit" loading={mutation.isPending} fullWidth>
              {mutation.isPending ? "Enviando..." : "Enviar código"}
            </Button>
          </form>

          <p className={styles.footer}>
            Lembrou sua senha?{" "}
            <Link to="/login" className={styles.link}>
              Voltar para login
            </Link>
          </p>
        </div>

        <BrandSection
          title="Recuperação de Senha Segura"
          subtitle="Enviamos um código de verificação para o seu email. Use-o para criar uma nova senha de forma rápida e segura."
          features={brandFeatures}
        />
      </div>
    </div>
  );
}
