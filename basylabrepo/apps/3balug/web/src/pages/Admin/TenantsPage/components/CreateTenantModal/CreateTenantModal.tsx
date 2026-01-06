import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { DocumentPicker, type SelectedDocument } from "@/components/DocumentPicker/DocumentPicker";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { Textarea } from "@/components/Textarea/Textarea";
import { useUploadDocumentMutation } from "@/queries/documents/documents.queries";
import { useCreateTenantMutation } from "@/queries/tenants/useCreateTenantMutation";
import { DOCUMENT_ENTITY_TYPES } from "@/types/document.types";
import { applyMask, getCurrencyRawValue } from "@/utils/masks";
import * as styles from "../TenantForm.styles.css";

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cepRegex = /^\d{5}-?\d{3}$/;

const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no maximo 100 caracteres"),
  cpf: z.string().min(1, "CPF e obrigatorio").regex(cpfRegex, "CPF invalido"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  phone: z.string().min(1, "Telefone e obrigatorio"),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  birthDate: z.string().optional(),
  monthlyIncome: z.string().optional(),
  employer: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

type CreateTenantFormData = z.infer<typeof createTenantSchema>;

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTenantModal({ isOpen, onClose }: CreateTenantModalProps) {
  const createMutation = useCreateTenantMutation();
  const uploadDocumentMutation = useUploadDocumentMutation();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isSubmitting = createMutation.isPending || isUploading;

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    mode: "onBlur",
  });

  const notesValue = watch("notes") || "";

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "cpf");
    setValue("cpf", masked, { shouldValidate: false });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "phone");
    setValue("phone", masked, { shouldValidate: false });
  };

  const handleEmergencyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "phone");
    setValue("emergencyPhone", masked, { shouldValidate: false });
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "cep");
    setValue("zipCode", masked, { shouldValidate: false });
  };

  const handleMonthlyIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "currency");
    setValue("monthlyIncome", masked, { shouldValidate: false });
  };

  const fetchAddressByCep = useCallback(
    async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, "");

      if (cleanCep.length !== 8) {
        return;
      }

      setCepLoading(true);
      setCepError(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

        if (!response.ok) {
          throw new Error("Erro ao buscar CEP");
        }

        const data: ViaCepResponse = await response.json();

        if (data.erro) {
          setCepError("CEP nao encontrado");
          return;
        }

        setValue("address", data.logradouro || "");
        setValue("city", data.localidade || "");
        setValue("state", data.uf || "");
        setCepError(null);
      } catch {
        setCepError("Erro ao buscar CEP. Preencha manualmente.");
      } finally {
        setCepLoading(false);
      }
    },
    [setValue],
  );

  const handleCepBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const cep = e.target.value;
      if (cepRegex.test(cep)) {
        fetchAddressByCep(cep);
      }
    },
    [fetchAddressByCep],
  );

  const onSubmit = async (data: CreateTenantFormData) => {
    try {
      const monthlyIncomeValue = data.monthlyIncome
        ? getCurrencyRawValue(data.monthlyIncome)
        : undefined;

      const payload = {
        ...data,
        cpf: data.cpf.replace(/\D/g, ""),
        phone: data.phone?.replace(/\D/g, "") || undefined,
        emergencyPhone: data.emergencyPhone?.replace(/\D/g, "") || undefined,
        zipCode: data.zipCode?.replace(/\D/g, "") || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        birthDate: data.birthDate || undefined,
        monthlyIncome: monthlyIncomeValue,
        employer: data.employer || undefined,
        emergencyContact: data.emergencyContact || undefined,
        notes: data.notes || undefined,
      };
      const response = await createMutation.mutateAsync(payload);
      const tenantId = response.data.id;

      // Upload documents if any were selected
      if (selectedDocuments.length > 0) {
        setIsUploading(true);
        try {
          for (const doc of selectedDocuments) {
            await uploadDocumentMutation.mutateAsync({
              entityType: DOCUMENT_ENTITY_TYPES.TENANT,
              entityId: tenantId,
              documentType: doc.documentType,
              file: doc.file,
            });
          }
        } catch {
          toast.error("Inquilino criado, mas houve erro ao enviar alguns documentos");
        } finally {
          setIsUploading(false);
        }
      }

      toast.success(response.message || "Inquilino criado com sucesso!");
      // Cleanup previews
      for (const doc of selectedDocuments) {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview);
        }
      }
      setSelectedDocuments([]);
      reset();
      setCepError(null);
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao criar inquilino";
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
      reset();
      setCepError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Inquilino"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isUploading ? "Enviando documentos..." : "Adicionar"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dados Pessoais</h3>

          <Input
            {...register("name")}
            label="Nome Completo"
            placeholder="Digite o nome completo"
            error={errors.name?.message}
            fullWidth
            disabled={isSubmitting}
            required
          />

          <div className={styles.row2Cols}>
            <Input
              {...register("cpf", { onChange: handleCpfChange })}
              label="CPF"
              placeholder="000.000.000-00"
              error={errors.cpf?.message}
              fullWidth
              disabled={isSubmitting}
              required
            />
            <Input
              {...register("birthDate")}
              type="date"
              label="Data de Nascimento"
              error={errors.birthDate?.message}
              fullWidth
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.row2Cols}>
            <Input
              {...register("email")}
              type="email"
              label="Email"
              placeholder="email@exemplo.com"
              error={errors.email?.message}
              fullWidth
              disabled={isSubmitting}
            />
            <Input
              {...register("phone", { onChange: handlePhoneChange })}
              type="tel"
              label="Telefone"
              placeholder="(11) 99999-9999"
              error={errors.phone?.message}
              fullWidth
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Endereco</h3>

          <div className={styles.row3Cols}>
            <div className={styles.cepWrapper}>
              <Input
                {...register("zipCode", { onChange: handleCepChange })}
                label="CEP"
                placeholder="00000-000"
                error={errors.zipCode?.message}
                fullWidth
                disabled={createMutation.isPending || cepLoading}
                onBlur={handleCepBlur}
                rightIcon={
                  cepLoading ? <Loader2 size={18} className={styles.spinner} /> : undefined
                }
              />
              {cepLoading && <span className={styles.cepHint}>Buscando endereco...</span>}
            </div>
            <Input
              {...register("city")}
              label="Cidade"
              placeholder="Cidade"
              error={errors.city?.message}
              fullWidth
              disabled={isSubmitting}
            />
            <Input
              {...register("state")}
              label="Estado"
              placeholder="UF"
              maxLength={2}
              error={errors.state?.message}
              fullWidth
              disabled={isSubmitting}
              style={{ textTransform: "uppercase" }}
            />
            {cepError && !cepLoading && (
              <div className={styles.cepAlert}>
                <AlertTriangle size={18} className={styles.cepAlertIcon} />
                <div className={styles.cepAlertContent}>
                  <p className={styles.cepAlertTitle}>CEP nao encontrado</p>
                  <p className={styles.cepAlertText}>Preencha os campos de endereco manualmente.</p>
                </div>
              </div>
            )}
          </div>

          <Input
            {...register("address")}
            label="Endereco"
            placeholder="Rua, numero, complemento, bairro"
            error={errors.address?.message}
            fullWidth
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Informacoes Financeiras</h3>

          <div className={styles.row2Cols}>
            <Input
              {...register("monthlyIncome", {
                onChange: handleMonthlyIncomeChange,
              })}
              label="Renda Mensal"
              placeholder="0,00"
              leftIcon={<span style={{ color: "#6B7280" }}>R$</span>}
              error={errors.monthlyIncome?.message}
              fullWidth
              disabled={isSubmitting}
            />
            <Input
              {...register("employer")}
              label="Empregador"
              placeholder="Nome da empresa"
              error={errors.employer?.message}
              fullWidth
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Contato de Emergencia</h3>

          <div className={styles.row2Cols}>
            <Input
              {...register("emergencyContact")}
              label="Nome do Contato"
              placeholder="Nome completo"
              error={errors.emergencyContact?.message}
              fullWidth
              disabled={isSubmitting}
            />
            <Input
              {...register("emergencyPhone", {
                onChange: handleEmergencyPhoneChange,
              })}
              type="tel"
              label="Telefone de Emergencia"
              placeholder="(11) 99999-9999"
              error={errors.emergencyPhone?.message}
              fullWidth
              disabled={isSubmitting}
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
            {...register("notes")}
            label="Observacoes"
            placeholder="Informacoes adicionais sobre o inquilino..."
            error={errors.notes?.message}
            fullWidth
            disabled={isSubmitting}
            rows={4}
            showCharCount
            maxLength={500}
            value={notesValue}
          />
        </div>
      </form>
    </Modal>
  );
}
