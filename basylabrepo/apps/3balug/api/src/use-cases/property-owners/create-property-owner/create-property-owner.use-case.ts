import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import type { ContactValidator, DocumentValidator } from '@basylab/core/validation'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'

type CreatePropertyOwnerInput = {
	name: string
	documentType: 'cpf' | 'cnpj'
	document: string
	rg?: string
	nationality?: string
	maritalStatus?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'
	profession?: string
	email?: string
	phone?: string
	phoneSecondary?: string
	address?: string
	addressNumber?: string
	addressComplement?: string
	neighborhood?: string
	city?: string
	state?: string
	zipCode?: string
	birthDate?: string
	photoUrl?: string
	notes?: string
	createdBy: User
}

type CreatePropertyOwnerOutput = {
	id: string
	companyId: string
	name: string
	documentType: string
	document: string
	rg: string | null
	nationality: string | null
	maritalStatus: string | null
	profession: string | null
	email: string | null
	phone: string | null
	phoneSecondary: string | null
	address: string | null
	addressNumber: string | null
	addressComplement: string | null
	neighborhood: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	birthDate: string | null
	photoUrl: string | null
	notes: string | null
	createdAt: Date
}

export class CreatePropertyOwnerUseCase {
	constructor(
		private readonly propertyOwnerRepository: IPropertyOwnerRepository,
		private readonly documentValidator: DocumentValidator,
		private readonly contactValidator: ContactValidator,
	) {}

	async execute(input: CreatePropertyOwnerInput): Promise<CreatePropertyOwnerOutput> {
		const { createdBy } = input

		if (!createdBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada')
		}

		const normalizedDocument = await this.documentValidator.normalizeValidateAndCheckUniqueness(
			input.document,
			input.documentType,
			createdBy.companyId,
			this.propertyOwnerRepository,
			'um proprietário',
		)

		let normalizedEmail: string | null = null
		if (input.email) {
			normalizedEmail = await this.contactValidator.normalizeValidateAndCheckEmailUniqueness(
				input.email,
				createdBy.companyId,
				this.propertyOwnerRepository,
				'um proprietário',
			)
		}

		const normalizedPhone = input.phone ? this.contactValidator.normalizePhone(input.phone) : null
		const normalizedPhoneSecondary = input.phoneSecondary
			? this.contactValidator.normalizePhone(input.phoneSecondary)
			: null

		const normalizedZipCode = input.zipCode
			? this.contactValidator.normalizeZipCode(input.zipCode)
			: null

		try {
			const propertyOwner = await this.propertyOwnerRepository.create({
				companyId: createdBy.companyId,
				name: input.name.trim(),
				documentType: input.documentType,
				document: normalizedDocument,
				rg: input.rg?.trim() || null,
				nationality: input.nationality?.trim() || null,
				maritalStatus: input.maritalStatus || null,
				profession: input.profession?.trim() || null,
				email: normalizedEmail,
				phone: normalizedPhone,
				phoneSecondary: normalizedPhoneSecondary,
				address: input.address?.trim() || null,
				addressNumber: input.addressNumber?.trim() || null,
				addressComplement: input.addressComplement?.trim() || null,
				neighborhood: input.neighborhood?.trim() || null,
				city: input.city?.trim() || null,
				state: input.state?.toUpperCase().trim() || null,
				zipCode: normalizedZipCode,
				birthDate: input.birthDate || null,
				photoUrl: input.photoUrl || null,
				notes: input.notes?.trim() || null,
				createdBy: createdBy.id,
			})

			logger.info(
				{
					propertyOwnerId: propertyOwner.id,
					companyId: propertyOwner.companyId,
					createdBy: createdBy.id,
				},
				'Proprietário criado com sucesso',
			)

			return {
				id: propertyOwner.id,
				companyId: propertyOwner.companyId,
				name: propertyOwner.name,
				documentType: propertyOwner.documentType,
				document: propertyOwner.document,
				rg: propertyOwner.rg,
				nationality: propertyOwner.nationality,
				maritalStatus: propertyOwner.maritalStatus,
				profession: propertyOwner.profession,
				email: propertyOwner.email,
				phone: propertyOwner.phone,
				phoneSecondary: propertyOwner.phoneSecondary,
				address: propertyOwner.address,
				addressNumber: propertyOwner.addressNumber,
				addressComplement: propertyOwner.addressComplement,
				neighborhood: propertyOwner.neighborhood,
				city: propertyOwner.city,
				state: propertyOwner.state,
				zipCode: propertyOwner.zipCode,
				birthDate: propertyOwner.birthDate,
				photoUrl: propertyOwner.photoUrl,
				notes: propertyOwner.notes,
				createdAt: propertyOwner.createdAt,
			}
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof ForbiddenError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar proprietário')
			throw new InternalServerError('Erro ao criar proprietário. Tente novamente.')
		}
	}
}
