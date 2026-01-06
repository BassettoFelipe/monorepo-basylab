import { BadRequestError, ConflictError } from "@/errors";
import { ValidationUtils } from "@/utils/validation.utils";

interface IEmailRepository {
  findByEmail(email: string, companyId: string): Promise<{ id: string } | null>;
}

export class ContactValidationService {
  normalizePhone(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\D/g, "");

    if (normalized.length < 10 || normalized.length > 11) {
      throw new BadRequestError(
        "Formato de telefone inválido. Use 10 dígitos (fixo) ou 11 dígitos (celular).",
      );
    }

    return normalized;
  }

  normalizeZipCode(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\D/g, "");

    if (!ValidationUtils.isValidCEP(normalized)) {
      throw new BadRequestError("CEP inválido. Deve conter exatamente 8 dígitos.");
    }

    return normalized;
  }

  normalizeEmail(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.toLowerCase().trim();

    if (!ValidationUtils.isValidEmail(normalized)) {
      throw new BadRequestError("E-mail inválido.");
    }

    return normalized;
  }

  async validateEmailUniqueness(
    email: string,
    companyId: string,
    repository: IEmailRepository,
    entityType: string = "registro",
    excludeId?: string,
  ): Promise<void> {
    const existing = await repository.findByEmail(email, companyId);

    if (existing && existing.id !== excludeId) {
      throw new ConflictError(`Já existe ${entityType} cadastrado com este e-mail na sua empresa.`);
    }
  }

  async normalizeValidateAndCheckEmailUniqueness(
    value: string,
    companyId: string,
    repository: IEmailRepository,
    entityType: string = "registro",
    excludeId?: string,
  ): Promise<string> {
    const normalized = this.normalizeEmail(value);

    if (!normalized) {
      throw new BadRequestError("E-mail é obrigatório.");
    }

    await this.validateEmailUniqueness(normalized, companyId, repository, entityType, excludeId);

    return normalized;
  }
}
