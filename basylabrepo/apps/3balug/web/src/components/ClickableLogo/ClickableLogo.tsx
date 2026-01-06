import { Link } from 'react-router-dom'
import { Logo, type LogoProps } from '@/components/Logo/Logo'
import * as styles from './ClickableLogo.css'

interface ClickableLogoProps extends LogoProps {
	to?: string
	className?: string
}

export function ClickableLogo({
	to = '/dashboard',
	variant = 'primary',
	size = 'medium',
	className,
}: ClickableLogoProps) {
	return (
		<Link to={to} className={`${styles.logoLink} ${className || ''}`}>
			<Logo variant={variant} size={size} />
		</Link>
	)
}
