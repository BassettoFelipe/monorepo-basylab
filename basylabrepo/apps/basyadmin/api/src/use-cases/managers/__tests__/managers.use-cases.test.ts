import { beforeEach, describe, expect, it } from 'bun:test'
import { ConflictError, NotFoundError } from '@basylab/core/errors'
import { InMemoryTenantRepository, InMemoryUserRepository } from '@/test/in-memory-repositories'
import { createTestManager, createTestOwner, createTestTenant } from '@/test/test-helpers'
import { AssignTenantUseCase } from '../assign-tenant/assign-tenant.use-case'
import { CreateManagerUseCase } from '../create-manager/create-manager.use-case'
import { DeleteManagerUseCase } from '../delete-manager/delete-manager.use-case'
import { GetManagerUseCase } from '../get-manager/get-manager.use-case'
import { ListManagersUseCase } from '../list-managers/list-managers.use-case'
import { RemoveTenantUseCase } from '../remove-tenant/remove-tenant.use-case'
import { UpdateManagerUseCase } from '../update-manager/update-manager.use-case'

describe('Manager Use Cases', () => {
	let userRepository: InMemoryUserRepository
	let tenantRepository: InMemoryTenantRepository

	beforeEach(() => {
		userRepository = new InMemoryUserRepository()
		tenantRepository = new InMemoryTenantRepository()
	})

	describe('CreateManagerUseCase', () => {
		it('should create a manager successfully', async () => {
			const useCase = new CreateManagerUseCase(userRepository)

			const result = await useCase.execute({
				email: 'manager@example.com',
				name: 'Test Manager',
				password: 'password123',
			})

			expect(result.id).toBeDefined()
			expect(result.email).toBe('manager@example.com')
			expect(result.name).toBe('Test Manager')
			expect(result.role).toBe('manager')
			expect(result.isActive).toBe(true)
		})

		it('should throw ConflictError when email already exists', async () => {
			const existingManager = await createTestManager({ email: 'existing@example.com' })
			userRepository.seed([existingManager])

			const useCase = new CreateManagerUseCase(userRepository)

			await expect(
				useCase.execute({
					email: 'existing@example.com',
					name: 'New Manager',
					password: 'password123',
				}),
			).rejects.toThrow(ConflictError)
		})

		it('should normalize email to lowercase', async () => {
			const useCase = new CreateManagerUseCase(userRepository)

			const result = await useCase.execute({
				email: 'MANAGER@EXAMPLE.COM',
				name: 'Test Manager',
				password: 'password123',
			})

			expect(result.email).toBe('manager@example.com')
		})
	})

	describe('ListManagersUseCase', () => {
		it('should list all managers', async () => {
			const manager1 = await createTestManager({ name: 'Manager 1', email: 'm1@example.com' })
			const manager2 = await createTestManager({ name: 'Manager 2', email: 'm2@example.com' })
			userRepository.seed([manager1, manager2])

			const useCase = new ListManagersUseCase(userRepository)

			const result = await useCase.execute()

			expect(result).toHaveLength(2)
		})

		it('should only return managers, not owners', async () => {
			const manager = await createTestManager({ name: 'Manager', email: 'manager@example.com' })
			const owner = await createTestOwner({ name: 'Owner', email: 'owner@example.com' })
			userRepository.seed([manager, owner])

			const useCase = new ListManagersUseCase(userRepository)

			const result = await useCase.execute()

			expect(result).toHaveLength(1)
			expect(result[0].role).toBe('manager')
		})
	})

	describe('GetManagerUseCase', () => {
		it('should get manager by id', async () => {
			const manager = await createTestManager({ name: 'Test Manager' })
			userRepository.seed([manager])

			const useCase = new GetManagerUseCase(userRepository)

			const result = await useCase.execute({
				managerId: manager.id,
			})

			expect(result.id).toBe(manager.id)
			expect(result.name).toBe('Test Manager')
		})

		it('should throw NotFoundError when manager does not exist', async () => {
			const useCase = new GetManagerUseCase(userRepository)

			await expect(
				useCase.execute({
					managerId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw NotFoundError when user is not a manager', async () => {
			const owner = await createTestOwner({ name: 'Owner' })
			userRepository.seed([owner])

			const useCase = new GetManagerUseCase(userRepository)

			await expect(
				useCase.execute({
					managerId: owner.id,
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('UpdateManagerUseCase', () => {
		it('should update manager successfully', async () => {
			const manager = await createTestManager({ name: 'Old Name' })
			userRepository.seed([manager])

			const useCase = new UpdateManagerUseCase(userRepository)

			const result = await useCase.execute({
				managerId: manager.id,
				name: 'New Name',
			})

			expect(result.name).toBe('New Name')
		})

		it('should update manager email', async () => {
			const manager = await createTestManager({ email: 'old@example.com' })
			userRepository.seed([manager])

			const useCase = new UpdateManagerUseCase(userRepository)

			const result = await useCase.execute({
				managerId: manager.id,
				email: 'new@example.com',
			})

			expect(result.email).toBe('new@example.com')
		})

		it('should throw NotFoundError when manager does not exist', async () => {
			const useCase = new UpdateManagerUseCase(userRepository)

			await expect(
				useCase.execute({
					managerId: 'non-existent-id',
					name: 'New Name',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw ConflictError when new email already exists', async () => {
			const manager1 = await createTestManager({ email: 'manager1@example.com' })
			const manager2 = await createTestManager({ email: 'manager2@example.com' })
			userRepository.seed([manager1, manager2])

			const useCase = new UpdateManagerUseCase(userRepository)

			await expect(
				useCase.execute({
					managerId: manager1.id,
					email: 'manager2@example.com',
				}),
			).rejects.toThrow(ConflictError)
		})

		it('should update isActive status', async () => {
			const manager = await createTestManager({ isActive: true })
			userRepository.seed([manager])

			const useCase = new UpdateManagerUseCase(userRepository)

			const result = await useCase.execute({
				managerId: manager.id,
				isActive: false,
			})

			expect(result.isActive).toBe(false)
		})
	})

	describe('DeleteManagerUseCase', () => {
		it('should delete manager successfully', async () => {
			const manager = await createTestManager()
			userRepository.seed([manager])

			const useCase = new DeleteManagerUseCase(userRepository)

			const result = await useCase.execute({
				managerId: manager.id,
			})

			expect(result.success).toBe(true)

			const deletedManager = await userRepository.findById(manager.id)
			expect(deletedManager).toBeNull()
		})

		it('should throw NotFoundError when manager does not exist', async () => {
			const useCase = new DeleteManagerUseCase(userRepository)

			await expect(
				useCase.execute({
					managerId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('AssignTenantUseCase', () => {
		it('should assign tenant to manager', async () => {
			const manager = await createTestManager()
			const tenant = createTestTenant()
			userRepository.seed([manager])
			tenantRepository.seed([tenant])

			const useCase = new AssignTenantUseCase(userRepository, tenantRepository)

			const result = await useCase.execute({
				managerId: manager.id,
				tenantId: tenant.id,
			})

			expect(result.success).toBe(true)

			const isManager = await tenantRepository.isManagerOfTenant(manager.id, tenant.id)
			expect(isManager).toBe(true)
		})

		it('should throw NotFoundError when manager does not exist', async () => {
			const tenant = createTestTenant()
			tenantRepository.seed([tenant])

			const useCase = new AssignTenantUseCase(userRepository, tenantRepository)

			await expect(
				useCase.execute({
					managerId: 'non-existent-id',
					tenantId: tenant.id,
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw NotFoundError when tenant does not exist', async () => {
			const manager = await createTestManager()
			userRepository.seed([manager])

			const useCase = new AssignTenantUseCase(userRepository, tenantRepository)

			await expect(
				useCase.execute({
					managerId: manager.id,
					tenantId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('RemoveTenantUseCase', () => {
		it('should remove tenant from manager', async () => {
			const manager = await createTestManager()
			const tenant = createTestTenant()
			userRepository.seed([manager])
			tenantRepository.seed([tenant])
			await tenantRepository.assignManager(tenant.id, manager.id)

			const useCase = new RemoveTenantUseCase(userRepository, tenantRepository)

			const result = await useCase.execute({
				managerId: manager.id,
				tenantId: tenant.id,
			})

			expect(result.success).toBe(true)

			const isManager = await tenantRepository.isManagerOfTenant(manager.id, tenant.id)
			expect(isManager).toBe(false)
		})

		it('should throw NotFoundError when manager does not exist', async () => {
			const tenant = createTestTenant()
			tenantRepository.seed([tenant])

			const useCase = new RemoveTenantUseCase(userRepository, tenantRepository)

			await expect(
				useCase.execute({
					managerId: 'non-existent-id',
					tenantId: tenant.id,
				}),
			).rejects.toThrow(NotFoundError)
		})
	})
})
