import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { DocumentPicker, type SelectedDocument } from "@/components/DocumentPicker/DocumentPicker";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { Textarea } from "@/components/Textarea/Textarea";
import { useUpdateContractMutation } from "@/queries/contracts/useUpdateContractMutation";
import { useUploadDocumentMutation } from "@/queries/documents/documents.queries";
import type { Contract } from "@/types/contract.types";
import { DOCUMENT_ENTITY_TYPES } from "@/types/document.types";
import { applyMask, formatCurrencyToInput, getCurrencyRawValue } from "@/utils/masks";
import * as styles from "../ContractForm.styles.css";

const editContractSchema = z
  .object({
    rentalAmount: z.string().min(1, "Valor do aluguel e obrigatorio"),
    paymentDay: z.string().min(1, "Dia de vencimento e obrigatorio"),
    depositAmount: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const day = Number.parseInt(data.paymentDay, 10);
      return day >= 1 && day <= 31;
    },
    {
      message: "Dia de vencimento deve ser entre 1 e 31",
      path: ["paymentDay"],
    },
  );

type EditContractFormData = z.infer<typeof editContractSchema>;

interface EditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
}

export function EditContractModal({ isOpen, onClose, contract }: EditContractModalProps) {
  const updateMutation = useUpdateContractMutation();
  const uploadDocumentMutation = useUploadDocumentMutation();
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isSubmitting = updateMutation.isPending || isUploading;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditContractFormData>({
    resolver: zodResolver(editContractSchema),
    mode: "onBlur",
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      for (const doc of selectedDocuments) {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview);
        }
      }
    };
  }, [selectedDocuments]);

  useEffect(() => {
    if (contract) {
      reset({
        rentalAmount: formatCurrencyToInput(contract.rentalAmount),
        paymentDay: contract.paymentDay.toString(),
        depositAmount: contract.depositAmount ? formatCurrencyToInput(contract.depositAmount) : "",
        notes: contract.notes || "",
      });
      // Reset document states when contract changes
      setSelectedDocuments([]);
    }
  }, [contract, reset]);

  const handleCurrencyChange =
    (field: "rentalAmount" | "depositAmount") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.target.value, "currency");
      setValue(field, masked, { shouldValidate: false });
    };

  const onSubmit = async (data: EditContractFormData) => {
    if (!contract) return;

    try {
      const payload = {
        rentalAmount: getCurrencyRawValue(data.rentalAmount),
        paymentDay: Number.parseInt(data.paymentDay, 10),
        depositAmount: data.depositAmount ? getCurrencyRawValue(data.depositAmount) : undefined,
        notes: data.notes || undefined,
      };

      const response = await updateMutation.mutateAsync({
        id: contract.id,
        input: payload,
      });

      // Upload new documents
      if (selectedDocuments.length > 0) {
        setIsUploading(true);
        try {
          for (const doc of selectedDocuments) {
            await uploadDocumentMutation.mutateAsync({
              entityType: DOCUMENT_ENTITY_TYPES.CONTRACT,
              entityId: contract.id,
              documentType: doc.documentType,
              file: doc.file,
            });
          }
        } catch {
          toast.error("Contrato atualizado, mas houve erro ao enviar alguns documentos");
        } finally {
          setIsUploading(false);
        }
      }

      toast.success(response.message || "Contrato atualizado com sucesso!");
      // Cleanup previews
      for (const doc of selectedDocuments) {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview);
        }
      }
      setSelectedDocuments([]);
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
          : "Erro ao atualizar contrato";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Cleanup previews
      for (const doc of selectedDocuments) {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview);
        }
      }
      setSelectedDocuments([]);
      onClose();
    }
  };

  if (!contract) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Contrato"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isUploading ? "Enviando documentos..." : "Salvar Alteracoes"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Informacoes do Contrato</h3>
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
              <div className={styles.infoLabel}>Inicio</div>
              <div className={styles.infoValue}>{formatDate(contract.startDate)}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Fim</div>
              <div className={styles.infoValue}>{formatDate(contract.endDate)}</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Valores</h3>
          <div className={styles.row3Cols}>
            <Input
              label="Valor do Aluguel"
              placeholder="R$ 0,00"
              error={errors.rentalAmount?.message}
              {...register("rentalAmount")}
              onChange={handleCurrencyChange("rentalAmount")}
              fullWidth
              required
            />
            <Input
              label="Dia de Vencimento"
              type="number"
              min="1"
              max="31"
              placeholder="5"
              error={errors.paymentDay?.message}
              {...register("paymentDay")}
              fullWidth
              required
            />
            <Input
              label="Caucao/Deposito"
              placeholder="R$ 0,00"
              error={errors.depositAmount?.message}
              {...register("depositAmount")}
              onChange={handleCurrencyChange("depositAmount")}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Documentos</h3>
          <DocumentPicker
            documents={selectedDocuments}
            onChange={setSelectedDocuments}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Observacoes</h3>
          <Textarea
            label="Observacoes"
            placeholder="Observacoes adicionais sobre o contrato..."
            error={errors.notes?.message}
            {...register("notes")}
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
