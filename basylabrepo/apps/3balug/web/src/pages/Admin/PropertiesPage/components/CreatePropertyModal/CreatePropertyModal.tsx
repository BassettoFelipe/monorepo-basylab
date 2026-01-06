import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { PhotoPicker, type SelectedPhoto } from "@/components/PhotoPicker/PhotoPicker";
import { Select } from "@/components/Select/Select";
import { Textarea } from "@/components/Textarea/Textarea";
import { useCreatePropertyMutation } from "@/queries/properties/useCreatePropertyMutation";
import { usePropertyOwnersQuery } from "@/queries/property-owners/usePropertyOwnersQuery";
import { useUploadPropertyPhotoMutation } from "@/queries/property-photos/useUploadPropertyPhotoMutation";
import type { ListingType, PropertyType } from "@/types/property.types";
import { applyMask, getCurrencyRawValue } from "@/utils/masks";
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

const createPropertySchema = z
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

type CreatePropertyFormData = z.infer<typeof createPropertySchema>;

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePropertyModal({ isOpen, onClose }: CreatePropertyModalProps) {
  const createMutation = useCreatePropertyMutation();
  const uploadPhotoMutation = useUploadPropertyPhotoMutation();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: ownersData } = usePropertyOwnersQuery({ limit: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreatePropertyFormData>({
    resolver: zodResolver(createPropertySchema),
    mode: "onBlur",
    defaultValues: {
      type: "house",
      listingType: "rent",
    },
  });

  const listingType = watch("listingType");

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

  const onSubmit = async (data: CreatePropertyFormData) => {
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
        description: data.description || undefined,
        type: data.type as PropertyType,
        listingType: data.listingType as ListingType,
        zipCode: data.zipCode?.replace(/\D/g, "") || undefined,
        address: data.address || undefined,
        neighborhood: data.neighborhood || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        bedrooms: data.bedrooms ? Number.parseInt(data.bedrooms, 10) : undefined,
        bathrooms: data.bathrooms ? Number.parseInt(data.bathrooms, 10) : undefined,
        parkingSpaces: data.parkingSpaces ? Number.parseInt(data.parkingSpaces, 10) : undefined,
        area: data.area ? Number.parseInt(data.area, 10) : undefined,
        rentalPrice: getCurrencyRawValue(data.rentalPrice || "") || undefined,
        salePrice: getCurrencyRawValue(data.salePrice || "") || undefined,
        iptuPrice: getCurrencyRawValue(data.iptuPrice || "") || undefined,
        condoFee: getCurrencyRawValue(data.condoFee || "") || undefined,
        features,
      };

      const response = await createMutation.mutateAsync(payload);
      const propertyId = response.data.id;

      // Upload photos if any were selected
      if (selectedPhotos.length > 0) {
        setIsUploading(true);
        try {
          for (const photo of selectedPhotos) {
            await uploadPhotoMutation.mutateAsync({
              propertyId,
              file: photo.file,
              isPrimary: photo.isPrimary,
            });
          }
        } catch {
          toast.error("Imovel criado, mas houve erro ao enviar algumas fotos");
        } finally {
          setIsUploading(false);
        }
      }

      toast.success(response.message || "Imovel criado com sucesso!");
      reset();
      setCepError(null);
      setSelectedPhotos([]);
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
          : "Erro ao criar imovel";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending && !isUploading) {
      // Cleanup photo previews
      for (const photo of selectedPhotos) {
        URL.revokeObjectURL(photo.preview);
      }
      reset();
      setCepError(null);
      setSelectedPhotos([]);
      onClose();
    }
  };

  const isSubmitting = createMutation.isPending || isUploading;

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

  const listingTypeOptions = [
    { value: "rent", label: "Locacao" },
    { value: "sale", label: "Venda" },
    { value: "both", label: "Locacao e Venda" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Imovel"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isUploading ? "Enviando fotos..." : "Adicionar"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dados Basicos</h3>
          <div className={styles.row2Cols}>
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
          <PhotoPicker
            photos={selectedPhotos}
            onChange={setSelectedPhotos}
            maxPhotos={20}
            disabled={isSubmitting}
            label="Fotos do Imovel"
          />
        </div>
      </form>
    </Modal>
  );
}
