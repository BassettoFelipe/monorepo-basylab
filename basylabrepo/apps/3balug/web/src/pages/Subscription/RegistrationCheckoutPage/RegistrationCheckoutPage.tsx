import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { useCheckoutInfo } from "@/queries/subscription/useCheckoutInfo";
import { tokenizeCard } from "@/services/payment/tokenize-card";
import { activateSubscription } from "@/services/subscription/activate-subscription";
import type { ApiError } from "@/types/api.types";
import { CheckoutHeader } from "./components/CheckoutHeader/CheckoutHeader";
import { CreditCardPreview } from "./components/CreditCardPreview/CreditCardPreview";
import { ErrorAlert } from "./components/ErrorAlert/ErrorAlert";
import { LoadingSkeleton } from "./components/LoadingSkeleton/LoadingSkeleton";
import { OrderSummary } from "./components/OrderSummary/OrderSummary";
import * as styles from "./RegistrationCheckoutPage.css";

const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Número do cartão é obrigatório")
    .regex(/^\d{16}$/, "Número de cartão inválido (16 dígitos)"),
  cardholderName: z
    .string()
    .min(1, "Nome do titular é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres"),
  cardExpiration: z
    .string()
    .min(1, "Validade é obrigatória")
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Validade inválida (MM/AA)")
    .refine(
      (value) => {
        const [month, year] = value.split("/");
        if (!month || !year) return false;

        const expMonth = Number.parseInt(month, 10);
        const expYear = Number.parseInt(`20${year}`, 10);

        const currentYear = new Date().getFullYear();
        if (expYear < currentYear || expYear > currentYear + 20) {
          return false;
        }

        if (expYear === currentYear) {
          const currentMonth = new Date().getMonth() + 1;
          if (expMonth < currentMonth) {
            return false;
          }
        }

        return true;
      },
      { message: "Cartão expirado ou data inválida" },
    ),
  securityCode: z
    .string()
    .min(1, "CVV é obrigatório")
    .regex(/^\d{3,4}$/, "CVV inválido"),
  identificationNumber: z
    .string()
    .min(1, "CPF é obrigatório")
    .regex(/^\d{11}$/, "CPF inválido")
    .refine(
      (cpf) => {
        const digits = cpf.replace(/\D/g, "");
        if (/^(\d)\1+$/.test(digits)) return false;

        let sum = 0;
        let remainder: number;

        for (let i = 1; i <= 9; i++) {
          sum += Number.parseInt(digits.substring(i - 1, i), 10) * (11 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== Number.parseInt(digits.substring(9, 10), 10)) {
          return false;
        }

        sum = 0;
        for (let i = 1; i <= 10; i++) {
          sum += Number.parseInt(digits.substring(i - 1, i), 10) * (12 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== Number.parseInt(digits.substring(10, 11), 10)) {
          return false;
        }

        return true;
      },
      { message: "CPF inválido" },
    ),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function RegistrationCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const checkoutToken = searchParams.get("token");

  useEffect(() => {
    if (!checkoutToken) {
      toast.error("Sessão de checkout inválida. Por favor, faça login para continuar.", {
        autoClose: 5000,
      });
      navigate("/login", { replace: true });
    }
  }, [checkoutToken, navigate]);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    mode: "onBlur",
  });

  const cardNumber = watch("cardNumber", "");
  const cardholderName = watch("cardholderName", "");
  const cardExpiration = watch("cardExpiration", "");
  const securityCode = watch("securityCode", "");

  const { data: checkoutInfo, isLoading, error } = useCheckoutInfo(checkoutToken);

  useEffect(() => {
    if (error) {
      const apiErr = error as unknown as ApiError;
      toast.error(apiErr.message || "Erro ao carregar dados do checkout. Tente novamente.", {
        autoClose: 5000,
      });
      navigate("/login", { replace: true });
    }
  }, [error, navigate]);

  const tokenizeCardMutation = useMutation({
    mutationFn: tokenizeCard,
  });

  const activateSubscriptionMutation = useMutation({
    mutationFn: activateSubscription,
  });

  const onSubmit = async (data: PaymentFormData) => {
    if (!checkoutToken) {
      toast.error("Sessão inválida. Tente novamente.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const { cardToken } = await tokenizeCardMutation.mutateAsync({
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        cardExpiration: data.cardExpiration,
        securityCode: data.securityCode,
      });

      const result = await activateSubscriptionMutation.mutateAsync({
        checkoutToken,
        data: {
          cardToken,
          payerDocument: data.identificationNumber,
          installments: 1,
        },
      });

      if (result.success && result.status === "active") {
        toast.success("Pagamento aprovado! Assinatura ativada com sucesso!", {
          autoClose: 5000,
        });
        navigate("/registration-success", { replace: true });
      } else if (result.status === "processing") {
        toast.info("Pagamento em análise. Você receberá um email quando for aprovado.", {
          autoClose: 7000,
        });
        navigate("/registration-success", { replace: true });
      } else {
        toast.error("Pagamento não foi aprovado. Tente novamente.", {
          autoClose: 5000,
        });
      }
    } catch (err) {
      const error = err as ApiError;
      const errorMsg = error.message || "Falha ao processar pagamento";
      toast.error(errorMsg, { autoClose: 5000 });

      if (error.type === "CHECKOUT_EXPIRED" || error.type === "INVALID_TOKEN") {
        toast.error("Sessão de checkout expirada. Por favor, faça login para continuar.", {
          autoClose: 5000,
        });
        navigate("/login", { replace: true });
      }
    }
  };

  if (isLoading || !checkoutToken || !checkoutInfo) {
    return <LoadingSkeleton />;
  }

  const tokenizeError = tokenizeCardMutation.error as ApiError | null;
  const activateError = activateSubscriptionMutation.error as ApiError | null;
  const displayError = tokenizeError?.message || activateError?.message;

  return (
    <main className={styles.checkoutPage}>
      <h1 id="checkout-title" className="sr-only">
        Finalizar Assinatura - Página de Checkout
      </h1>
      <div className={styles.checkoutContainer}>
        <section className={styles.checkoutLeftColumn} aria-labelledby="checkout-title">
          <CheckoutHeader />

          <CreditCardPreview
            cardNumber={cardNumber}
            cardholderName={cardholderName}
            cardExpiration={cardExpiration}
            securityCode={securityCode}
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={styles.checkoutForm}
            noValidate
            aria-label="Formulário de pagamento com cartão de crédito"
          >
            {displayError && <ErrorAlert message={displayError} />}

            <Input
              type="text"
              label="Número do Cartão"
              placeholder="1234 5678 9012 3456"
              error={errors.cardNumber?.message}
              fullWidth
              inputMode="numeric"
              mask="cardNumber"
              onChange={(_e, rawValue) =>
                rawValue !== undefined &&
                setValue("cardNumber", rawValue, { shouldValidate: false })
              }
            />

            <Input
              type="text"
              label="Nome do Titular"
              placeholder="Como está no cartão"
              error={errors.cardholderName?.message}
              fullWidth
              uppercase
              onChange={(e) =>
                setValue("cardholderName", e.target.value.toUpperCase(), {
                  shouldValidate: false,
                })
              }
            />

            <fieldset
              className={styles.inputRow}
              aria-label="Data de validade e código de segurança do cartão"
            >
              <Input
                type="text"
                label="Validade"
                placeholder="MM/AA"
                error={errors.cardExpiration?.message}
                fullWidth
                inputMode="numeric"
                mask="cardExpiration"
                onChange={(_e, rawValue) => {
                  if (rawValue !== undefined) {
                    const formatted =
                      rawValue.length >= 2
                        ? `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`
                        : rawValue;
                    setValue("cardExpiration", formatted, {
                      shouldValidate: false,
                    });
                  }
                }}
              />
              <Input
                type="text"
                label="CVV"
                placeholder="123"
                error={errors.securityCode?.message}
                fullWidth
                inputMode="numeric"
                mask="cvv"
                onChange={(_e, rawValue) =>
                  rawValue !== undefined &&
                  setValue("securityCode", rawValue, { shouldValidate: false })
                }
              />
            </fieldset>

            <Input
              type="text"
              label="CPF do Titular"
              placeholder="000.000.000-00"
              error={errors.identificationNumber?.message}
              fullWidth
              inputMode="numeric"
              mask="cpf"
              onChange={(_e, rawValue) =>
                rawValue !== undefined &&
                setValue("identificationNumber", rawValue, {
                  shouldValidate: false,
                })
              }
            />

            <Button type="submit" loading={isSubmitting} fullWidth className={styles.submitButton}>
              {isSubmitting ? "Processando..." : "Finalizar Pagamento"}
            </Button>
          </form>
        </section>

        <OrderSummary checkoutInfo={checkoutInfo} />
      </div>
    </main>
  );
}
