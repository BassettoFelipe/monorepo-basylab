import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { BadRequestError, InternalServerError, NotFoundError } from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { PropertyOwner } from '@/db/schema/property-owners'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryPropertyOwnerRepository,
	InMemoryPropertyRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { DeletePropertyOwnerUseCase } from './delete-property-owner.use-case'

describe('DeletePropertyOwnerUseCase', () => {
	let useCase: DeletePropertyOwnerUseCase
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let propertyRepository: InMemoryPropertyRepository
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository

	let ownerUser: User
	let company: Company
	let existingPropertyOwner: PropertyOwner

	beforeEach(async () => {
		// Setup repositories
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		propertyRepository = new InMemoryPropertyRepository()
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()

		// Create use case
		useCase = new DeletePropertyOwnerUseCase(propertyOwnerRepository, propertyRepository)

		// Create owner user
		ownerUser = await userRepository.create({
			email: 'owner@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Owner User',
			role: USER_ROLES.OWNER,
			isActive: true,
			isEmailVerified: true,
		})

		// Create company
		company = await companyRepository.create({
			name: 'Test Company',
			ownerId: ownerUser.id,
			email: 'owner@test.com',
		})

		// Link owner to company
		ownerUser = (await userRepository.update(ownerUser.id, {
			companyId: company.id,
		})) as User

		// Create existing property owner
		existingPropertyOwner = await propertyOwnerRepository.create({
			name: 'João Silva Proprietário',
			documentType: 'cpf',
			document: '81105850439',
			email: 'joao.owner@example.com',
			companyId: company.id,
			createdBy: ownerUser.id,
		})
	})

	describe('Caso de Sucesso', () => {
		test('deve excluir proprietário sem imóveis vinculados', async () => {
			const result = await useCase.execute({
				id: existingPropertyOwner.id,
				deletedBy: ownerUser,
			})

			expect(result.success).toBe(true)
			expect(result.message).toBe('Proprietário excluído com sucesso.')

			// Verificar que foi realmente excluído
			const deletedOwner = await propertyOwnerRepository.findById(existingPropertyOwner.id)
			expect(deletedOwner).toBeNull()
		})

		test('deve retornar mensagem de sucesso após exclusão', async () => {
			const result = await useCase.execute({
				id: existingPropertyOwner.id,
				deletedBy: ownerUser,
			})

			expect(result).toEqual({
				success: true,
				message: 'Proprietário excluído com sucesso.',
			})
		})
	})

	describe('Validações de Erro', () => {
		test('deve lançar erro se usuário não tem empresa vinculada', async () => {
			const userWithoutCompany = await userRepository.create({
				email: 'orphan@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Orphan User',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					id: existingPropertyOwner.id,
					deletedBy: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada.'))
		})

		test('deve lançar erro se proprietário não existe', async () => {
			await expect(
				useCase.execute({
					id: 'non-existent-id',
					deletedBy: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Proprietário não encontrado.'))
		})

		test('deve lançar erro se proprietário pertence a outra empresa', async () => {
			// Criar outra empresa
			const otherOwner = await userRepository.create({
				email: 'other@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Other Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				ownerId: otherOwner.id,
				email: 'other@test.com',
			})

			const updatedOtherOwner = (await userRepository.update(otherOwner.id, {
				companyId: otherCompany.id,
			})) as User

			await expect(
				useCase.execute({
					id: existingPropertyOwner.id,
					deletedBy: updatedOtherOwner,
				}),
			).rejects.toThrow(new NotFoundError('Proprietário não encontrado.'))
		})
	})

	describe('Validação de Imóveis Vinculados', () => {
		test('deve lançar erro se existem imóveis vinculados ao proprietário', async () => {
			// Criar 1 imóvel vinculado ao proprietário
			await propertyRepository.create({
				companyId: company.id,
				ownerId: existingPropertyOwner.id,
				address: 'Rua Teste, 123',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234567',
				bedrooms: 2,
				bathrooms: 1,
				parkingSpaces: 1,
				area: 100,
				rentalPrice: 1000,
				title: 'Imóvel de Teste',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					id: existingPropertyOwner.id,
					deletedBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError(
					'Não é possível excluir este proprietário. Existem 1 imóvel(is) vinculado(s).',
				),
			)

			// Verificar que o proprietário NÃO foi excluído
			const owner = await propertyOwnerRepository.findById(existingPropertyOwner.id)
			expect(owner).not.toBeNull()
		})

		test('deve incluir a quantidade correta de imóveis na mensagem de erro (singular)', async () => {
			// Criar 1 imóvel
			await propertyRepository.create({
				companyId: company.id,
				ownerId: existingPropertyOwner.id,
				address: 'Rua Teste, 123',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234567',
				bedrooms: 2,
				bathrooms: 1,
				parkingSpaces: 1,
				area: 100,
				rentalPrice: 1000,
				title: 'Imóvel de Teste',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					id: existingPropertyOwner.id,
					deletedBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError(
					'Não é possível excluir este proprietário. Existem 1 imóvel(is) vinculado(s).',
				),
			)
		})

		test('deve incluir a quantidade correta de imóveis na mensagem de erro (plural)', async () => {
			// Criar 3 imóveis vinculados
			await propertyRepository.create({
				companyId: company.id,
				ownerId: existingPropertyOwner.id,
				address: 'Rua Teste, 123',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234567',
				bedrooms: 2,
				bathrooms: 1,
				parkingSpaces: 1,
				area: 100,
				rentalPrice: 1000,
				title: 'Imóvel de Teste',
				createdBy: ownerUser.id,
			})

			await propertyRepository.create({
				companyId: company.id,
				ownerId: existingPropertyOwner.id,
				address: 'Av Principal, 456',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234567',
				bedrooms: 3,
				bathrooms: 2,
				parkingSpaces: 2,
				area: 150,
				rentalPrice: 2000,
				title: 'Imóvel de Teste 2',
				createdBy: ownerUser.id,
			})

			await propertyRepository.create({
				companyId: company.id,
				ownerId: existingPropertyOwner.id,
				address: 'Praça Central, 789',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234567',
				bedrooms: 1,
				bathrooms: 1,
				parkingSpaces: 0,
				area: 50,
				rentalPrice: 800,
				title: 'Imóvel de Teste 3',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					id: existingPropertyOwner.id,
					deletedBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError(
					'Não é possível excluir este proprietário. Existem 3 imóvel(is) vinculado(s).',
				),
			)
		})

		test('deve bloquear exclusão mesmo com apenas 1 imóvel', async () => {
			await propertyRepository.create({
				companyId: company.id,
				ownerId: existingPropertyOwner.id,
				address: 'Rua Única, 100',
				city: 'Rio de Janeiro',
				state: 'RJ',
				zipCode: '20000000',
				bedrooms: 2,
				bathrooms: 1,
				parkingSpaces: 1,
				area: 80,
				rentalPrice: 1500,
				title: 'Imóvel de Teste 4',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					id: existingPropertyOwner.id,
					deletedBy: ownerUser,
				}),
			).rejects.toThrow(BadRequestError)

			// Verificar que o proprietário NÃO foi excluído
			const owner = await propertyOwnerRepository.findById(existingPropertyOwner.id)
			expect(owner).not.toBeNull()
			expect(owner?.name).toBe('João Silva Proprietário')
		})
	})

	describe('Isolamento por Empresa', () => {
		test('não deve considerar imóveis de outras empresas', async () => {
			// Criar outra empresa
			const otherOwner = await userRepository.create({
				email: 'other@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Other Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				ownerId: otherOwner.id,
				email: 'other@test.com',
			})

			const updatedOtherOwner = (await userRepository.update(otherOwner.id, {
				companyId: otherCompany.id,
			})) as User

			// Criar proprietário na outra empresa
			const otherPropertyOwner = await propertyOwnerRepository.create({
				name: 'Proprietário de Outra Empresa',
				documentType: 'cpf',
				document: '99690852981',
				companyId: otherCompany.id,
				createdBy: updatedOtherOwner.id,
			})

			// Criar imóvel para o proprietário da outra empresa
			await propertyRepository.create({
				companyId: otherCompany.id,
				ownerId: otherPropertyOwner.id,
				address: 'Imóvel Outra Empresa',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234567',
				bedrooms: 2,
				bathrooms: 1,
				parkingSpaces: 1,
				area: 100,
				rentalPrice: 1000,
				title: 'Imóvel de Teste',
				createdBy: updatedOtherOwner.id,
			})

			// Deve conseguir excluir proprietário da primeira empresa (sem imóveis)
			const result = await useCase.execute({
				id: existingPropertyOwner.id,
				deletedBy: ownerUser,
			})

			expect(result.success).toBe(true)
			expect(result.message).toBe('Proprietário excluído com sucesso.')

			// Verificar que foi realmente excluído
			const deletedOwner = await propertyOwnerRepository.findById(existingPropertyOwner.id)
			expect(deletedOwner).toBeNull()

			// Verificar que o proprietário da outra empresa ainda existe
			const otherOwnerStillExists = await propertyOwnerRepository.findById(otherPropertyOwner.id)
			expect(otherOwnerStillExists).not.toBeNull()
		})
	})

	describe('Tratamento de Erros', () => {
		test('deve retornar InternalServerError se delete falhar', async () => {
			// Criar mock que simula falha no delete
			const originalDelete = propertyOwnerRepository.delete.bind(propertyOwnerRepository)
			propertyOwnerRepository.delete = async () => false

			await expect(
				useCase.execute({
					id: existingPropertyOwner.id,
					deletedBy: ownerUser,
				}),
			).rejects.toThrow(new InternalServerError('Erro ao excluir proprietário. Tente novamente.'))

			// Restaurar método original
			propertyOwnerRepository.delete = originalDelete
		})
	})
})
