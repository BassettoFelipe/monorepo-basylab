import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import * as styles from './PageHeader.css'

interface PageHeaderProps {
	title: string
	description?: string
	icon?: LucideIcon
	action?: {
		label: string
		onClick: () => void
		icon?: LucideIcon
	}
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
	return (
		<div className={styles.pageHeader}>
			<div className={styles.pageHeaderContent}>
				<div className={styles.pageHeaderInfo}>
					{Icon && (
						<div className={styles.pageHeaderIcon}>
							<Icon className={styles.pageHeaderIconSvg} />
						</div>
					)}
					<div className={styles.pageHeaderTextWrapper}>
						<h1 className={styles.pageHeaderTitle}>{title}</h1>
						{description && <p className={styles.pageHeaderDescription}>{description}</p>}
					</div>
				</div>

				{action && (
					<Button onClick={action.onClick} variant="primary">
						{action.icon && <action.icon size={20} />}
						<span className={styles.actionButtonLabel}>{action.label}</span>
					</Button>
				)}
			</div>
		</div>
	)
}
