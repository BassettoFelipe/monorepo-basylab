import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@basylab/core/errors";
import type { ContactValidator, DocumentValidator } from "@basylab/core/validation";
import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";

type CreatePropertyOwnerInput = {
  name: string;
  documentType: "cpf" | "cnpj";
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  notes?: string;
  createdBy: User;
};

type CreatePropertyOwnerOutput = {
  id: string;
  companyId: string;
  name: string;
  documentType: string;
  document: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  birthDate: string | null;
  notes: string | null;
  createdAt: Date;
};

export class CreatePropertyOwnerUseCase {
  constructor(
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly documentValidator: DocumentValidator,
    private readonly contactValidator: ContactValidator,
  ) {}

  async execute(input: CreatePropertyOwnerInput): Promise<CreatePropertyOwnerOutput> {
    const { createdBy } = input;

    if (!createdBy.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada");
    }

    const normalizedDocument = await this.documentValidator.normalizeValidateAndCheckUniqueness(
      input.document,
      input.documentType,
      createdBy.companyId,
      this.propertyOwnerRepository,
      "um proprietário",
    );

    let normalizedEmail: string | null = null;
    if (input.email) {
      normalizedEmail = await this.contactValidator.normalizeValidateAndCheckEmailUniqueness(
        input.email,
        createdBy.companyId,
        this.propertyOwnerRepository,
        "um proprietário",
      );
    }

    const normalizedPhone = input.phone ? this.contactValidator.normalizePhone(input.phone) : null;

    const normalizedZipCode = input.zipCode
      ? this.contactValidator.normalizeZipCode(input.zipCode)
      : null;

    try {
      const propertyOwner = await this.propertyOwnerRepository.create({
        companyId: createdBy.companyId,
        name: input.name.trim(),
        documentType: input.documentType,
        document: normalizedDocument,
        email: normalizedEmail,
        phone: normalizedPhone,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.toUpperCase().trim() || null,
        zipCode: normalizedZipCode,
        birthDate: input.birthDate || null,
        notes: input.notes?.trim() || null,
        createdBy: createdBy.id,
      });

      logger.info(
        {
          propertyOwnerId: propertyOwner.id,
          companyId: propertyOwner.companyId,
          createdBy: createdBy.id,
        },
        "Proprietário criado com sucesso",
      );

      return {
        id: propertyOwner.id,
        companyId: propertyOwner.companyId,
        name: propertyOwner.name,
        documentType: propertyOwner.documentType,
        document: propertyOwner.document,
        email: propertyOwner.email,
        phone: propertyOwner.phone,
        address: propertyOwner.address,
        city: propertyOwner.city,
        state: propertyOwner.state,
        zipCode: propertyOwner.zipCode,
        birthDate: propertyOwner.birthDate,
        notes: propertyOwner.notes,
        createdAt: propertyOwner.createdAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ConflictError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao criar proprietário");
      throw new InternalServerError("Erro ao criar proprietário. Tente novamente.");
    }
  }
}
