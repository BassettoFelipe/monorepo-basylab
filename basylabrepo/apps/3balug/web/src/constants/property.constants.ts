import type { ListingType, PropertyStatus, PropertyType } from '@/types/property.types'

/**
 * Human-readable labels for property types
 */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
	house: 'Casa',
	apartment: 'Apartamento',
	land: 'Terreno',
	commercial: 'Comercial',
	rural: 'Rural',
}

/**
 * Human-readable labels for listing types
 */
export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
	rent: 'Locacao',
	sale: 'Venda',
	both: 'Ambos',
}

/**
 * Human-readable labels for property status
 */
export const STATUS_LABELS: Record<PropertyStatus, string> = {
	available: 'Disponivel',
	rented: 'Alugado',
	sold: 'Vendido',
	maintenance: 'Manutencao',
	unavailable: 'Indisponivel',
}

/**
 * Options for property type select/filter (with empty "all" option)
 */
export const PROPERTY_TYPE_OPTIONS = [
	{ value: '', label: 'Todos' },
	{ value: 'house', label: 'Casa' },
	{ value: 'apartment', label: 'Apartamento' },
	{ value: 'land', label: 'Terreno' },
	{ value: 'commercial', label: 'Comercial' },
	{ value: 'rural', label: 'Rural' },
]

/**
 * Options for listing type select/filter (with empty "all" option)
 */
export const LISTING_TYPE_OPTIONS = [
	{ value: '', label: 'Todas' },
	{ value: 'rent', label: 'Locacao' },
	{ value: 'sale', label: 'Venda' },
	{ value: 'both', label: 'Ambos' },
]

/**
 * Options for status select/filter (with empty "all" option)
 */
export const STATUS_OPTIONS = [
	{ value: '', label: 'Todos' },
	{ value: 'available', label: 'Disponivel' },
	{ value: 'rented', label: 'Alugado' },
	{ value: 'sold', label: 'Vendido' },
	{ value: 'maintenance', label: 'Manutencao' },
	{ value: 'unavailable', label: 'Indisponivel' },
]

/**
 * Options for status select (without empty option, for edit forms)
 */
export const STATUS_OPTIONS_NO_EMPTY = [
	{ value: 'available', label: 'Disponivel' },
	{ value: 'rented', label: 'Alugado' },
	{ value: 'sold', label: 'Vendido' },
	{ value: 'maintenance', label: 'Manutencao' },
	{ value: 'unavailable', label: 'Indisponivel' },
]

/**
 * Options for sort by select
 */
export const SORT_BY_OPTIONS = [
	{ value: 'title', label: 'Titulo' },
	{ value: 'createdAt', label: 'Data de cadastro' },
	{ value: 'rentalPrice', label: 'Preco de aluguel' },
	{ value: 'salePrice', label: 'Preco de venda' },
	{ value: 'city', label: 'Cidade' },
	{ value: 'area', label: 'Area' },
]

/**
 * Options for sort order select
 */
export const SORT_ORDER_OPTIONS = [
	{ value: 'asc', label: 'Crescente' },
	{ value: 'desc', label: 'Decrescente' },
]

/**
 * List of all property feature keys
 */
export const PROPERTY_FEATURE_KEYS = [
	'hasPool',
	'hasGarden',
	'hasGarage',
	'hasElevator',
	'hasGym',
	'hasPlayground',
	'hasSecurity',
	'hasAirConditioning',
	'hasFurnished',
	'hasPetFriendly',
	'hasBalcony',
	'hasBarbecue',
] as const

export type PropertyFeatureKey = (typeof PROPERTY_FEATURE_KEYS)[number]
