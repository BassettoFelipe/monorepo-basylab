import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@/errors";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { ContactValidationService } from "@/services/validation/contact-validation.service";
import type { DocumentValidationService } from "@/services/validation/document-validation.service";

type CreateTenantInput = {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  monthlyIncome?: number;
  employer?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  createdBy: User;
};

type CreateTenantOutput = {
  id: string;
  companyId: string;
  name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  birthDate: string | null;
  monthlyIncome: number | null;
  employer: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  createdAt: Date;
};

export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly documentValidationService: DocumentValidationService,
    private readonly contactValidationService: ContactValidationService,
  ) {}

  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    const { createdBy } = input;

    if (!createdBy.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada");
    }

    const normalizedCpf = await this.documentValidationService.normalizeValidateAndCheckUniqueness(
      input.cpf,
      "cpf",
      createdBy.companyId,
      this.tenantRepository,
      "um locatário",
    );

    let normalizedEmail: string | null = null;
    if (input.email) {
      normalizedEmail =
        await this.contactValidationService.normalizeValidateAndCheckEmailUniqueness(
          input.email,
          createdBy.companyId,
          this.tenantRepository,
          "um locatário",
        );
    }

    const normalizedPhone = input.phone
      ? this.contactValidationService.normalizePhone(input.phone)
      : null;

    const normalizedEmergencyPhone = input.emergencyPhone
      ? this.contactValidationService.normalizePhone(input.emergencyPhone)
      : null;

    const normalizedZipCode = input.zipCode
      ? this.contactValidationService.normalizeZipCode(input.zipCode)
      : null;

    if (
      input.monthlyIncome !== undefined &&
      input.monthlyIncome !== null &&
      input.monthlyIncome < 0
    ) {
      throw new BadRequestError("Renda mensal não pode ser negativa.");
    }

    try {
      const tenant = await this.tenantRepository.create({
        companyId: createdBy.companyId,
        name: input.name.trim(),
        cpf: normalizedCpf,
        email: normalizedEmail,
        phone: normalizedPhone,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.toUpperCase().trim() || null,
        zipCode: normalizedZipCode,
        birthDate: input.birthDate || null,
        monthlyIncome: input.monthlyIncome || null,
        employer: input.employer?.trim() || null,
        emergencyContact: input.emergencyContact?.trim() || null,
        emergencyPhone: normalizedEmergencyPhone,
        notes: input.notes?.trim() || null,
        createdBy: createdBy.id,
      });

      logger.info(
        {
          tenantId: tenant.id,
          companyId: tenant.companyId,
          createdBy: createdBy.id,
        },
        "Locatário criado com sucesso",
      );

      return {
        id: tenant.id,
        companyId: tenant.companyId,
        name: tenant.name,
        cpf: tenant.cpf,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        city: tenant.city,
        state: tenant.state,
        zipCode: tenant.zipCode,
        birthDate: tenant.birthDate,
        monthlyIncome: tenant.monthlyIncome,
        employer: tenant.employer,
        emergencyContact: tenant.emergencyContact,
        emergencyPhone: tenant.emergencyPhone,
        notes: tenant.notes,
        createdAt: tenant.createdAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ConflictError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao criar locatário");
      throw new InternalServerError("Erro ao criar locatário. Tente novamente.");
    }
  }
}
