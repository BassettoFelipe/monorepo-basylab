import { classNames } from '@utils/classNames'
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import * as styles from './Button.css'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning'
type ButtonSize = 'small' | 'medium' | 'large'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode
	variant?: ButtonVariant
	size?: ButtonSize
	loading?: boolean
	fullWidth?: boolean
	ariaLabel?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			type = 'button',
			variant = 'primary',
			size = 'medium',
			loading = false,
			fullWidth = false,
			disabled = false,
			ariaLabel,
			className = '',
			...props
		},
		ref,
	) => {
		const buttonClassNames = classNames(
			styles.button,
			styles.variant[variant],
			styles.size[size],
			fullWidth && styles.fullWidth,
			loading && styles.loading,
			className,
		)

		return (
			<button
				ref={ref}
				type={type}
				className={buttonClassNames}
				disabled={disabled || loading}
				aria-label={ariaLabel}
				aria-busy={loading}
				{...props}
			>
				{loading ? <span className={styles.spinnerVariant[variant]} /> : children}
			</button>
		)
	},
)

Button.displayName = 'Button'
