import { Logo as BaseLogo } from '@/components/Logo/Logo'
import * as styles from './LoginLogo.css'

export function LoginLogo() {
	return (
		<div className={styles.logo}>
			<BaseLogo variant="primary" size="medium" />
		</div>
	)
}
