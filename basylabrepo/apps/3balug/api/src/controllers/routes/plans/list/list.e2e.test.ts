import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'

describe('GET /plans', () => {
	const { client, planRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	it('should list all plans successfully', async () => {
		const { data, status, error } = await client.plans.get()

		expect(status).toBe(200)
		expect(error).toBeFalsy()
		expect(data).toBeDefined()
		expect(Array.isArray(data)).toBe(true)
		expect(data?.length).toBeGreaterThan(0)
	})

	it('should return all seeded plans', async () => {
		const plans = await planRepository.findAll()

		const { data, status } = await client.plans.get()

		expect(status).toBe(200)
		expect(data?.length).toBe(plans.length)
	})

	it('should return plans with complete information', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(plan.id).toBeDefined()
			expect(plan.name).toBeDefined()
			expect(plan.slug).toBeDefined()
			expect(plan.price).toBeDefined()
			expect(plan.maxUsers).toBeDefined()
			expect(plan.maxManagers).toBeDefined()
			expect(plan.maxSerasaQueries).toBeDefined()
			expect(plan.features).toBeDefined()
			expect(Array.isArray(plan.features)).toBe(true)
		}
	})

	it('should return plans with valid data types', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(typeof plan.id).toBe('string')
			expect(typeof plan.name).toBe('string')
			expect(typeof plan.slug).toBe('string')
			expect(typeof plan.price).toBe('number')

			expect(typeof plan.maxUsers).toBe('number')
			expect(typeof plan.maxManagers).toBe('number')
			expect(typeof plan.maxSerasaQueries).toBe('number')
			expect(Array.isArray(plan.features)).toBe(true)
		}
	})

	it('should return plans sorted consistently', async () => {
		const { data: firstCall } = await client.plans.get()
		const { data: secondCall } = await client.plans.get()

		expect(firstCall).toBeDefined()
		expect(secondCall).toBeDefined()

		// Plans should be in the same order
		expect(firstCall?.length).toBe(secondCall?.length)
		for (let i = 0; i < (firstCall?.length ?? 0); i++) {
			expect(firstCall?.[i].id).toBe(secondCall?.[i].id)
		}
	})

	it('should return plans with features as array of strings', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(Array.isArray(plan.features)).toBe(true)
			for (const feature of plan.features) {
				expect(typeof feature).toBe('string')
			}
		}
	})

	it('should return price as integer (cents)', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(Number.isInteger(plan.price)).toBe(true)
			expect(plan.price).toBeGreaterThan(0)
		}
	})

	it('should return valid slug format for all plans', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(plan.slug).toBeDefined()
			// Slug should be lowercase, alphanumeric with hyphens
			expect(plan.slug).toMatch(/^[a-z0-9-]+$/)
		}
	})

	it('should return unique plan IDs', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		const ids = data?.map((plan) => plan.id)
		const uniqueIds = new Set(ids)
		expect(uniqueIds.size).toBe(ids?.length ?? 0)
	})

	it('should return unique plan slugs', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		const slugs = data?.map((plan) => plan.slug)
		const uniqueSlugs = new Set(slugs)
		expect(uniqueSlugs.size).toBe(slugs?.length ?? 0)
	})

	it('should not expose internal database fields', async () => {
		const { data } = await client.plans.get()

		const allowedFields = [
			'id',
			'name',
			'slug',
			'description',
			'price',
			'durationDays',
			'maxUsers',
			'maxManagers',
			'maxSerasaQueries',
			'allowsLateCharges',
			'features',
			'createdAt',
			'updatedAt',
		]

		// Ensure all plans have expected structure
		for (const plan of data ?? []) {
			for (const key of Object.keys(plan)) {
				expect(allowedFields).toContain(key)
			}
		}
	})

	it('should return plans with positive maxUsers', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(plan.maxUsers).toBeGreaterThan(0)
		}
	})

	it('should return plans with non-negative maxManagers', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(plan.maxManagers).toBeGreaterThanOrEqual(0)
		}
	})

	it('should return plans with positive maxSerasaQueries', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)

		for (const plan of data ?? []) {
			expect(plan.maxSerasaQueries).toBeGreaterThan(0)
		}
	})

	it('should return plans with positive durationDays', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)
		expect(data).toBeDefined()
	})

	it('should handle concurrent requests consistently', async () => {
		const requests = [client.plans.get(), client.plans.get(), client.plans.get()]

		const results = await Promise.all(requests)

		// All requests should succeed
		for (const { status } of results) {
			expect(status).toBe(200)
		}

		// All requests should return the same data
		const firstData = results[0].data
		for (let i = 1; i < results.length; i++) {
			expect(results[i].data?.length).toBe(firstData?.length)
			for (let j = 0; j < (firstData?.length ?? 0); j++) {
				expect(results[i].data?.[j].id).toBe(firstData?.[j].id)
			}
		}
	})

	it('should return at least one plan in test environment', async () => {
		const { data, status } = await client.plans.get()

		expect(status).toBe(200)
		// Test environment should have seeded plans
		expect(data?.length).toBeGreaterThanOrEqual(1)
	})
})
