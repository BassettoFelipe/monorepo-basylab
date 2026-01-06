import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Modal } from "@/components/Modal/Modal";
import { Textarea } from "@/components/Textarea/Textarea";
import { useTerminateContractMutation } from "@/queries/contracts/useTerminateContractMutation";
import type { Contract } from "@/types/contract.types";
import * as styles from "../ContractForm.styles.css";

const terminateContractSchema = z.object({
  reason: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres"),
});

type TerminateContractFormData = z.infer<typeof terminateContractSchema>;

interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
}

export function TerminateContractModal({ isOpen, onClose, contract }: TerminateContractModalProps) {
  const terminateMutation = useTerminateContractMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TerminateContractFormData>({
    resolver: zodResolver(terminateContractSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: TerminateContractFormData) => {
    if (!contract) return;

    try {
      const response = await terminateMutation.mutateAsync({
        id: contract.id,
        input: { reason: data.reason },
      });
      toast.success(response.message || "Contrato encerrado com sucesso!");
      reset();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : "Erro ao encerrar contrato";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!terminateMutation.isPending) {
      reset();
      onClose();
    }
  };

  if (!contract) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Encerrar Contrato"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={terminateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit(onSubmit)}
            loading={terminateMutation.isPending}
          >
            Encerrar Contrato
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.terminateWarning}>
          <AlertTriangle size={20} className={styles.terminateWarningIcon} />
          <div className={styles.terminateWarningContent}>
            <p className={styles.terminateWarningTitle}>Atencao: Esta acao e irreversivel</p>
            <p className={styles.terminateWarningText}>
              Ao encerrar o contrato, o imovel sera marcado como disponivel e o contrato nao podera
              ser reativado.
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Detalhes do Contrato</h3>
          <div className={styles.row2Cols}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Imovel</div>
              <div className={styles.infoValue}>{contract.property?.title || "-"}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Inquilino</div>
              <div className={styles.infoValue}>{contract.tenant?.name || "-"}</div>
            </div>
          </div>
          <div className={styles.row2Cols}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Periodo</div>
              <div className={styles.infoValue}>
                {formatDate(contract.startDate)} a {formatDate(contract.endDate)}
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Aluguel</div>
              <div className={styles.infoValue}>{formatCurrency(contract.rentalAmount)}</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Motivo do Encerramento</h3>
          <Textarea
            label="Motivo"
            placeholder="Descreva o motivo do encerramento do contrato..."
            error={errors.reason?.message}
            {...register("reason")}
            rows={4}
          />
        </div>
      </div>
    </Modal>
  );
}
