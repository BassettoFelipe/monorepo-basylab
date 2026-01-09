import { Building2, Camera, DollarSign, Globe, Home, MapPin, Settings, User } from 'lucide-react'
import type { ReactNode } from 'react'

import type { PropertyType } from '@/types/property.types'

export interface WizardStep {
	id: string
	title: string
	description: string
	icon: ReactNode
}

/**
 * All possible steps for property wizard
 */
export const PROPERTY_WIZARD_STEPS: WizardStep[] = [
	{
		id: 'owner',
		title: 'Proprietario',
		description: 'Selecione o proprietario do imovel',
		icon: <User size={16} />,
	},
	{
		id: 'type',
		title: 'Categoria',
		description: 'Tipo e finalidade do imovel',
		icon: <Building2 size={16} />,
	},
	{
		id: 'details',
		title: 'Detalhes',
		description: 'Informacoes basicas do imovel',
		icon: <Home size={16} />,
	},
	{
		id: 'address',
		title: 'Endereco',
		description: 'Localizacao do imovel',
		icon: <MapPin size={16} />,
	},
	{
		id: 'pricing',
		title: 'Valores',
		description: 'Precos e comissao',
		icon: <DollarSign size={16} />,
	},
	{
		id: 'features',
		title: 'Extras',
		description: 'Caracteristicas do imovel',
		icon: <Settings size={16} />,
	},
	{
		id: 'photos',
		title: 'Fotos',
		description: 'Imagens do imovel',
		icon: <Camera size={16} />,
	},
	{
		id: 'publish',
		title: 'Publicacao',
		description: 'Configuracoes de publicacao',
		icon: <Globe size={16} />,
	},
]

/**
 * Get the appropriate steps based on property type
 * For 'land' properties, the features step is excluded
 *
 * @param type - The property type
 * @returns Array of wizard steps appropriate for the property type
 */
export function getPropertyStepsForType(type: PropertyType): WizardStep[] {
	if (type === 'land') {
		return PROPERTY_WIZARD_STEPS.filter((step) => step.id !== 'features')
	}
	return PROPERTY_WIZARD_STEPS
}
