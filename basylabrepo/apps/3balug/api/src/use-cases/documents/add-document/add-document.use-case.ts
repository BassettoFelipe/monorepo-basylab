import { logger } from "@/config/logger";
import type { DocumentEntityType, DocumentType } from "@/db/schema/documents";
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPES } from "@/db/schema/documents";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IDocumentRepository } from "@/repositories/contracts/document.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

interface AddDocumentInput {
  entityType: DocumentEntityType;
  entityId: string;
  documentType: DocumentType;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  description?: string;
  user: User;
}

interface AddDocumentOutput {
  id: string;
  entityType: string;
  entityId: string;
  documentType: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  description: string | null;
  createdAt: Date;
}

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER];

const MAX_DOCUMENTS_PER_ENTITY = 20;

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class AddDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(input: AddDocumentInput): Promise<AddDocumentOutput> {
    const {
      entityType,
      entityId,
      documentType,
      filename,
      originalName,
      mimeType,
      size,
      url,
      description,
      user,
    } = input;

    if (!ALLOWED_ROLES.includes(user.role as UserRole)) {
      throw new ForbiddenError("Voce nao tem permissao para adicionar documentos.");
    }

    if (!user.companyId) {
      throw new InternalServerError("Usuario sem empresa vinculada.");
    }

    if (!Object.values(DOCUMENT_ENTITY_TYPES).includes(entityType)) {
      throw new BadRequestError(
        `Tipo de entidade invalido. Use: ${Object.values(DOCUMENT_ENTITY_TYPES).join(", ")}.`,
      );
    }

    if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
      throw new BadRequestError(
        `Tipo de documento invalido. Use: ${Object.values(DOCUMENT_TYPES).join(", ")}.`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestError(
        `Tipo de arquivo nao permitido. Use: ${ALLOWED_MIME_TYPES.join(", ")}.`,
      );
    }

    if (size > MAX_FILE_SIZE) {
      throw new BadRequestError("Arquivo muito grande. Tamanho maximo: 10MB.");
    }

    if (entityType === DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER) {
      const owner = await this.propertyOwnerRepository.findById(entityId);
      if (!owner) {
        throw new NotFoundError("Proprietario nao encontrado.");
      }
      if (owner.companyId !== user.companyId) {
        throw new ForbiddenError("Proprietario nao pertence a sua empresa.");
      }
      // Se for broker, verificar se eh o criador
      if (user.role === USER_ROLES.BROKER && owner.createdBy !== user.id) {
        throw new ForbiddenError(
          "Voce so pode adicionar documentos em proprietarios que voce cadastrou.",
        );
      }
    } else if (entityType === DOCUMENT_ENTITY_TYPES.TENANT) {
      const tenant = await this.tenantRepository.findById(entityId);
      if (!tenant) {
        throw new NotFoundError("Inquilino nao encontrado.");
      }
      if (tenant.companyId !== user.companyId) {
        throw new ForbiddenError("Inquilino nao pertence a sua empresa.");
      }
      // Se for broker, verificar se eh o criador
      if (user.role === USER_ROLES.BROKER && tenant.createdBy !== user.id) {
        throw new ForbiddenError(
          "Voce so pode adicionar documentos em inquilinos que voce cadastrou.",
        );
      }
    }

    const docCount = await this.documentRepository.countByEntity(entityType, entityId);
    if (docCount >= MAX_DOCUMENTS_PER_ENTITY) {
      throw new BadRequestError(
        `Limite de ${MAX_DOCUMENTS_PER_ENTITY} documentos por registro atingido.`,
      );
    }

    try {
      const document = await this.documentRepository.create({
        companyId: user.companyId,
        entityType,
        entityId,
        documentType,
        filename,
        originalName,
        mimeType,
        size,
        url,
        description: description || null,
        uploadedBy: user.id,
      });

      logger.info(
        {
          documentId: document.id,
          entityType,
          entityId,
          documentType,
          uploadedBy: user.id,
        },
        "Documento adicionado",
      );

      return {
        id: document.id,
        entityType: document.entityType,
        entityId: document.entityId,
        documentType: document.documentType,
        filename: document.filename,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        url: document.url,
        description: document.description,
        createdAt: document.createdAt,
      };
    } catch (error) {
      logger.error({ err: error, entityType, entityId }, "Erro ao adicionar documento");
      throw new InternalServerError("Erro ao adicionar documento. Tente novamente.");
    }
  }
}
