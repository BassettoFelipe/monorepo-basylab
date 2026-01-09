import { z } from 'zod'

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

/**
 * Base schema for property owner data (shared between create and edit)
 */
export const propertyOwnerBaseSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no maximo 100 caracteres'),
	documentType: z.enum(['cpf', 'cnpj'], {
		message: 'Selecione o tipo de documento',
	}),
	document: z.string().min(1, 'Documento e obrigatorio'),
	rg: z.string().optional(),
	nationality: z.string().optional(),
	maritalStatus: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']).optional(),
	profession: z.string().optional(),
	email: z.string().email('Email invalido').optional().or(z.literal('')),
	phone: z.string().min(1, 'Telefone e obrigatorio'),
	phoneSecondary: z.string().optional(),
	zipCode: z.string().optional(),
	address: z.string().optional(),
	addressNumber: z.string().optional(),
	addressComplement: z.string().optional(),
	neighborhood: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	birthDate: z.string().optional(),
	notes: z.string().optional(),
})

/**
 * Schema for creating a new property owner
 */
export const createPropertyOwnerSchema = propertyOwnerBaseSchema.refine(
	(data) => {
		if (data.documentType === 'cpf') {
			return cpfRegex.test(data.document)
		}
		return cnpjRegex.test(data.document)
	},
	{
		message: 'Documento invalido',
		path: ['document'],
	},
)

/**
 * Schema for editing an existing property owner (same as create for now)
 */
export const editPropertyOwnerSchema = propertyOwnerBaseSchema.refine(
	(data) => {
		if (data.documentType === 'cpf') {
			return cpfRegex.test(data.document)
		}
		return cnpjRegex.test(data.document)
	},
	{
		message: 'Documento invalido',
		path: ['document'],
	},
)

export type CreatePropertyOwnerFormData = z.infer<typeof createPropertyOwnerSchema>
export type EditPropertyOwnerFormData = z.infer<typeof editPropertyOwnerSchema>
