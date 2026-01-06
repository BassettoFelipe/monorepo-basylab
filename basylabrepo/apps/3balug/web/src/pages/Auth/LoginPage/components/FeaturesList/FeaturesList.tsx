import { Home, TrendingUp, Users } from 'lucide-react'
import * as styles from './FeaturesList.css'

interface Feature {
	icon: React.ReactElement
	label: string
}

const defaultFeatures: Feature[] = [
	{
		icon: <Home size={32} aria-hidden="true" />,
		label: 'Gestão completa de imóveis',
	},
	{
		icon: <Users size={32} aria-hidden="true" />,
		label: 'Controle de clientes e contratos',
	},
	{
		icon: <TrendingUp size={32} aria-hidden="true" />,
		label: 'Relatórios e métricas',
	},
]

interface FeaturesListProps {
	features?: Feature[]
}

export function FeaturesList({ features = defaultFeatures }: FeaturesListProps) {
	return (
		<div className={styles.features}>
			{features.map((feature) => (
				<div key={feature.label} className={styles.featureItem}>
					<div className={styles.featureIcon}>{feature.icon}</div>
					<span>{feature.label}</span>
				</div>
			))}
		</div>
	)
}
