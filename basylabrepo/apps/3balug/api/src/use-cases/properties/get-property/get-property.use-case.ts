import { ForbiddenError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import type {
  ListingType,
  PropertyFeatures,
  PropertyStatus,
  PropertyType,
} from "@/db/schema/properties";
import type { User } from "@/db/schema/users";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import type { IPropertyPhotoRepository } from "@/repositories/contracts/property-photo.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type GetPropertyInput = {
  id: string;
  requestedBy: User;
};

type PropertyOwnerDTO = {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
};

type PropertyPhotoDTO = {
  id: string;
  url: string;
  isPrimary: boolean;
};

type GetPropertyOutput = {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  rentalPrice: number | null;
  salePrice: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  area: number | null;
  features: PropertyFeatures | null;
  ownerId: string;
  owner: PropertyOwnerDTO | null;
  broker: { id: string; name: string; email: string } | null;
  photos: PropertyPhotoDTO[];
};

const ALLOWED_ROLES: UserRole[] = [
  USER_ROLES.OWNER,
  USER_ROLES.MANAGER,
  USER_ROLES.BROKER,
  USER_ROLES.INSURANCE_ANALYST,
];

export class GetPropertyUseCase {
  constructor(
    private readonly propertyRepository: IPropertyRepository,
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly propertyPhotoRepository: IPropertyPhotoRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetPropertyInput): Promise<GetPropertyOutput> {
    const currentUser = input.requestedBy;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para visualizar imóveis.");
    }

    if (!currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const property = await this.propertyRepository.findById(input.id);

    if (!property) {
      throw new NotFoundError("Imóvel não encontrado.");
    }

    if (property.companyId !== currentUser.companyId) {
      throw new ForbiddenError("Você não tem permissão para acessar este imóvel.");
    }

    if (currentUser.role === USER_ROLES.BROKER && property.brokerId !== currentUser.id) {
      throw new ForbiddenError("Você só pode visualizar imóveis dos quais é responsável.");
    }

    const [ownerEntity, photos, brokerUser] = await Promise.all([
      this.propertyOwnerRepository.findById(property.ownerId),
      this.propertyPhotoRepository.findByPropertyId(property.id),
      property.brokerId ? this.userRepository.findById(property.brokerId) : Promise.resolve(null),
    ]);

    const owner: PropertyOwnerDTO | null = ownerEntity
      ? {
          id: ownerEntity.id,
          name: ownerEntity.name,
          document: ownerEntity.document,
          email: ownerEntity.email,
          phone: ownerEntity.phone,
        }
      : null;

    const broker: { id: string; name: string; email: string } | null = brokerUser
      ? {
          id: brokerUser.id,
          name: brokerUser.name,
          email: brokerUser.email,
        }
      : null;

    const photosDTO: PropertyPhotoDTO[] = photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      isPrimary: photo.isPrimary ?? false,
    }));

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      type: property.type as PropertyType,
      listingType: property.listingType as ListingType,
      status: property.status as PropertyStatus,
      rentalPrice: property.rentalPrice,
      salePrice: property.salePrice,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      area: property.area,
      features: property.features as PropertyFeatures | null,
      ownerId: property.ownerId,
      owner,
      broker,
      photos: photosDTO,
    };
  }
}
