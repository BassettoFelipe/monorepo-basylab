import { BadRequestError, ConflictError } from "@/errors";
import { ValidationUtils } from "@/utils/validation.utils";

interface IDocumentRepository {
  findByDocument(document: string, companyId: string): Promise<{ id: string } | null>;
}

export class DocumentValidationService {
  normalizeDocument(value: string): string {
    return value.replace(/\D/g, "");
  }

  validateCPF(value: string): string {
    const normalized = this.normalizeDocument(value);

    if (!ValidationUtils.isValidCPF(normalized)) {
      throw new BadRequestError("CPF inválido.");
    }

    return normalized;
  }

  validateCNPJ(value: string): string {
    const normalized = this.normalizeDocument(value);

    if (!ValidationUtils.isValidCNPJ(normalized)) {
      throw new BadRequestError("CNPJ inválido.");
    }

    return normalized;
  }

  validateDocument(value: string, type: "cpf" | "cnpj"): string {
    if (type === "cpf") {
      return this.validateCPF(value);
    }
    return this.validateCNPJ(value);
  }

  async validateDocumentUniqueness(
    document: string,
    companyId: string,
    repository: IDocumentRepository,
    entityType: string = "registro",
    excludeId?: string,
  ): Promise<void> {
    const existing = await repository.findByDocument(document, companyId);

    if (existing && existing.id !== excludeId) {
      throw new ConflictError(
        `Já existe ${entityType} cadastrado com este documento na sua empresa.`,
      );
    }
  }

  async normalizeValidateAndCheckUniqueness(
    value: string,
    type: "cpf" | "cnpj",
    companyId: string,
    repository: IDocumentRepository,
    entityType: string = "registro",
    excludeId?: string,
  ): Promise<string> {
    const normalized = this.validateDocument(value, type);

    await this.validateDocumentUniqueness(normalized, companyId, repository, entityType, excludeId);

    return normalized;
  }
}
