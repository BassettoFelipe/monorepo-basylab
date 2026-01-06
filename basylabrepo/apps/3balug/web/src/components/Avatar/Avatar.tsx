import { Skeleton } from '@/components/Skeleton/Skeleton'
import * as styles from './Avatar.css'

interface AvatarProps {
	src?: string | null
	name: string
	size?: 'small' | 'medium' | 'large'
	className?: string
	isLoading?: boolean
}

function getInitials(name: string): string {
	if (!name) return 'U'
	const names = name.trim().split(' ').filter(Boolean)
	if (names.length === 1) return names[0][0].toUpperCase()
	return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
}

const sizeStyles = {
	small: styles.small,
	medium: styles.medium,
	large: styles.large,
}

const sizeValues = {
	small: '32px',
	medium: '40px',
	large: '96px',
}

export function Avatar({
	src,
	name,
	size = 'medium',
	className = '',
	isLoading = false,
}: AvatarProps) {
	const initials = getInitials(name)
	const sizeClass = sizeStyles[size]

	if (isLoading) {
		return (
			<Skeleton
				width={sizeValues[size]}
				height={sizeValues[size]}
				variant="circular"
				className={className}
			/>
		)
	}

	return (
		<div className={`${styles.avatar} ${sizeClass} ${className}`}>
			{src ? (
				<img src={src} alt={name} className={styles.image} />
			) : (
				<span className={styles.initials}>{initials}</span>
			)}
		</div>
	)
}
