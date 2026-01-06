import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { DocumentPicker, type SelectedDocument } from "@/components/DocumentPicker/DocumentPicker";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { Select } from "@/components/Select/Select";
import { Textarea } from "@/components/Textarea/Textarea";
import { useUploadDocumentMutation } from "@/queries/documents/documents.queries";
import { useCreatePropertyOwnerMutation } from "@/queries/property-owners/useCreatePropertyOwnerMutation";
import { DOCUMENT_ENTITY_TYPES } from "@/types/document.types";
import { applyMask } from "@/utils/masks";
import * as styles from "../PropertyOwnerForm.styles.css";

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const cepRegex = /^\d{5}-?\d{3}$/;

const createPropertyOwnerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no maximo 100 caracteres"),
    documentType: z.enum(["cpf", "cnpj"], {
      message: "Selecione o tipo de documento",
    }),
    document: z.string().min(1, "Documento e obrigatorio"),
    email: z.string().email("Email invalido").optional().or(z.literal("")),
    phone: z.string().min(1, "Telefone e obrigatorio"),
    zipCode: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    birthDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.documentType === "cpf") {
        return cpfRegex.test(data.document);
      }
      return cnpjRegex.test(data.document);
    },
    {
      message: "Documento invalido",
      path: ["document"],
    },
  );

type CreatePropertyOwnerFormData = z.infer<typeof createPropertyOwnerSchema>;

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface CreatePropertyOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePropertyOwnerModal({ isOpen, onClose }: CreatePropertyOwnerModalProps) {
  const createMutation = useCreatePropertyOwnerMutation();
  const uploadDocumentMutation = useUploadDocumentMutation();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreatePropertyOwnerFormData>({
    resolver: zodResolver(createPropertyOwnerSchema),
    mode: "onBlur",
    defaultValues: {
      documentType: "cpf",
    },
  });

  const documentType = watch("documentType");
  const notesValue = watch("notes") || "";

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, documentType);
    setValue("document", masked, { shouldValidate: false });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "phone");
    setValue("phone", masked, { shouldValidate: false });
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "cep");
    setValue("zipCode", masked, { shouldValidate: false });
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

  const onSubmit = async (data: CreatePropertyOwnerFormData) => {
    try {
      const payload = {
        ...data,
        document: data.document.replace(/\D/g, ""),
        phone: data.phone?.replace(/\D/g, "") || undefined,
        zipCode: data.zipCode?.replace(/\D/g, "") || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        birthDate: data.birthDate || undefined,
        notes: data.notes || undefined,
      };
      const response = await createMutation.mutateAsync(payload);
      const ownerId = response.data.id;

      // Upload documents if any were selected
      if (selectedDocuments.length > 0) {
        setIsUploading(true);
        try {
          for (const doc of selectedDocuments) {
            await uploadDocumentMutation.mutateAsync({
              entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
              entityId: ownerId,
              documentType: doc.documentType,
              file: doc.file,
            });
          }
        } catch {
          toast.error("Proprietario criado, mas houve erro ao enviar alguns documentos");
        } finally {
          setIsUploading(false);
        }
      }

      toast.success(response.message || "Proprietario criado com sucesso!");
      reset();
      setSelectedDocuments([]);
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao criar proprietario";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending && !isUploading) {
      // Cleanup document previews
      for (const doc of selectedDocuments) {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview);
        }
      }
      reset();
      setCepError(null);
      setSelectedDocuments([]);
      onClose();
    }
  };

  const isSubmitting = createMutation.isPending || isUploading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Proprietario"
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
            <Select
              {...register("documentType")}
              label="Tipo de Documento"
              error={errors.documentType?.message}
              fullWidth
              disabled={isSubmitting}
              required
              options={[
                { value: "cpf", label: "CPF (Pessoa Fisica)" },
                { value: "cnpj", label: "CNPJ (Pessoa Juridica)" },
              ]}
            />
            <Input
              {...register("document", { onChange: handleDocumentChange })}
              label="Documento"
              placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
              error={errors.document?.message}
              fullWidth
              disabled={isSubmitting}
              required
            />
          </div>

          <div className={styles.row2Cols}>
            <Input
              {...register("birthDate")}
              type="date"
              label="Data de Nascimento"
              error={errors.birthDate?.message}
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

          <Input
            {...register("email")}
            type="email"
            label="Email"
            placeholder="email@exemplo.com"
            error={errors.email?.message}
            fullWidth
            disabled={isSubmitting}
          />
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
                disabled={isSubmitting || cepLoading}
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
            placeholder="Informacoes adicionais sobre o proprietario..."
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
