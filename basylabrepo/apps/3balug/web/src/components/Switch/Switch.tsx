import * as styles from './Switch.css'

interface SwitchProps {
	checked: boolean
	onChange: (checked: boolean) => void
	disabled?: boolean
	label?: string
	size?: 'sm' | 'md'
}

export function Switch({ checked, onChange, disabled = false, label, size = 'md' }: SwitchProps) {
	const handleClick = () => {
		if (!disabled) {
			onChange(!checked)
		}
	}

	const sizeClass = size === 'sm' ? styles.sm : styles.md

	return (
		<label className={styles.container}>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={label}
				onClick={handleClick}
				disabled={disabled}
				className={`${styles.switchButton} ${sizeClass} ${checked ? styles.checked : ''} ${
					disabled ? styles.disabled : ''
				}`}
			>
				<span className={styles.slider} />
			</button>
			{label && <span className={styles.label}>{label}</span>}
		</label>
	)
}
