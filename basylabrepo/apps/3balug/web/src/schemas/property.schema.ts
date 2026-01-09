import { z } from 'zod'

import { getCurrencyRawValue } from '@/utils/masks'

/**
 * Schema for property features (amenities)
 */
export const propertyFeaturesSchema = z.object({
	hasPool: z.boolean().optional(),
	hasGarden: z.boolean().optional(),
	hasGarage: z.boolean().optional(),
	hasElevator: z.boolean().optional(),
	hasGym: z.boolean().optional(),
	hasPlayground: z.boolean().optional(),
	hasSecurity: z.boolean().optional(),
	hasAirConditioning: z.boolean().optional(),
	hasFurnished: z.boolean().optional(),
	hasPetFriendly: z.boolean().optional(),
	hasBalcony: z.boolean().optional(),
	hasBarbecue: z.boolean().optional(),
})

/**
 * Base schema for property data (shared between create and edit)
 */
export const propertyBaseSchema = z.object({
	// Owner
	ownerId: z.string().min(1, 'Proprietario e obrigatorio'),

	// Property type
	type: z.enum(['house', 'apartment', 'land', 'commercial', 'rural'], {
		message: 'Selecione o tipo do imovel',
	}),
	listingType: z.enum(['rent', 'sale', 'both'], {
		message: 'Selecione a finalidade',
	}),

	// Basic information
	title: z
		.string()
		.min(3, 'Titulo deve ter pelo menos 3 caracteres')
		.max(200, 'Titulo deve ter no maximo 200 caracteres'),
	description: z.string().optional(),
	bedrooms: z.string().optional(),
	bathrooms: z.string().optional(),
	suites: z.string().optional(),
	parkingSpaces: z.string().optional(),
	area: z.string().optional(),
	floor: z.string().optional(),
	totalFloors: z.string().optional(),

	// Address
	zipCode: z.string().optional(),
	address: z.string().min(1, 'Endereco e obrigatorio'),
	addressNumber: z.string().min(1, 'Numero e obrigatorio'),
	addressComplement: z.string().optional(),
	neighborhood: z.string().min(1, 'Bairro e obrigatorio'),
	city: z.string().min(1, 'Cidade e obrigatoria'),
	state: z.string().min(1, 'Estado e obrigatorio').max(2, 'Use a sigla do estado (ex: SP)'),

	// Pricing
	rentalPrice: z.string().optional(),
	salePrice: z.string().optional(),
	iptuPrice: z.string().optional(),
	condoFee: z.string().optional(),
	commissionPercentage: z.string().optional(),

	// Features
	...propertyFeaturesSchema.shape,

	// Publishing
	isMarketplace: z.boolean().optional(),
	notes: z.string().optional(),
})

/**
 * Helper function to validate price fields
 * Checks if the value exists and is greater than 0
 */
const isValidPrice = (price: string | undefined): boolean => {
	if (!price || price.trim() === '') return false
	const rawValue = getCurrencyRawValue(price)
	return rawValue > 0
}

/**
 * Schema for creating a new property
 */
export const createPropertySchema = propertyBaseSchema
	.refine(
		(data) => {
			if (data.listingType === 'rent' || data.listingType === 'both') {
				return isValidPrice(data.rentalPrice)
			}
			return true
		},
		{
			message: 'Preco de aluguel e obrigatorio para locacao',
			path: ['rentalPrice'],
		},
	)
	.refine(
		(data) => {
			if (data.listingType === 'sale' || data.listingType === 'both') {
				return isValidPrice(data.salePrice)
			}
			return true
		},
		{
			message: 'Preco de venda e obrigatorio para venda',
			path: ['salePrice'],
		},
	)

/**
 * Edit property base schema (includes status field)
 */
const editPropertyBaseSchema = propertyBaseSchema.extend({
	status: z.enum(['available', 'rented', 'sold', 'maintenance', 'unavailable'], {
		message: 'Selecione o status',
	}),
})

/**
 * Schema for editing an existing property (includes status field)
 */
export const editPropertySchema = editPropertyBaseSchema
	.refine(
		(data) => {
			if (data.listingType === 'rent' || data.listingType === 'both') {
				return isValidPrice(data.rentalPrice)
			}
			return true
		},
		{
			message: 'Preco de aluguel e obrigatorio para locacao',
			path: ['rentalPrice'],
		},
	)
	.refine(
		(data) => {
			if (data.listingType === 'sale' || data.listingType === 'both') {
				return isValidPrice(data.salePrice)
			}
			return true
		},
		{
			message: 'Preco de venda e obrigatorio para venda',
			path: ['salePrice'],
		},
	)

export type CreatePropertyFormData = z.infer<typeof createPropertySchema>
export type EditPropertyFormData = z.infer<typeof editPropertySchema>
