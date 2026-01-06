import { beforeEach, describe, expect, it } from 'bun:test'
import { BadRequestError, ConflictError, NotFoundError } from '@basylab/core/errors'
import { InMemoryTenantRepository } from '@/test/in-memory-repositories'
import { createTestTenant } from '@/test/test-helpers'
import { CreateTenantUseCase } from '../create-tenant/create-tenant.use-case'
import { DeleteTenantUseCase } from '../delete-tenant/delete-tenant.use-case'
import { GetTenantUseCase } from '../get-tenant/get-tenant.use-case'
import { ListTenantsUseCase } from '../list-tenants/list-tenants.use-case'
import { RegenerateApiKeyUseCase } from '../regenerate-api-key/regenerate-api-key.use-case'
import { UpdateTenantUseCase } from '../update-tenant/update-tenant.use-case'

describe('Tenant Use Cases', () => {
	let tenantRepository: InMemoryTenantRepository

	beforeEach(() => {
		tenantRepository = new InMemoryTenantRepository()
	})

	describe('CreateTenantUseCase', () => {
		it('should create a tenant successfully', async () => {
			const useCase = new CreateTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				name: 'Test Tenant',
				slug: 'test-tenant',
				description: 'A test tenant',
			})

			expect(result.id).toBeDefined()
			expect(result.name).toBe('Test Tenant')
			expect(result.slug).toBe('test-tenant')
			expect(result.description).toBe('A test tenant')
			expect(result.apiKey).toBeDefined()
			expect(result.isActive).toBe(true)
		})

		it('should normalize slug to lowercase', async () => {
			const useCase = new CreateTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				name: 'Test Tenant',
				slug: 'TEST-TENANT',
			})

			expect(result.slug).toBe('test-tenant')
		})

		it('should throw BadRequestError when name is empty', async () => {
			const useCase = new CreateTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					name: '',
					slug: 'test-tenant',
				}),
			).rejects.toThrow(BadRequestError)
		})

		it('should throw BadRequestError when slug is empty', async () => {
			const useCase = new CreateTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					name: 'Test Tenant',
					slug: '',
				}),
			).rejects.toThrow(BadRequestError)
		})

		it('should throw ConflictError when slug already exists', async () => {
			const existingTenant = createTestTenant({ slug: 'existing-slug' })
			tenantRepository.seed([existingTenant])

			const useCase = new CreateTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					name: 'Test Tenant',
					slug: 'existing-slug',
				}),
			).rejects.toThrow(ConflictError)
		})
	})

	describe('ListTenantsUseCase', () => {
		it('should list all tenants for owner', async () => {
			const tenant1 = createTestTenant({ name: 'Tenant 1', slug: 'tenant-1' })
			const tenant2 = createTestTenant({ name: 'Tenant 2', slug: 'tenant-2' })
			tenantRepository.seed([tenant1, tenant2])

			const useCase = new ListTenantsUseCase(tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(2)
		})

		it('should filter tenants by search for owner', async () => {
			const tenant1 = createTestTenant({ name: 'Alpha Tenant', slug: 'alpha' })
			const tenant2 = createTestTenant({ name: 'Beta Tenant', slug: 'beta' })
			tenantRepository.seed([tenant1, tenant2])

			const useCase = new ListTenantsUseCase(tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				search: 'alpha',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Alpha Tenant')
		})

		it('should only return managed tenants for manager', async () => {
			const tenant1 = createTestTenant({ name: 'Managed Tenant', slug: 'managed' })
			const tenant2 = createTestTenant({ name: 'Other Tenant', slug: 'other' })
			tenantRepository.seed([tenant1, tenant2])

			const managerId = 'manager-id'
			await tenantRepository.assignManager(tenant1.id, managerId)

			const useCase = new ListTenantsUseCase(tenantRepository)

			const result = await useCase.execute({
				userRole: 'manager',
				userId: managerId,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Managed Tenant')
		})

		it('should apply pagination', async () => {
			const tenants = Array.from({ length: 5 }, (_, i) =>
				createTestTenant({ name: `Tenant ${i}`, slug: `tenant-${i}` }),
			)
			tenantRepository.seed(tenants)

			const useCase = new ListTenantsUseCase(tenantRepository)

			const result = await useCase.execute({
				userRole: 'owner',
				userId: 'owner-id',
				limit: 2,
				offset: 0,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(5)
			expect(result.limit).toBe(2)
			expect(result.offset).toBe(0)
		})
	})

	describe('GetTenantUseCase', () => {
		it('should get tenant by id for owner', async () => {
			const tenant = createTestTenant({ name: 'Test Tenant' })
			tenantRepository.seed([tenant])

			const useCase = new GetTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				userRole: 'owner',
				userId: 'owner-id',
			})

			expect(result.id).toBe(tenant.id)
			expect(result.name).toBe('Test Tenant')
		})

		it('should get tenant by id for manager with access', async () => {
			const tenant = createTestTenant({ name: 'Test Tenant' })
			tenantRepository.seed([tenant])

			const managerId = 'manager-id'
			await tenantRepository.assignManager(tenant.id, managerId)

			const useCase = new GetTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				userRole: 'manager',
				userId: managerId,
			})

			expect(result.id).toBe(tenant.id)
		})

		it('should throw NotFoundError when tenant does not exist', async () => {
			const useCase = new GetTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					tenantId: 'non-existent-id',
					userRole: 'owner',
					userId: 'owner-id',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw NotFoundError when manager has no access', async () => {
			const tenant = createTestTenant({ name: 'Test Tenant' })
			tenantRepository.seed([tenant])

			const useCase = new GetTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					tenantId: tenant.id,
					userRole: 'manager',
					userId: 'manager-without-access',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('UpdateTenantUseCase', () => {
		it('should update tenant successfully', async () => {
			const tenant = createTestTenant({ name: 'Old Name' })
			tenantRepository.seed([tenant])

			const useCase = new UpdateTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				name: 'New Name',
				description: 'New description',
			})

			expect(result.name).toBe('New Name')
			expect(result.description).toBe('New description')
		})

		it('should update slug when different', async () => {
			const tenant = createTestTenant({ slug: 'old-slug' })
			tenantRepository.seed([tenant])

			const useCase = new UpdateTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				slug: 'new-slug',
			})

			expect(result.slug).toBe('new-slug')
		})

		it('should throw NotFoundError when tenant does not exist', async () => {
			const useCase = new UpdateTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					tenantId: 'non-existent-id',
					name: 'New Name',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw ConflictError when new slug already exists', async () => {
			const tenant1 = createTestTenant({ slug: 'tenant-1' })
			const tenant2 = createTestTenant({ slug: 'tenant-2' })
			tenantRepository.seed([tenant1, tenant2])

			const useCase = new UpdateTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					tenantId: tenant1.id,
					slug: 'tenant-2',
				}),
			).rejects.toThrow(ConflictError)
		})

		it('should allow updating to same slug', async () => {
			const tenant = createTestTenant({ slug: 'same-slug' })
			tenantRepository.seed([tenant])

			const useCase = new UpdateTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				slug: 'same-slug',
				name: 'New Name',
			})

			expect(result.slug).toBe('same-slug')
			expect(result.name).toBe('New Name')
		})

		it('should update isActive status', async () => {
			const tenant = createTestTenant({ isActive: true })
			tenantRepository.seed([tenant])

			const useCase = new UpdateTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				isActive: false,
			})

			expect(result.isActive).toBe(false)
		})
	})

	describe('DeleteTenantUseCase', () => {
		it('should delete tenant successfully', async () => {
			const tenant = createTestTenant()
			tenantRepository.seed([tenant])

			const useCase = new DeleteTenantUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
			})

			expect(result.success).toBe(true)

			const deletedTenant = await tenantRepository.findById(tenant.id)
			expect(deletedTenant).toBeNull()
		})

		it('should throw NotFoundError when tenant does not exist', async () => {
			const useCase = new DeleteTenantUseCase(tenantRepository)

			await expect(
				useCase.execute({
					tenantId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('RegenerateApiKeyUseCase', () => {
		it('should regenerate API key successfully', async () => {
			const tenant = createTestTenant({ apiKey: 'old-api-key' })
			tenantRepository.seed([tenant])

			const useCase = new RegenerateApiKeyUseCase(tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
			})

			expect(result.apiKey).toBeDefined()
			expect(result.apiKey).not.toBe('old-api-key')
		})

		it('should throw NotFoundError when tenant does not exist', async () => {
			const useCase = new RegenerateApiKeyUseCase(tenantRepository)

			await expect(
				useCase.execute({
					tenantId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})
})
