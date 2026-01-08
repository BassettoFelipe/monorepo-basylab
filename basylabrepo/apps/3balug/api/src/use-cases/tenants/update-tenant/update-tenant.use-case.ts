import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import type { ContactValidator, DocumentValidator } from '@basylab/core/validation'
import { logger } from '@/config/logger'
import type { Tenant } from '@/db/schema/tenants'
import type { User } from '@/db/schema/users'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import { USER_ROLES } from '@/types/roles'

type UpdateTenantInput = {
	id: string
	name?: string
	cpf?: string
	email?: string | null
	phone?: string | null
	address?: string | null
	city?: string | null
	state?: string | null
	zipCode?: string | null
	birthDate?: string | null
	monthlyIncome?: number | null
	employer?: string | null
	emergencyContact?: string | null
	emergencyPhone?: string | null
	notes?: string | null
	updatedBy: User
}

type UpdateTenantOutput = Tenant

export class UpdateTenantUseCase {
	constructor(
		private readonly tenantRepository: ITenantRepository,
		private readonly documentValidator: DocumentValidator,
		private readonly contactValidator: ContactValidator,
	) {}

	async execute(input: UpdateTenantInput): Promise<UpdateTenantOutput> {
		const { updatedBy } = input

		if (!updatedBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada')
		}

		const tenant = await this.tenantRepository.findById(input.id)

		if (!tenant || tenant.companyId !== updatedBy.companyId) {
			throw new NotFoundError('Locatário não encontrado.')
		}

		if (updatedBy.role === USER_ROLES.BROKER && tenant.createdBy !== updatedBy.id) {
			throw new ForbiddenError('Você só pode editar locatários que você cadastrou.')
		}

		const updateData: Partial<Tenant> = {}

		if (input.name !== undefined) {
			updateData.name = input.name.trim()
		}

		if (input.cpf !== undefined) {
			const normalizedCpf = this.documentValidator.validateDocument(input.cpf, 'cpf')

			if (normalizedCpf !== tenant.cpf) {
				await this.documentValidator.validateDocumentUniqueness(
					normalizedCpf,
					updatedBy.companyId,
					this.tenantRepository,
					'um locatário',
					'cpf',
					input.id,
				)
			}

			updateData.cpf = normalizedCpf
		}

		if (input.email !== undefined) {
			const normalizedEmail = input.email ? this.contactValidator.normalizeEmail(input.email) : null

			if (normalizedEmail && normalizedEmail !== tenant.email?.toLowerCase().trim()) {
				await this.contactValidator.validateEmailUniqueness(
					normalizedEmail,
					updatedBy.companyId,
					this.tenantRepository,
					'um locatário',
					input.id,
				)
			}

			updateData.email = normalizedEmail
		}

		if (input.phone !== undefined) {
			updateData.phone = input.phone ? this.contactValidator.normalizePhone(input.phone) : null
		}

		if (input.address !== undefined) {
			updateData.address = input.address?.trim() || null
		}

		if (input.city !== undefined) {
			updateData.city = input.city?.trim() || null
		}

		if (input.state !== undefined) {
			updateData.state = input.state?.toUpperCase().trim() || null
		}

		if (input.zipCode !== undefined) {
			updateData.zipCode = input.zipCode
				? this.contactValidator.normalizeZipCode(input.zipCode)
				: null
		}

		if (input.birthDate !== undefined) {
			updateData.birthDate = input.birthDate || null
		}

		if (input.monthlyIncome !== undefined) {
			if (input.monthlyIncome !== null && input.monthlyIncome < 0) {
				throw new BadRequestError('Renda mensal não pode ser negativa.')
			}
			updateData.monthlyIncome = input.monthlyIncome || null
		}

		if (input.employer !== undefined) {
			updateData.employer = input.employer?.trim() || null
		}

		if (input.emergencyContact !== undefined) {
			updateData.emergencyContact = input.emergencyContact?.trim() || null
		}

		if (input.emergencyPhone !== undefined) {
			updateData.emergencyPhone = input.emergencyPhone
				? this.contactValidator.normalizePhone(input.emergencyPhone)
				: null
		}

		if (input.notes !== undefined) {
			updateData.notes = input.notes?.trim() || null
		}

		if (Object.keys(updateData).length === 0) {
			return tenant
		}

		try {
			const updatedTenant = await this.tenantRepository.update(input.id, updateData)

			if (!updatedTenant) {
				throw new InternalServerError('Erro ao atualizar locatário.')
			}

			logger.info(
				{
					tenantId: updatedTenant.id,
					updatedBy: updatedBy.id,
				},
				'Locatário atualizado com sucesso',
			)

			return updatedTenant
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof ForbiddenError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atualizar locatário')
			throw new InternalServerError('Erro ao atualizar locatário. Tente novamente.')
		}
	}
}
