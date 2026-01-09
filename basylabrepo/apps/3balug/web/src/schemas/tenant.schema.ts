import { z } from 'zod'

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

/**
 * Base schema for tenant data (shared between create and edit)
 */
export const tenantBaseSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no maximo 100 caracteres'),
	cpf: z.string().min(1, 'CPF e obrigatorio').regex(cpfRegex, 'CPF invalido'),
	rg: z.string().optional(),
	birthDate: z.string().optional(),
	nationality: z.string().optional(),
	maritalStatus: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']).optional(),
	profession: z.string().optional(),
	email: z.string().email('Email invalido').optional().or(z.literal('')),
	phone: z.string().min(1, 'Telefone e obrigatorio'),
	zipCode: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	monthlyIncome: z.string().optional(),
	employer: z.string().optional(),
	emergencyContact: z.string().optional(),
	emergencyPhone: z.string().optional(),
	notes: z.string().optional(),
})

/**
 * Schema for creating a new tenant
 */
export const createTenantSchema = tenantBaseSchema

/**
 * Schema for editing an existing tenant
 */
export const editTenantSchema = tenantBaseSchema

export type CreateTenantFormData = z.infer<typeof createTenantSchema>
export type EditTenantFormData = z.infer<typeof editTenantSchema>
