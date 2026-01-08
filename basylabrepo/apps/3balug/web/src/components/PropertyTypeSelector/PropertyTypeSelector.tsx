import { Building2, Home, LandPlot, Store, Tractor } from 'lucide-react'
import type { ReactNode } from 'react'

import type { PropertyType } from '@/types/property.types'
import * as styles from './PropertyTypeSelector.css'

interface PropertyTypeSelectorProps {
	value: PropertyType
	onChange: (value: PropertyType) => void
	label?: string
	error?: string
	required?: boolean
	disabled?: boolean
}

interface PropertyTypeOption {
	value: PropertyType
	label: string
	icon: ReactNode
}

const PROPERTY_TYPES: PropertyTypeOption[] = [
	{ value: 'house', label: 'Casa', icon: <Home size={24} /> },
	{ value: 'apartment', label: 'Apartamento', icon: <Building2 size={24} /> },
	{ value: 'land', label: 'Terreno', icon: <LandPlot size={24} /> },
	{ value: 'commercial', label: 'Comercial', icon: <Store size={24} /> },
	{ value: 'rural', label: 'Rural', icon: <Tractor size={24} /> },
]

export function PropertyTypeSelector({
	value,
	onChange,
	label = 'Tipo do Imovel',
	error,
	required = false,
	disabled = false,
}: PropertyTypeSelectorProps) {
	const handleSelect = (type: PropertyType) => {
		if (!disabled) {
			onChange(type)
		}
	}

	return (
		<div className={styles.container}>
			{label && (
				<span className={styles.label}>
					{label}
					{required && <span className={styles.required}>*</span>}
				</span>
			)}

			<div className={styles.grid}>
				{PROPERTY_TYPES.map((option) => {
					const isSelected = value === option.value

					const optionClasses = [
						styles.option,
						isSelected && styles.optionSelected,
						disabled && styles.optionDisabled,
					]
						.filter(Boolean)
						.join(' ')

					const iconClasses = [styles.iconWrapper, isSelected && styles.iconWrapperSelected]
						.filter(Boolean)
						.join(' ')

					const labelClasses = [styles.optionLabel, isSelected && styles.optionLabelSelected]
						.filter(Boolean)
						.join(' ')

					return (
						<button
							type="button"
							key={option.value}
							className={optionClasses}
							onClick={() => handleSelect(option.value)}
							tabIndex={disabled ? -1 : 0}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									handleSelect(option.value)
								}
							}}
							aria-pressed={isSelected}
							disabled={disabled}
						>
							<div className={iconClasses}>{option.icon}</div>
							<span className={labelClasses}>{option.label}</span>
						</button>
					)
				})}
			</div>

			{error && <span className={styles.errorMessage}>{error}</span>}
		</div>
	)
}
