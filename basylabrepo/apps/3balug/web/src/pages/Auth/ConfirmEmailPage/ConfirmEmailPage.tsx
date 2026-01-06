import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/Button/Button";
import { useResendStatus } from "@/queries/auth/useResendStatus";
import { confirmEmail } from "@/services/auth/verification/confirm-email";
import { resendVerificationCode } from "@/services/auth/verification/resend-code";
import type { ApiError } from "@/types/api.types";
import * as styles from "./ConfirmEmailPage.css";
import { CodeInputGroup } from "./components/CodeInputGroup/CodeInputGroup";
import { ConfirmEmailSkeleton } from "./components/ConfirmEmailSkeleton/ConfirmEmailSkeleton";
import { ErrorMessage } from "./components/ErrorMessage/ErrorMessage";
import { PageHeader } from "./components/PageHeader/PageHeader";
import { ResendSection } from "./components/ResendSection/ResendSection";

const CODE_LENGTH = 6;
const RESEND_SUCCESS_TOAST_DURATION = 4000;
const ERROR_TOAST_DURATION = 8000;

const confirmEmailSchema = z.object({
  code: z
    .string()
    .length(CODE_LENGTH, `Código deve ter ${CODE_LENGTH} dígitos`)
    .regex(/^\d+$/, "Código deve conter apenas números"),
});

type ConfirmEmailFormData = z.infer<typeof confirmEmailSchema>;

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ConfirmEmailFormData>({
    resolver: zodResolver(confirmEmailSchema),
    defaultValues: {
      code: "",
    },
  });

  const codeValue = watch("code");
  const codeDigits = Array.from({ length: CODE_LENGTH }, (_, index) => codeValue[index] || "");

  const {
    data: resendStatusData,
    refetch: refetchResendStatus,
    error: resendStatusError,
    isLoading: isLoadingResendStatus,
  } = useResendStatus(email);

  const confirmEmailMutation = useMutation({
    mutationFn: (data: { email: string; code: string }) => confirmEmail(data),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerificationCode({ email }),
  });

  const remainingAttempts = resendStatusData?.remainingAttempts ?? 5;
  const isBlocked = resendStatusData?.isBlocked ?? false;
  const blockedUntil = resendStatusData?.blockedUntil ?? null;
  const canResendAt = resendStatusData?.canResendAt ?? null;

  const onSubmit = async (data: ConfirmEmailFormData) => {
    try {
      const response = await confirmEmailMutation.mutateAsync({
        email,
        code: data.code,
      });

      toast.success("Email verificado com sucesso!");

      if (response.checkoutToken) {
        navigate(`/registration-checkout?token=${encodeURIComponent(response.checkoutToken)}`);
      } else {
        toast.error("Erro ao processar verificação. Tente novamente.");
        navigate("/register");
      }
    } catch (error) {
      const err = error as ApiError;

      if (err.type === "USER_NOT_FOUND") {
        toast.error("Usuário não encontrado. Por favor, faça o cadastro novamente.", {
          autoClose: 5000,
        });
        navigate("/register", { replace: true });
        return;
      }

      if (err.type === "ACCOUNT_ALREADY_VERIFIED") {
        toast.info("Esta conta já foi verificada. Faça login para continuar.", {
          autoClose: 5000,
        });
        navigate("/login", { replace: true });
        return;
      }

      if (err.type === "VERIFICATION_CODE_EXPIRED") {
        toast.info("Código expirado. Reenviando um novo código...", {
          autoClose: 3000,
        });
        reset();
        await handleResend();
        return;
      }

      if (
        err.type === "VERIFICATION_BLOCKED" ||
        err.type === "INVALID_CODE" ||
        err.type === "TOO_MANY_REQUESTS"
      ) {
        toast.error(err.message, {
          autoClose:
            err.type === "VERIFICATION_BLOCKED" || err.type === "TOO_MANY_REQUESTS"
              ? ERROR_TOAST_DURATION
              : undefined,
        });

        reset();

        if (err.type === "VERIFICATION_BLOCKED") {
          refetchResendStatus();
        }
        return;
      }

      toast.error(err.message || "Erro ao verificar código. Tente novamente.");
      reset();
    }
  };

  const handleResend = async () => {
    try {
      const response = await resendMutation.mutateAsync();

      queryClient.setQueryData(["resendStatus", email], {
        remainingAttempts: response.remainingAttempts,
        canResendAt: response.canResendAt,
        canResend: false,
        isBlocked: response.isBlocked,
        blockedUntil: response.blockedUntil,
      });

      const successMessage =
        response.remainingAttempts > 0
          ? `Código reenviado com sucesso! Você ainda pode solicitar ${response.remainingAttempts} reenvio(s).`
          : "Código reenviado com sucesso! Limite de reenvios atingido.";

      toast.success(successMessage, {
        autoClose: RESEND_SUCCESS_TOAST_DURATION,
      });
      reset();
    } catch (error) {
      const err = error as ApiError;

      const errorConfig: Record<
        string,
        { duration?: number; shouldRefetch: boolean; isWarning?: boolean }
      > = {
        VERIFICATION_BLOCKED: {
          duration: ERROR_TOAST_DURATION,
          shouldRefetch: true,
        },
        EMAIL_SEND_FAILED: {
          duration: ERROR_TOAST_DURATION,
          shouldRefetch: false,
        },
        RESEND_COOLDOWN_ACTIVE: {
          duration: undefined,
          shouldRefetch: true,
          isWarning: true,
        },
        TOO_MANY_RESEND_ATTEMPTS: {
          duration: ERROR_TOAST_DURATION,
          shouldRefetch: true,
        },
        TOO_MANY_REQUESTS: { duration: 5000, shouldRefetch: true },
      };

      const config = errorConfig[err.type as keyof typeof errorConfig];

      if (config) {
        const toastFn = config.isWarning ? toast.warning : toast.error;
        toastFn(err.message, { autoClose: config.duration });

        if (config.shouldRefetch) {
          await refetchResendStatus();
        }
        return;
      }

      toast.error(err.message || "Erro ao reenviar código. Tente novamente.");
    }
  };

  const handleCodeChange = (newCodeDigits: string[]) => {
    const newCode = newCodeDigits.join("");
    setValue("code", newCode, {
      shouldValidate: newCode.length === CODE_LENGTH,
    });
  };

  if (!email) {
    toast.error("Email não encontrado. Por favor, faça o cadastro novamente.", {
      autoClose: 5000,
    });
    navigate("/register", { replace: true });
    return null;
  }

  if (resendStatusError) {
    const err = resendStatusError as unknown as ApiError;

    if (err.type === "USER_NOT_FOUND") {
      toast.error("Email não encontrado. Por favor, faça o cadastro novamente.", {
        autoClose: 5000,
      });
      navigate("/login", { replace: true });
      return null;
    }

    if (err.type === "ACCOUNT_ALREADY_VERIFIED") {
      toast.info("Esta conta já foi verificada. Faça login para continuar.", {
        autoClose: 5000,
      });
      navigate("/login", { replace: true });
      return null;
    }

    if (err.type === "VALIDATION_ERROR") {
      toast.error("Email inválido. Por favor, verifique o link de confirmação.", {
        autoClose: 5000,
      });
      navigate("/login", { replace: true });
      return null;
    }
  }

  if (isLoadingResendStatus) {
    return <ConfirmEmailSkeleton />;
  }

  return (
    <main className={styles.confirmEmailPage}>
      <div className={styles.backgroundDecor} aria-hidden="true" />
      <div className={styles.backgroundDecor2} aria-hidden="true" />

      <section className={styles.confirmEmailContainer} aria-labelledby="confirm-email-title">
        <PageHeader email={email} />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles.confirmEmailForm}
          aria-label="Formulário de confirmação de email"
          noValidate
        >
          {errors.code?.message && <ErrorMessage message={errors.code.message} />}

          <CodeInputGroup
            value={codeDigits}
            disabled={confirmEmailMutation.isPending}
            onChange={handleCodeChange}
            length={CODE_LENGTH}
            autoFocus
          />

          <Button
            type="submit"
            loading={confirmEmailMutation.isPending}
            disabled={codeValue.length !== CODE_LENGTH}
            fullWidth
            className={styles.submitButton}
            aria-label={
              confirmEmailMutation.isPending ? "Verificando código de email" : "Verificar email"
            }
          >
            {confirmEmailMutation.isPending ? "Verificando..." : "Verificar Email"}
          </Button>

          <footer className={styles.confirmEmailFooter}>
            <ResendSection
              isBlocked={isBlocked}
              blockedUntil={blockedUntil}
              canResendAt={canResendAt}
              remainingAttempts={remainingAttempts}
              isResending={resendMutation.isPending}
              onResend={handleResend}
            />
          </footer>
        </form>
      </section>
    </main>
  );
}
