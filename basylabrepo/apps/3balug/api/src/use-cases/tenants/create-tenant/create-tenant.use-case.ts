import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import type { ContactValidator, DocumentValidator } from '@basylab/core/validation'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type CreateTenantInput = {
	name: string
	cpf: string
	email?: string
	phone?: string
	address?: string
	city?: string
	state?: string
	zipCode?: string
	birthDate?: string
	monthlyIncome?: number
	employer?: string
	emergencyContact?: string
	emergencyPhone?: string
	rg?: string
	nationality?: string
	maritalStatus?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'
	profession?: string
	photoUrl?: string
	notes?: string
	createdBy: User
}

type CreateTenantOutput = {
	id: string
	companyId: string
	name: string
	cpf: string
	email: string | null
	phone: string | null
	address: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	birthDate: string | null
	monthlyIncome: number | null
	employer: string | null
	emergencyContact: string | null
	emergencyPhone: string | null
	rg: string | null
	nationality: string | null
	maritalStatus: string | null
	profession: string | null
	photoUrl: string | null
	notes: string | null
	createdAt: Date
}

export class CreateTenantUseCase {
	constructor(
		private readonly tenantRepository: ITenantRepository,
		private readonly documentValidator: DocumentValidator,
		private readonly contactValidator: ContactValidator,
	) {}

	async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
		const { createdBy } = input

		if (!createdBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada')
		}

		const normalizedCpf = await this.documentValidator.normalizeValidateAndCheckUniqueness(
			input.cpf,
			'cpf',
			createdBy.companyId,
			this.tenantRepository,
			'um locatário',
		)

		let normalizedEmail: string | null = null
		if (input.email) {
			normalizedEmail = await this.contactValidator.normalizeValidateAndCheckEmailUniqueness(
				input.email,
				createdBy.companyId,
				this.tenantRepository,
				'um locatário',
			)
		}

		const normalizedPhone = input.phone ? this.contactValidator.normalizePhone(input.phone) : null

		const normalizedEmergencyPhone = input.emergencyPhone
			? this.contactValidator.normalizePhone(input.emergencyPhone)
			: null

		const normalizedZipCode = input.zipCode
			? this.contactValidator.normalizeZipCode(input.zipCode)
			: null

		if (
			input.monthlyIncome !== undefined &&
			input.monthlyIncome !== null &&
			input.monthlyIncome < 0
		) {
			throw new BadRequestError('Renda mensal não pode ser negativa.')
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
				rg: input.rg?.trim() || null,
				nationality: input.nationality?.trim() || null,
				maritalStatus: input.maritalStatus || null,
				profession: input.profession?.trim() || null,
				photoUrl: input.photoUrl || null,
				notes: input.notes?.trim() || null,
				createdBy: createdBy.id,
			})

			logger.info(
				{
					tenantId: tenant.id,
					companyId: tenant.companyId,
					createdBy: createdBy.id,
				},
				'Locatário criado com sucesso',
			)

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
				rg: tenant.rg,
				nationality: tenant.nationality,
				maritalStatus: tenant.maritalStatus,
				profession: tenant.profession,
				photoUrl: tenant.photoUrl,
				notes: tenant.notes,
				createdAt: tenant.createdAt,
			}
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar locatário')
			throw new InternalServerError('Erro ao criar locatário. Tente novamente.')
		}
	}
}
