import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { PropertyPhotoUpload } from "@/components/PropertyPhotoUpload/PropertyPhotoUpload";
import { Select } from "@/components/Select/Select";
import { Textarea } from "@/components/Textarea/Textarea";
import { useUpdatePropertyMutation } from "@/queries/properties/useUpdatePropertyMutation";
import { usePropertyOwnersQuery } from "@/queries/property-owners/usePropertyOwnersQuery";
import type { ListingType, Property, PropertyStatus, PropertyType } from "@/types/property.types";
import { applyMask, formatCurrencyToInput, getCurrencyRawValue } from "@/utils/masks";
import * as styles from "../PropertyForm.styles.css";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const editPropertySchema = z
  .object({
    ownerId: z.string().min(1, "Proprietario e obrigatorio"),
    title: z
      .string()
      .min(3, "Titulo deve ter pelo menos 3 caracteres")
      .max(200, "Titulo deve ter no maximo 200 caracteres"),
    description: z.string().optional(),
    type: z.enum(["house", "apartment", "land", "commercial", "rural"], {
      message: "Selecione o tipo do imovel",
    }),
    listingType: z.enum(["rent", "sale", "both"], {
      message: "Selecione a finalidade",
    }),
    status: z.enum(["available", "rented", "sold", "maintenance", "unavailable"], {
      message: "Selecione o status",
    }),
    zipCode: z.string().optional(),
    address: z.string().min(1, "Endereco e obrigatorio"),
    neighborhood: z.string().optional(),
    city: z.string().min(1, "Cidade e obrigatoria"),
    state: z.string().min(1, "Estado e obrigatorio").max(2, "Use a sigla do estado (ex: SP)"),
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    parkingSpaces: z.string().optional(),
    area: z.string().optional(),
    rentalPrice: z.string().optional(),
    salePrice: z.string().optional(),
    iptuPrice: z.string().optional(),
    condoFee: z.string().optional(),
    hasPool: z.boolean().optional(),
    hasGarden: z.boolean().optional(),
    hasGarage: z.boolean().optional(),
    hasElevator: z.boolean().optional(),
    hasGym: z.boolean().optional(),
    hasPlayground: z.boolean().optional(),
    hasSecurity: z.boolean().optional(),
    hasAirConditioning: z.boolean().optional(),
    hasFurnished: z.boolean().optional(),
    hasPetFriendly: z.boolean().optional(),
    hasBalcony: z.boolean().optional(),
    hasBarbecue: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.listingType === "rent" || data.listingType === "both") {
        const rentalValue = getCurrencyRawValue(data.rentalPrice || "");
        return rentalValue > 0;
      }
      return true;
    },
    {
      message: "Preco de aluguel e obrigatorio para locacao",
      path: ["rentalPrice"],
    },
  )
  .refine(
    (data) => {
      if (data.listingType === "sale" || data.listingType === "both") {
        const saleValue = getCurrencyRawValue(data.salePrice || "");
        return saleValue > 0;
      }
      return true;
    },
    {
      message: "Preco de venda e obrigatorio para venda",
      path: ["salePrice"],
    },
  );

type EditPropertyFormData = z.infer<typeof editPropertySchema>;

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export function EditPropertyModal({ isOpen, onClose, property }: EditPropertyModalProps) {
  const updateMutation = useUpdatePropertyMutation();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const { data: ownersData } = usePropertyOwnersQuery({ limit: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditPropertyFormData>({
    resolver: zodResolver(editPropertySchema),
    mode: "onBlur",
  });

  const listingType = watch("listingType");

  useEffect(() => {
    if (property) {
      reset({
        ownerId: property.ownerId,
        title: property.title,
        description: property.description || "",
        type: property.type,
        listingType: property.listingType,
        status: property.status,
        zipCode: property.zipCode ? applyMask(property.zipCode, "cep") : "",
        address: property.address || "",
        neighborhood: property.neighborhood || "",
        city: property.city || "",
        state: property.state || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        parkingSpaces: property.parkingSpaces?.toString() || "",
        area: property.area?.toString() || "",
        rentalPrice: property.rentalPrice ? formatCurrencyToInput(property.rentalPrice) : "",
        salePrice: property.salePrice ? formatCurrencyToInput(property.salePrice) : "",
        iptuPrice: property.iptuPrice ? formatCurrencyToInput(property.iptuPrice) : "",
        condoFee: property.condoFee ? formatCurrencyToInput(property.condoFee) : "",
        hasPool: property.features?.hasPool || false,
        hasGarden: property.features?.hasGarden || false,
        hasGarage: property.features?.hasGarage || false,
        hasElevator: property.features?.hasElevator || false,
        hasGym: property.features?.hasGym || false,
        hasPlayground: property.features?.hasPlayground || false,
        hasSecurity: property.features?.hasSecurity || false,
        hasAirConditioning: property.features?.hasAirConditioning || false,
        hasFurnished: property.features?.hasFurnished || false,
        hasPetFriendly: property.features?.hasPetFriendly || false,
        hasBalcony: property.features?.hasBalcony || false,
        hasBarbecue: property.features?.hasBarbecue || false,
      });
    }
  }, [property, reset]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, "cep");
    setValue("zipCode", masked, { shouldValidate: false });
  };

  const handleCurrencyChange =
    (field: "rentalPrice" | "salePrice" | "iptuPrice" | "condoFee") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.target.value, "currency");
      setValue(field, masked, { shouldValidate: false });
    };

  const fetchAddressByCep = useCallback(
    async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, "");
      if (cleanCep.length !== 8) return;

      setCepLoading(true);
      setCepError(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (!response.ok) throw new Error("Erro ao buscar CEP");

        const data: ViaCepResponse = await response.json();
        if (data.erro) {
          setCepError("CEP nao encontrado");
          return;
        }

        setValue("address", data.logradouro || "");
        setValue("neighborhood", data.bairro || "");
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

  const onSubmit = async (data: EditPropertyFormData) => {
    if (!property) return;

    try {
      const features = {
        hasPool: data.hasPool === true,
        hasGarden: data.hasGarden === true,
        hasGarage: data.hasGarage === true,
        hasElevator: data.hasElevator === true,
        hasGym: data.hasGym === true,
        hasPlayground: data.hasPlayground === true,
        hasSecurity: data.hasSecurity === true,
        hasAirConditioning: data.hasAirConditioning === true,
        hasFurnished: data.hasFurnished === true,
        hasPetFriendly: data.hasPetFriendly === true,
        hasBalcony: data.hasBalcony === true,
        hasBarbecue: data.hasBarbecue === true,
      };

      const payload = {
        ownerId: data.ownerId,
        title: data.title,
        description: data.description || null,
        type: data.type as PropertyType,
        listingType: data.listingType as ListingType,
        status: data.status as PropertyStatus,
        zipCode: data.zipCode?.replace(/\D/g, "") || null,
        address: data.address || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        bedrooms: data.bedrooms ? Number.parseInt(data.bedrooms, 10) : undefined,
        bathrooms: data.bathrooms ? Number.parseInt(data.bathrooms, 10) : undefined,
        parkingSpaces: data.parkingSpaces ? Number.parseInt(data.parkingSpaces, 10) : undefined,
        area: data.area ? Number.parseInt(data.area, 10) : null,
        rentalPrice: getCurrencyRawValue(data.rentalPrice || "") || null,
        salePrice: getCurrencyRawValue(data.salePrice || "") || null,
        iptuPrice: getCurrencyRawValue(data.iptuPrice || "") || null,
        condoFee: getCurrencyRawValue(data.condoFee || "") || null,
        features,
      };

      const response = await updateMutation.mutateAsync({
        id: property.id,
        input: payload,
      });
      toast.success(response.message || "Imovel atualizado com sucesso!");
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
          : "Erro ao atualizar imovel";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      setCepError(null);
      onClose();
    }
  };

  if (!property) return null;

  const ownerOptions = [
    { value: "", label: "Selecione o proprietario" },
    ...(ownersData?.data.map((owner) => ({
      value: owner.id,
      label: owner.name,
    })) || []),
  ];

  const typeOptions = [
    { value: "house", label: "Casa" },
    { value: "apartment", label: "Apartamento" },
    { value: "land", label: "Terreno" },
    { value: "commercial", label: "Comercial" },
    { value: "rural", label: "Rural" },
  ];

  const statusOptions = [
    { value: "available", label: "Disponivel" },
    { value: "rented", label: "Alugado" },
    { value: "sold", label: "Vendido" },
    { value: "maintenance", label: "Manutencao" },
    { value: "unavailable", label: "Indisponivel" },
  ];

  const listingTypeOptions = [
    { value: "rent", label: "Locacao" },
    { value: "sale", label: "Venda" },
    { value: "both", label: "Locacao e Venda" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Imovel"
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
          <h3 className={styles.sectionTitle}>Dados Basicos</h3>
          <div className={styles.row3Cols}>
            <Select
              label="Proprietario"
              error={errors.ownerId?.message}
              {...register("ownerId")}
              options={ownerOptions}
              fullWidth
              required
            />
            <Select
              label="Tipo"
              error={errors.type?.message}
              {...register("type")}
              options={typeOptions}
              fullWidth
              required
            />
            <Select
              label="Status"
              error={errors.status?.message}
              {...register("status")}
              options={statusOptions}
              fullWidth
              required
            />
          </div>
          <Input
            label="Titulo"
            placeholder="Ex: Casa 3 quartos no Centro"
            error={errors.title?.message}
            {...register("title")}
            fullWidth
            required
          />
          <Textarea
            label="Descricao"
            placeholder="Descreva o imovel..."
            error={errors.description?.message}
            {...register("description")}
            rows={3}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Finalidade e Valores</h3>
          <Select
            label="Finalidade"
            error={errors.listingType?.message}
            {...register("listingType")}
            options={listingTypeOptions}
            fullWidth
            required
          />
          <div className={styles.row2Cols}>
            {(listingType === "rent" || listingType === "both") && (
              <Input
                label="Valor do Aluguel"
                placeholder="R$ 0,00"
                error={errors.rentalPrice?.message}
                {...register("rentalPrice")}
                onChange={handleCurrencyChange("rentalPrice")}
                fullWidth
              />
            )}
            {(listingType === "sale" || listingType === "both") && (
              <Input
                label="Valor de Venda"
                placeholder="R$ 0,00"
                error={errors.salePrice?.message}
                {...register("salePrice")}
                onChange={handleCurrencyChange("salePrice")}
                fullWidth
              />
            )}
          </div>
          <div className={styles.row2Cols}>
            <Input
              label="IPTU (mensal)"
              placeholder="R$ 0,00"
              error={errors.iptuPrice?.message}
              {...register("iptuPrice")}
              onChange={handleCurrencyChange("iptuPrice")}
              fullWidth
            />
            <Input
              label="Condominio"
              placeholder="R$ 0,00"
              error={errors.condoFee?.message}
              {...register("condoFee")}
              onChange={handleCurrencyChange("condoFee")}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Endereco</h3>
          <div className={styles.rowAddress}>
            <div className={styles.cepWrapper}>
              <Input
                label="CEP"
                placeholder="00000-000"
                error={errors.zipCode?.message}
                {...register("zipCode")}
                onChange={handleCepChange}
                onBlur={(e) => fetchAddressByCep(e.target.value)}
                maxLength={9}
                fullWidth
                rightIcon={
                  cepLoading ? <Loader2 size={16} className={styles.spinner} /> : undefined
                }
              />
            </div>
            <Input
              label="Endereco"
              placeholder="Rua, numero, complemento"
              error={errors.address?.message}
              {...register("address")}
              fullWidth
              required
            />
            <Input
              label="UF"
              placeholder="SP"
              error={errors.state?.message}
              {...register("state")}
              maxLength={2}
              fullWidth
              required
            />
          </div>
          {cepError && (
            <div className={styles.cepAlert}>
              <AlertTriangle size={16} className={styles.cepAlertIcon} />
              <div className={styles.cepAlertContent}>
                <p className={styles.cepAlertTitle}>{cepError}</p>
                <p className={styles.cepAlertText}>Preencha o endereco manualmente.</p>
              </div>
            </div>
          )}
          <div className={styles.row2Cols}>
            <Input
              label="Bairro"
              placeholder="Bairro"
              error={errors.neighborhood?.message}
              {...register("neighborhood")}
              fullWidth
            />
            <Input
              label="Cidade"
              placeholder="Cidade"
              error={errors.city?.message}
              {...register("city")}
              fullWidth
              required
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Caracteristicas</h3>
          <div className={styles.row4Cols}>
            <Input
              label="Quartos"
              type="number"
              placeholder="0"
              min="0"
              error={errors.bedrooms?.message}
              {...register("bedrooms")}
              fullWidth
            />
            <Input
              label="Banheiros"
              type="number"
              placeholder="0"
              min="0"
              error={errors.bathrooms?.message}
              {...register("bathrooms")}
              fullWidth
            />
            <Input
              label="Vagas"
              type="number"
              placeholder="0"
              min="0"
              error={errors.parkingSpaces?.message}
              {...register("parkingSpaces")}
              fullWidth
            />
            <Input
              label="Area (m2)"
              type="number"
              placeholder="0"
              min="0"
              error={errors.area?.message}
              {...register("area")}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Comodidades</h3>
          <div className={styles.featuresGrid}>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasPool")} />
              <span className={styles.featureLabel}>Piscina</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasGarden")} />
              <span className={styles.featureLabel}>Jardim</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasGarage")} />
              <span className={styles.featureLabel}>Garagem</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasElevator")} />
              <span className={styles.featureLabel}>Elevador</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasGym")} />
              <span className={styles.featureLabel}>Academia</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasPlayground")} />
              <span className={styles.featureLabel}>Playground</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasSecurity")} />
              <span className={styles.featureLabel}>Seguranca 24h</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input
                type="checkbox"
                className={styles.checkbox}
                {...register("hasAirConditioning")}
              />
              <span className={styles.featureLabel}>Ar Condicionado</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasFurnished")} />
              <span className={styles.featureLabel}>Mobiliado</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasPetFriendly")} />
              <span className={styles.featureLabel}>Aceita Pets</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasBalcony")} />
              <span className={styles.featureLabel}>Varanda</span>
            </label>
            <label className={styles.featureCheckbox}>
              <input type="checkbox" className={styles.checkbox} {...register("hasBarbecue")} />
              <span className={styles.featureLabel}>Churrasqueira</span>
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Fotos</h3>
          <PropertyPhotoUpload
            propertyId={property.id}
            photos={property.photos || []}
            maxPhotos={20}
            disabled={updateMutation.isPending}
          />
        </div>
      </form>
    </Modal>
  );
}
