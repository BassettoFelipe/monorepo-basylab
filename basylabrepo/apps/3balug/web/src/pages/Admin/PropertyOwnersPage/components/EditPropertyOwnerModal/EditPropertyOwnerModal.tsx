import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { DocumentUpload } from "@/components/DocumentUpload/DocumentUpload";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { Select } from "@/components/Select/Select";
import { Textarea } from "@/components/Textarea/Textarea";
import { useUpdatePropertyOwnerMutation } from "@/queries/property-owners/useUpdatePropertyOwnerMutation";
import { DOCUMENT_ENTITY_TYPES } from "@/types/document.types";
import type { PropertyOwner } from "@/types/property-owner.types";
import { applyMask } from "@/utils/masks";
import * as styles from "../PropertyOwnerForm.styles.css";

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const cepRegex = /^\d{5}-?\d{3}$/;

const editPropertyOwnerSchema = z
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

type EditPropertyOwnerFormData = z.infer<typeof editPropertyOwnerSchema>;

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface EditPropertyOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyOwner: PropertyOwner | null;
}

export function EditPropertyOwnerModal({
  isOpen,
  onClose,
  propertyOwner,
}: EditPropertyOwnerModalProps) {
  const updateMutation = useUpdatePropertyOwnerMutation();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditPropertyOwnerFormData>({
    resolver: zodResolver(editPropertyOwnerSchema),
    mode: "onBlur",
  });

  const documentType = watch("documentType");
  const notesValue = watch("notes") || "";

  useEffect(() => {
    if (propertyOwner) {
      const formattedDocument = applyMask(propertyOwner.document, propertyOwner.documentType);
      const formattedPhone = propertyOwner.phone ? applyMask(propertyOwner.phone, "phone") : "";
      const formattedZipCode = propertyOwner.zipCode ? applyMask(propertyOwner.zipCode, "cep") : "";

      reset({
        name: propertyOwner.name,
        documentType: propertyOwner.documentType,
        document: formattedDocument,
        email: propertyOwner.email || "",
        phone: formattedPhone,
        zipCode: formattedZipCode,
        address: propertyOwner.address || "",
        city: propertyOwner.city || "",
        state: propertyOwner.state || "",
        birthDate: propertyOwner.birthDate || "",
        notes: propertyOwner.notes || "",
      });
    }
  }, [propertyOwner, reset]);

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

  const onSubmit = async (data: EditPropertyOwnerFormData) => {
    if (!propertyOwner) return;

    try {
      const payload = {
        ...data,
        document: data.document.replace(/\D/g, ""),
        phone: data.phone?.replace(/\D/g, "") || null,
        zipCode: data.zipCode?.replace(/\D/g, "") || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        birthDate: data.birthDate || null,
        notes: data.notes || null,
      };
      const response = await updateMutation.mutateAsync({
        id: propertyOwner.id,
        input: payload,
      });
      toast.success(response.message || "Proprietario atualizado com sucesso!");
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao atualizar proprietario";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      setCepError(null);
      onClose();
    }
  };

  if (!propertyOwner) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Proprietario"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={updateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={updateMutation.isPending}
          >
            Salvar Alteracoes
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
            disabled={updateMutation.isPending}
            required
          />

          <div className={styles.row2Cols}>
            <Select
              {...register("documentType")}
              label="Tipo de Documento"
              error={errors.documentType?.message}
              fullWidth
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
            />
            <Input
              {...register("phone", { onChange: handlePhoneChange })}
              type="tel"
              label="Telefone"
              placeholder="(11) 99999-9999"
              error={errors.phone?.message}
              fullWidth
              disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
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
                disabled={updateMutation.isPending || cepLoading}
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
              disabled={updateMutation.isPending}
            />
            <Input
              {...register("state")}
              label="Estado"
              placeholder="UF"
              maxLength={2}
              error={errors.state?.message}
              fullWidth
              disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Documentos</h3>

          <DocumentUpload
            entityType={DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER}
            entityId={propertyOwner.id}
            disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
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
