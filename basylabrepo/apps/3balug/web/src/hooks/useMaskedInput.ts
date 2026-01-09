import type { ChangeEvent } from 'react'
import { useCallback } from 'react'
import type { FieldValues, Path, UseFormSetValue } from 'react-hook-form'

import { applyMask, type MaskType } from '@/utils/masks'

type PercentageMask = 'percentage'
type AllMaskTypes = MaskType | PercentageMask

/**
 * Hook for creating masked input handlers for react-hook-form
 *
 * @param setValue - The setValue function from useForm
 * @returns Object with createMaskedHandler function
 *
 * @example
 * const { createMaskedHandler } = useMaskedInput(setValue)
 *
 * // In your component:
 * <Input
 *   {...register('phone')}
 *   onChange={createMaskedHandler('phone', 'phone')}
 * />
 *
 * <Input
 *   {...register('commissionPercentage')}
 *   onChange={createMaskedHandler('commissionPercentage', 'percentage')}
 * />
 */
export function useMaskedInput<T extends FieldValues>(setValue: UseFormSetValue<T>) {
	const createMaskedHandler = useCallback(
		(field: Path<T>, maskType: AllMaskTypes) => (e: ChangeEvent<HTMLInputElement>) => {
			let value = e.target.value

			if (maskType === 'percentage') {
				// Special handling for percentage
				value = value.replace(/\D/g, '')
				if (value.length > 4) value = value.slice(0, 4)
				if (Number.parseInt(value, 10) > 10000) value = '10000'
				const numValue = Number.parseInt(value, 10) || 0
				value = numValue > 0 ? `${(numValue / 100).toFixed(2)}%` : ''
			} else {
				value = applyMask(value, maskType)
			}

			setValue(field, value as T[Path<T>], { shouldValidate: false })
		},
		[setValue],
	)

	return { createMaskedHandler }
}
