import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { useUser } from "@/queries/auth/useUser";
import { usePlansQuery } from "@/queries/plans/usePlansQuery";
import { queryKeys } from "@/queries/queryKeys";
import { logout as logoutService } from "@/services/auth/session/logout";
import { tokenizeCard } from "@/services/payment/tokenize-card";
import { activateSubscriptionWithAuth } from "@/services/subscription/activate-subscription";
import { changePlan } from "@/services/subscription/change-plan";
import type { ApiError } from "@/types/api.types";
import { CreditCardPreview } from "../RegistrationCheckoutPage/components/CreditCardPreview/CreditCardPreview";
import { ErrorAlert } from "../RegistrationCheckoutPage/components/ErrorAlert/ErrorAlert";
import { LoadingSkeleton } from "../RegistrationCheckoutPage/components/LoadingSkeleton/LoadingSkeleton";
import * as styles from "../RegistrationCheckoutPage/RegistrationCheckoutPage.css";
import { CheckoutHeaderWithLogout } from "./components/CheckoutHeaderWithLogout";
import { OrderSummaryWithChangePlan } from "./components/OrderSummaryWithChangePlan";
import { PlanChangeModal } from "./components/PlanChangeModal";

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

const PLAN_PARAM_KEY = "plan";

export function PendingPaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: plans = [], isLoading: isLoadingPlans } = usePlansQuery();

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const tokenizeCardMutation = useMutation({
    mutationFn: tokenizeCard,
  });

  const activateSubscriptionMutation = useMutation({
    mutationFn: activateSubscriptionWithAuth,
  });

  const changePlanMutation = useMutation({
    mutationFn: changePlan,
    onSuccess: async (_, variables) => {
      setSelectedPlanId(variables.planId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      setIsPlanModalOpen(false);
      toast.success("Plano alterado com sucesso!", { autoClose: 3000 });
      setSearchParams((prev) => {
        prev.delete(PLAN_PARAM_KEY);
        return prev;
      });
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Erro ao alterar plano", { autoClose: 5000 });
    },
  });

  const actualUserPlan = plans.find((p) => p.id === user?.subscription?.plan?.id) || plans[0];

  const userPlan =
    selectedPlanId && plans.find((p) => p.id === selectedPlanId)
      ? plans.find((p) => p.id === selectedPlanId)
      : actualUserPlan;

  const updateUrlWithPlan = useCallback(
    (planId: string) => {
      if (!actualUserPlan) return;
      setSearchParams((prev) => {
        if (planId && planId !== actualUserPlan.id) {
          prev.set(PLAN_PARAM_KEY, planId);
        } else {
          prev.delete(PLAN_PARAM_KEY);
        }
        return prev;
      });
    },
    [actualUserPlan, setSearchParams],
  );

  useEffect(() => {
    if (isInitialized || !userPlan || plans.length === 0) return;

    const planIdFromUrl = searchParams.get(PLAN_PARAM_KEY);
    const planFromUrl = planIdFromUrl ? plans.find((p) => p.id === planIdFromUrl) : null;

    if (planFromUrl && planFromUrl.id !== userPlan.id) {
      setSelectedPlanId(planFromUrl.id);
      setIsPlanModalOpen(true);
    }

    setIsInitialized(true);
  }, [isInitialized, userPlan, plans, searchParams]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const { cardToken } = await tokenizeCardMutation.mutateAsync({
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        cardExpiration: data.cardExpiration,
        securityCode: data.securityCode,
      });

      const result = await activateSubscriptionMutation.mutateAsync({
        cardToken,
        payerDocument: data.identificationNumber,
        installments: 1,
      });

      if (result.success && result.status === "active") {
        // Invalidar o cache do usuário para obter dados atualizados com o novo status
        await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });

        // Aguardar a atualização dos dados do usuário
        await queryClient.refetchQueries({ queryKey: queryKeys.auth.me });

        toast.success("Pagamento aprovado! Assinatura ativada com sucesso!", {
          autoClose: 5000,
        });

        navigate("/dashboard", { replace: true });
      } else if (result.status === "processing") {
        toast.info("Pagamento em análise. Você receberá um email quando for aprovado.", {
          autoClose: 7000,
        });
        navigate("/payment-success", { replace: true });
      } else {
        toast.error("Pagamento não foi aprovado. Tente novamente.", {
          autoClose: 5000,
        });
      }
    } catch (err) {
      const error = err as ApiError;
      const errorMsg = error.message || "Falha ao processar pagamento";
      toast.error(errorMsg, { autoClose: 5000 });
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutService();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleOpenPlanModal = () => {
    const planFromUrl = searchParams.get(PLAN_PARAM_KEY);
    const initialPlanId =
      planFromUrl && plans.find((p) => p.id === planFromUrl)
        ? planFromUrl
        : actualUserPlan?.id || "";
    setSelectedPlanId(initialPlanId);
    setIsPlanModalOpen(true);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    updateUrlWithPlan(planId);
  };

  const handleClosePlanModal = () => {
    setIsPlanModalOpen(false);
    if (selectedPlanId === actualUserPlan?.id) {
      setSearchParams((prev) => {
        prev.delete(PLAN_PARAM_KEY);
        return prev;
      });
    }
  };

  const handleConfirmPlanChange = () => {
    if (selectedPlanId && selectedPlanId !== actualUserPlan?.id) {
      changePlanMutation.mutate({ planId: selectedPlanId });
    }
  };

  const isLoading = isLoadingUser || isLoadingPlans;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!user || !userPlan) {
    return <LoadingSkeleton />;
  }

  const checkoutInfo = {
    user: {
      name: user.name,
      email: user.email,
    },
    subscription: {
      id: user.subscription?.id || "",
      status: user.subscription?.status || "pending",
    },
    plan: {
      id: userPlan.id,
      name: userPlan.name,
      price: userPlan.price,
      features: userPlan.features,
    },
  };

  const tokenizeError = tokenizeCardMutation.error as ApiError | null;
  const activateError = activateSubscriptionMutation.error as ApiError | null;
  const displayError = tokenizeError?.message || activateError?.message;

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.checkoutContainer}>
        <div className={styles.checkoutLeftColumn}>
          <CheckoutHeaderWithLogout onLogout={handleLogout} isLoggingOut={isLoggingOut} />

          <CreditCardPreview
            cardNumber={cardNumber}
            cardholderName={cardholderName}
            cardExpiration={cardExpiration}
            securityCode={securityCode}
          />

          <form onSubmit={handleSubmit(onSubmit)} className={styles.checkoutForm} noValidate>
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
              placeholder="Como esta no cartao"
              error={errors.cardholderName?.message}
              fullWidth
              uppercase
              onChange={(e) =>
                setValue("cardholderName", e.target.value.toUpperCase(), {
                  shouldValidate: false,
                })
              }
            />

            <div className={styles.inputRow}>
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
            </div>

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
        </div>

        <OrderSummaryWithChangePlan
          checkoutInfo={checkoutInfo}
          onChangePlan={handleOpenPlanModal}
        />
      </div>

      <PlanChangeModal
        isOpen={isPlanModalOpen}
        onClose={handleClosePlanModal}
        plans={plans}
        currentPlanId={actualUserPlan.id}
        selectedPlanId={selectedPlanId}
        onSelectPlan={handleSelectPlan}
        onConfirm={handleConfirmPlanChange}
        isLoading={changePlanMutation.isPending}
      />
    </div>
  );
}
