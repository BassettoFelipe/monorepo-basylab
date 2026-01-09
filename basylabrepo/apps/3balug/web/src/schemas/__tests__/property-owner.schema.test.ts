import { describe, expect, it } from 'bun:test'

import {
	createPropertyOwnerSchema,
	editPropertyOwnerSchema,
	propertyOwnerBaseSchema,
} from '../property-owner.schema'

// Helper to create a valid base property owner data
const createValidBaseData = (overrides = {}) => ({
	name: 'Joao da Silva',
	documentType: 'cpf' as const,
	document: '123.456.789-00',
	phone: '(11) 99999-9999',
	...overrides,
})

describe('Property Owner Schema', () => {
	describe('propertyOwnerBaseSchema', () => {
		it('should validate a complete valid property owner', () => {
			const data = createValidBaseData()
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should require name with minimum 2 characters', () => {
			const data = createValidBaseData({ name: 'A' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name')
			}
		})

		it('should reject name with more than 100 characters', () => {
			const data = createValidBaseData({ name: 'a'.repeat(101) })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name')
			}
		})

		it('should require valid document type', () => {
			const data = createValidBaseData({ documentType: 'invalid' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should accept cpf as document type', () => {
			const data = createValidBaseData({ documentType: 'cpf' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should accept cnpj as document type', () => {
			const data = createValidBaseData({
				documentType: 'cnpj',
				document: '12.345.678/0001-00',
			})
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should require document', () => {
			const data = createValidBaseData({ document: '' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should require phone', () => {
			const data = createValidBaseData({ phone: '' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should accept valid email', () => {
			const data = createValidBaseData({ email: 'joao@email.com' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should reject invalid email', () => {
			const data = createValidBaseData({ email: 'invalid-email' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should accept empty string as email', () => {
			const data = createValidBaseData({ email: '' })
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should accept all valid marital status values', () => {
			const statuses = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'] as const
			for (const maritalStatus of statuses) {
				const data = createValidBaseData({ maritalStatus })
				const result = propertyOwnerBaseSchema.safeParse(data)
				expect(result.success).toBe(true)
			}
		})

		it('should accept optional fields as undefined', () => {
			const data = createValidBaseData({
				rg: undefined,
				nationality: undefined,
				maritalStatus: undefined,
				profession: undefined,
				email: undefined,
				phoneSecondary: undefined,
				zipCode: undefined,
				address: undefined,
				addressNumber: undefined,
				addressComplement: undefined,
				neighborhood: undefined,
				city: undefined,
				state: undefined,
				birthDate: undefined,
				notes: undefined,
			})
			const result = propertyOwnerBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})
	})

	describe('createPropertyOwnerSchema - Document Validation', () => {
		it('should validate CPF format correctly', () => {
			const data = createValidBaseData({
				documentType: 'cpf',
				document: '123.456.789-00',
			})
			const result = createPropertyOwnerSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should reject invalid CPF format', () => {
			const data = createValidBaseData({
				documentType: 'cpf',
				document: '12345678900', // Missing dots and dash
			})
			const result = createPropertyOwnerSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const documentError = result.error.issues.find((issue) => issue.path.includes('document'))
				expect(documentError).toBeDefined()
				expect(documentError?.message).toBe('Documento invalido')
			}
		})

		it('should reject CPF with wrong format', () => {
			const invalidCpfs = [
				'123.456.789-0', // Missing digit
				'123.456.78-00', // Wrong group size
				'12.456.789-00', // Wrong group size
				'123456789-00', // Missing dots
				'123.456.78900', // Missing dash
			]

			for (const document of invalidCpfs) {
				const data = createValidBaseData({
					documentType: 'cpf',
					document,
				})
				const result = createPropertyOwnerSchema.safeParse(data)
				expect(result.success).toBe(false)
			}
		})

		it('should validate CNPJ format correctly', () => {
			const data = createValidBaseData({
				documentType: 'cnpj',
				document: '12.345.678/0001-90',
			})
			const result = createPropertyOwnerSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should reject invalid CNPJ format', () => {
			const data = createValidBaseData({
				documentType: 'cnpj',
				document: '12345678000190', // Missing dots, slash and dash
			})
			const result = createPropertyOwnerSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const documentError = result.error.issues.find((issue) => issue.path.includes('document'))
				expect(documentError).toBeDefined()
				expect(documentError?.message).toBe('Documento invalido')
			}
		})

		it('should reject CNPJ with wrong format', () => {
			const invalidCnpjs = [
				'12.345.678/0001-9', // Missing digit
				'12.345.67/0001-90', // Wrong group size
				'1.345.678/0001-90', // Wrong group size
				'12345678/0001-90', // Missing dots
				'12.345.6780001-90', // Missing slash
				'12.345.678/000190', // Missing dash
			]

			for (const document of invalidCnpjs) {
				const data = createValidBaseData({
					documentType: 'cnpj',
					document,
				})
				const result = createPropertyOwnerSchema.safeParse(data)
				expect(result.success).toBe(false)
			}
		})

		it('should reject CPF format when document type is CNPJ', () => {
			const data = createValidBaseData({
				documentType: 'cnpj',
				document: '123.456.789-00', // CPF format
			})
			const result = createPropertyOwnerSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should reject CNPJ format when document type is CPF', () => {
			const data = createValidBaseData({
				documentType: 'cpf',
				document: '12.345.678/0001-90', // CNPJ format
			})
			const result = createPropertyOwnerSchema.safeParse(data)
			expect(result.success).toBe(false)
		})
	})

	describe('editPropertyOwnerSchema', () => {
		it('should have the same validation as createPropertyOwnerSchema', () => {
			const validData = createValidBaseData()
			const createResult = createPropertyOwnerSchema.safeParse(validData)
			const editResult = editPropertyOwnerSchema.safeParse(validData)

			expect(createResult.success).toBe(true)
			expect(editResult.success).toBe(true)
		})

		it('should apply same document validation as createPropertyOwnerSchema', () => {
			const data = createValidBaseData({
				documentType: 'cpf',
				document: 'invalid-cpf',
			})
			const result = editPropertyOwnerSchema.safeParse(data)
			expect(result.success).toBe(false)
		})
	})
})
