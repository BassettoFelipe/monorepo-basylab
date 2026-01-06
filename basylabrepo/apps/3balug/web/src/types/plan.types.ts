export interface Plan {
	id: string
	name: string
	slug: 'basico' | 'imobiliaria' | 'house'
	description: string | null
	price: number
	maxUsers: number | null
	maxManagers: number
	maxSerasaQueries: number
	allowsLateCharges: boolean
	features: string[]
	createdAt: string
	updatedAt: string
}
