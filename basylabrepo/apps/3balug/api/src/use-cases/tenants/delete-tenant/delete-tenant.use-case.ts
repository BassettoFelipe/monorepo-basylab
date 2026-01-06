import { BadRequestError, InternalServerError, NotFoundError } from '@basylab/core/errors'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { IContractRepository } from '@/repositories/contracts/contract.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type DeleteTenantInput = {
	id: string
	deletedBy: User
}

type DeleteTenantOutput = {
	success: boolean
	message: string
}

export class DeleteTenantUseCase {
	constructor(
		private readonly tenantRepository: ITenantRepository,
		private readonly contractRepository: IContractRepository,
	) {}

	async execute(input: DeleteTenantInput): Promise<DeleteTenantOutput> {
		const { deletedBy } = input

		if (!deletedBy.companyId) {
			throw new InternalServerError('Usuário sem empresa vinculada.')
		}

		const tenant = await this.tenantRepository.findById(input.id)

		if (!tenant || tenant.companyId !== deletedBy.companyId) {
			throw new NotFoundError('Locatário não encontrado.')
		}

		const activeContractsCount = await this.contractRepository.countActiveByTenantId(input.id)

		if (activeContractsCount > 0) {
			throw new BadRequestError(
				`Não é possível excluir este locatário. Existem ${activeContractsCount} contrato(s) ativo(s) vinculado(s).`,
			)
		}

		const totalContractsCount = await this.contractRepository.countByTenantId(input.id)

		if (totalContractsCount > 0) {
			throw new BadRequestError(
				`Não é possível excluir este locatário. Existem ${totalContractsCount} contrato(s) vinculado(s) no histórico.`,
			)
		}

		try {
			const deleted = await this.tenantRepository.delete(input.id)

			if (!deleted) {
				throw new InternalServerError('Erro ao excluir locatário.')
			}

			logger.info(
				{
					tenantId: input.id,
					deletedBy: deletedBy.id,
				},
				'Locatário excluído com sucesso',
			)

			return {
				success: true,
				message: 'Locatário excluído com sucesso.',
			}
		} catch (error) {
			if (error instanceof BadRequestError || error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao excluir locatário')
			throw new InternalServerError('Erro ao excluir locatário. Tente novamente.')
		}
	}
}
