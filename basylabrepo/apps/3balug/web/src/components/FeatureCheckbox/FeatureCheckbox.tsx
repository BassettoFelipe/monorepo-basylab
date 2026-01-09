import {
	AirVent,
	Armchair,
	Baby,
	Building2,
	Car,
	Dumbbell,
	Flame,
	Flower2,
	Home,
	PawPrint,
	Shield,
	Waves,
} from 'lucide-react'
import type { ReactNode } from 'react'
import * as styles from './FeatureCheckbox.css'

export type FeatureKey =
	| 'hasPool'
	| 'hasGarden'
	| 'hasGarage'
	| 'hasElevator'
	| 'hasGym'
	| 'hasPlayground'
	| 'hasSecurity'
	| 'hasAirConditioning'
	| 'hasFurnished'
	| 'hasPetFriendly'
	| 'hasBalcony'
	| 'hasBarbecue'

interface FeatureConfig {
	key: FeatureKey
	label: string
	icon: ReactNode
}

export const PROPERTY_FEATURES: FeatureConfig[] = [
	{ key: 'hasPool', label: 'Piscina', icon: <Waves size={28} /> },
	{ key: 'hasGarden', label: 'Jardim', icon: <Flower2 size={28} /> },
	{ key: 'hasGarage', label: 'Garagem', icon: <Car size={28} /> },
	{ key: 'hasElevator', label: 'Elevador', icon: <Building2 size={28} /> },
	{ key: 'hasGym', label: 'Academia', icon: <Dumbbell size={28} /> },
	{ key: 'hasPlayground', label: 'Playground', icon: <Baby size={28} /> },
	{ key: 'hasSecurity', label: 'Seguranca 24h', icon: <Shield size={28} /> },
	{ key: 'hasAirConditioning', label: 'Ar Condicionado', icon: <AirVent size={28} /> },
	{ key: 'hasFurnished', label: 'Mobiliado', icon: <Armchair size={28} /> },
	{ key: 'hasPetFriendly', label: 'Aceita Pets', icon: <PawPrint size={28} /> },
	{ key: 'hasBalcony', label: 'Varanda', icon: <Home size={28} /> },
	{ key: 'hasBarbecue', label: 'Churrasqueira', icon: <Flame size={28} /> },
]

interface FeatureCheckboxProps {
	name: string
	label: string
	icon: ReactNode
	checked: boolean
	onChange: (checked: boolean) => void
	disabled?: boolean
}

export function FeatureCheckbox({
	name,
	label,
	icon,
	checked,
	onChange,
	disabled = false,
}: FeatureCheckboxProps) {
	return (
		<label className={`${styles.featureCheckbox} ${checked ? styles.featureCheckboxChecked : ''}`}>
			<input
				type="checkbox"
				className={styles.checkbox}
				name={name}
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
				aria-label={label}
			/>
			<span className={styles.featureIcon} aria-hidden="true">
				{icon}
			</span>
			<span className={styles.featureLabel}>{label}</span>
		</label>
	)
}

interface FeaturesGridProps {
	values: Record<FeatureKey, boolean | undefined>
	onChange: (key: FeatureKey, value: boolean) => void
	disabled?: boolean
}

export function FeaturesGrid({ values, onChange, disabled = false }: FeaturesGridProps) {
	return (
		<fieldset className={styles.featuresGrid} aria-label="Caracteristicas do imovel">
			{PROPERTY_FEATURES.map((feature) => (
				<FeatureCheckbox
					key={feature.key}
					name={feature.key}
					label={feature.label}
					icon={feature.icon}
					checked={values[feature.key] ?? false}
					onChange={(checked) => onChange(feature.key, checked)}
					disabled={disabled}
				/>
			))}
		</fieldset>
	)
}
