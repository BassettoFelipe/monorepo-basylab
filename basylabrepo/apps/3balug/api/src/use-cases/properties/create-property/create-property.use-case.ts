import { logger } from "@/config/logger";
import type { ListingType, PropertyFeatures, PropertyType } from "@/db/schema/properties";
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from "@/db/schema/properties";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER];

type CreatePropertyInput = {
  ownerId: string;
  brokerId?: string;
  title: string;
  description?: string;
  type: PropertyType;
  listingType: ListingType;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  area?: number;
  rentalPrice?: number;
  salePrice?: number;
  iptuPrice?: number;
  condoFee?: number;
  features?: PropertyFeatures;
  createdBy: User;
};

type CreatePropertyOutput = {
  id: string;
  companyId: string;
  ownerId: string;
  brokerId: string | null;
  title: string;
  description: string | null;
  type: string;
  listingType: string;
  status: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  area: number | null;
  rentalPrice: number | null;
  salePrice: number | null;
  iptuPrice: number | null;
  condoFee: number | null;
  features: PropertyFeatures | null;
  createdAt: Date;
};

export class CreatePropertyUseCase {
  constructor(
    private readonly propertyRepository: IPropertyRepository,
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
  ) {}

  async execute(input: CreatePropertyInput): Promise<CreatePropertyOutput> {
    const { createdBy } = input;

    if (!ALLOWED_ROLES.includes(createdBy.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para criar imóveis.");
    }

    if (!createdBy.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const validTypes = Object.values(PROPERTY_TYPES);
    if (!validTypes.includes(input.type)) {
      throw new BadRequestError(`Tipo de imóvel inválido. Use: ${validTypes.join(", ")}.`);
    }

    const validListingTypes = Object.values(LISTING_TYPES);
    if (!validListingTypes.includes(input.listingType)) {
      throw new BadRequestError(`Tipo de anúncio inválido. Use: ${validListingTypes.join(", ")}.`);
    }

    if (input.listingType === LISTING_TYPES.RENT || input.listingType === LISTING_TYPES.BOTH) {
      if (!input.rentalPrice || input.rentalPrice <= 0) {
        throw new BadRequestError("Valor de locação é obrigatório para imóveis de locação.");
      }
    }

    if (input.listingType === LISTING_TYPES.SALE || input.listingType === LISTING_TYPES.BOTH) {
      if (!input.salePrice || input.salePrice <= 0) {
        throw new BadRequestError("Valor de venda é obrigatório para imóveis à venda.");
      }
    }

    const propertyOwner = await this.propertyOwnerRepository.findById(input.ownerId);

    if (!propertyOwner) {
      throw new NotFoundError("Proprietário não encontrado.");
    }

    if (propertyOwner.companyId !== createdBy.companyId) {
      throw new ForbiddenError("Proprietário não pertence à sua empresa.");
    }

    if (createdBy.role === USER_ROLES.BROKER && propertyOwner.createdBy !== createdBy.id) {
      throw new ForbiddenError(
        "Você só pode cadastrar imóveis de proprietários que você cadastrou.",
      );
    }

    if (input.zipCode) {
      const normalizedZipCode = input.zipCode.replace(/\D/g, "");
      if (normalizedZipCode.length !== 8) {
        throw new BadRequestError("CEP inválido. Deve conter 8 dígitos.");
      }
    }

    let brokerId = input.brokerId || null;

    if (createdBy.role === USER_ROLES.BROKER) {
      brokerId = createdBy.id;
    }

    try {
      const property = await this.propertyRepository.create({
        companyId: createdBy.companyId,
        ownerId: input.ownerId,
        brokerId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        type: input.type,
        listingType: input.listingType,
        status: PROPERTY_STATUS.AVAILABLE,
        address: input.address?.trim() || null,
        neighborhood: input.neighborhood?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.toUpperCase().trim() || null,
        zipCode: input.zipCode?.replace(/\D/g, "") || null,
        bedrooms: input.bedrooms ?? 0,
        bathrooms: input.bathrooms ?? 0,
        parkingSpaces: input.parkingSpaces ?? 0,
        area: input.area || null,
        rentalPrice: input.rentalPrice || null,
        salePrice: input.salePrice || null,
        iptuPrice: input.iptuPrice || null,
        condoFee: input.condoFee || null,
        features: input.features || {},
        createdBy: createdBy.id,
      });

      logger.info(
        {
          propertyId: property.id,
          companyId: property.companyId,
          ownerId: property.ownerId,
          createdBy: createdBy.id,
        },
        "Imóvel criado com sucesso",
      );

      return {
        id: property.id,
        companyId: property.companyId,
        ownerId: property.ownerId,
        brokerId: property.brokerId,
        title: property.title,
        description: property.description,
        type: property.type,
        listingType: property.listingType,
        status: property.status,
        address: property.address,
        neighborhood: property.neighborhood,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        area: property.area,
        rentalPrice: property.rentalPrice,
        salePrice: property.salePrice,
        iptuPrice: property.iptuPrice,
        condoFee: property.condoFee,
        features: property.features,
        createdAt: property.createdAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao criar imóvel");
      throw new InternalServerError("Erro ao criar imóvel. Tente novamente.");
    }
  }
}
