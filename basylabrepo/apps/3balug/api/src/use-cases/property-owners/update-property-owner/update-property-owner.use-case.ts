import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@basylab/core/errors";
import type { ContactValidator, DocumentValidator } from "@basylab/core/validation";
import { logger } from "@/config/logger";
import type { PropertyOwner } from "@/db/schema/property-owners";
import type { User } from "@/db/schema/users";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import { USER_ROLES } from "@/types/roles";

type UpdatePropertyOwnerInput = {
  id: string;
  name?: string;
  documentType?: "cpf" | "cnpj";
  document?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  updatedBy: User;
};

type UpdatePropertyOwnerOutput = PropertyOwner;

export class UpdatePropertyOwnerUseCase {
  constructor(
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly documentValidator: DocumentValidator,
    private readonly contactValidator: ContactValidator,
  ) {}

  async execute(input: UpdatePropertyOwnerInput): Promise<UpdatePropertyOwnerOutput> {
    const { updatedBy } = input;

    if (!updatedBy.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada");
    }

    const propertyOwner = await this.propertyOwnerRepository.findById(input.id);

    if (!propertyOwner || propertyOwner.companyId !== updatedBy.companyId) {
      throw new NotFoundError("Proprietário não encontrado.");
    }

    // Broker só pode editar proprietários que ele mesmo cadastrou
    if (updatedBy.role === USER_ROLES.BROKER && propertyOwner.createdBy !== updatedBy.id) {
      throw new ForbiddenError("Você só pode editar proprietários que você cadastrou.");
    }

    const updateData: Partial<PropertyOwner> = {};

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }

    if (input.document !== undefined || input.documentType !== undefined) {
      const newDocumentType = input.documentType ?? propertyOwner.documentType;
      const newDocument = input.document ?? propertyOwner.document;
      const normalizedDocument = this.documentValidator.validateDocument(
        newDocument,
        newDocumentType as "cpf" | "cnpj",
      );

      if (normalizedDocument !== propertyOwner.document) {
        await this.documentValidator.validateDocumentUniqueness(
          normalizedDocument,
          updatedBy.companyId,
          this.propertyOwnerRepository,
          "um proprietário",
          input.id,
        );
      }

      updateData.documentType = newDocumentType;
      updateData.document = normalizedDocument;
    }

    if (input.email !== undefined) {
      const normalizedEmail = input.email
        ? this.contactValidator.normalizeEmail(input.email)
        : null;

      if (normalizedEmail && normalizedEmail !== propertyOwner.email?.toLowerCase().trim()) {
        await this.contactValidator.validateEmailUniqueness(
          normalizedEmail,
          updatedBy.companyId,
          this.propertyOwnerRepository,
          "um proprietário",
          input.id,
        );
      }

      updateData.email = normalizedEmail;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone ? this.contactValidator.normalizePhone(input.phone) : null;
    }

    if (input.address !== undefined) {
      updateData.address = input.address?.trim() || null;
    }

    if (input.city !== undefined) {
      updateData.city = input.city?.trim() || null;
    }

    if (input.state !== undefined) {
      updateData.state = input.state?.toUpperCase().trim() || null;
    }

    if (input.zipCode !== undefined) {
      updateData.zipCode = input.zipCode
        ? this.contactValidator.normalizeZipCode(input.zipCode)
        : null;
    }

    if (input.birthDate !== undefined) {
      updateData.birthDate = input.birthDate || null;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return propertyOwner;
    }

    try {
      const updatedPropertyOwner = await this.propertyOwnerRepository.update(input.id, updateData);

      if (!updatedPropertyOwner) {
        throw new InternalServerError("Erro ao atualizar proprietário.");
      }

      logger.info(
        {
          propertyOwnerId: updatedPropertyOwner.id,
          updatedBy: updatedBy.id,
        },
        "Proprietário atualizado com sucesso",
      );

      return updatedPropertyOwner;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ConflictError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao atualizar proprietário");
      throw new InternalServerError("Erro ao atualizar proprietário. Tente novamente.");
    }
  }
}
