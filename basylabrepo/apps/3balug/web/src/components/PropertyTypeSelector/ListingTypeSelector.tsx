import { ArrowLeftRight, BadgeDollarSign, Key } from 'lucide-react'
import type { ReactNode } from 'react'

import type { ListingType } from '@/types/property.types'
import * as styles from './PropertyTypeSelector.css'

interface ListingTypeSelectorProps {
	value: ListingType
	onChange: (value: ListingType) => void
	label?: string
	error?: string
	required?: boolean
	disabled?: boolean
}

interface ListingTypeOption {
	value: ListingType
	label: string
	description: string
	icon: ReactNode
	colorVariant: 'rent' | 'sale' | 'both'
}

const LISTING_TYPES: ListingTypeOption[] = [
	{
		value: 'rent',
		label: 'Locacao',
		description: 'Disponivel para alugar',
		icon: <Key size={22} />,
		colorVariant: 'rent',
	},
	{
		value: 'sale',
		label: 'Venda',
		description: 'Disponivel para comprar',
		icon: <BadgeDollarSign size={22} />,
		colorVariant: 'sale',
	},
	{
		value: 'both',
		label: 'Ambos',
		description: 'Locacao e venda',
		icon: <ArrowLeftRight size={22} />,
		colorVariant: 'both',
	},
]

export function ListingTypeSelector({
	value,
	onChange,
	label = 'Finalidade',
	error,
	required = false,
	disabled = false,
}: ListingTypeSelectorProps) {
	const handleSelect = (type: ListingType) => {
		if (!disabled) {
			onChange(type)
		}
	}

	const getOptionClasses = (option: ListingTypeOption, isSelected: boolean) => {
		const baseClasses = [styles.listingOption]

		if (disabled) {
			baseClasses.push(styles.listingOptionDisabled)
		} else if (isSelected) {
			switch (option.colorVariant) {
				case 'rent':
					baseClasses.push(styles.rentOptionSelected)
					break
				case 'sale':
					baseClasses.push(styles.saleOptionSelected)
					break
				case 'both':
					baseClasses.push(styles.bothOptionSelected)
					break
			}
		}

		return baseClasses.filter(Boolean).join(' ')
	}

	const getIconClasses = (option: ListingTypeOption, isSelected: boolean) => {
		const baseClasses = [styles.listingIconWrapper]

		if (isSelected) {
			switch (option.colorVariant) {
				case 'rent':
					baseClasses.push(styles.rentIconSelected)
					break
				case 'sale':
					baseClasses.push(styles.saleIconSelected)
					break
				case 'both':
					baseClasses.push(styles.bothIconSelected)
					break
			}
		}

		return baseClasses.filter(Boolean).join(' ')
	}

	return (
		<div className={styles.container}>
			{label && (
				<span className={styles.label}>
					{label}
					{required && <span className={styles.required}>*</span>}
				</span>
			)}

			<div className={styles.listingTypeGrid}>
				{LISTING_TYPES.map((option) => {
					const isSelected = value === option.value

					const labelClasses = [styles.listingLabel, isSelected && styles.listingLabelSelected]
						.filter(Boolean)
						.join(' ')

					const descriptionClasses = [
						styles.listingDescription,
						isSelected && styles.listingDescriptionSelected,
					]
						.filter(Boolean)
						.join(' ')

					return (
						<button
							type="button"
							key={option.value}
							className={getOptionClasses(option, isSelected)}
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
							<div className={getIconClasses(option, isSelected)}>{option.icon}</div>
							<span className={labelClasses}>{option.label}</span>
							<span className={descriptionClasses}>{option.description}</span>
						</button>
					)
				})}
			</div>

			{error && <span className={styles.errorMessage}>{error}</span>}
		</div>
	)
}
