import { BarChart3, FileText, Home, Search, Users, Wallet } from 'lucide-react'
import * as styles from '../../styles.css'

export function FeaturesSection() {
	const features = [
		{
			icon: Home,
			title: 'Gestão de Imóveis',
			description:
				'Cadastre e organize todos os seus imóveis com fotos, vídeos e informações completas em um só lugar.',
		},
		{
			icon: Users,
			title: 'Gestão de Clientes',
			description:
				'Mantenha o histórico completo de clientes, proprietários e inquilinos com facilidade.',
		},
		{
			icon: FileText,
			title: 'Contratos Digitais',
			description:
				'Crie, gerencie e assine contratos digitalmente, eliminando papelada e burocracia.',
		},
		{
			icon: Wallet,
			title: 'Controle Financeiro',
			description:
				'Gerencie recebimentos, pagamentos e tenha visão completa das finanças do seu negócio.',
		},
		{
			icon: BarChart3,
			title: 'Relatórios Inteligentes',
			description:
				'Dashboards e relatórios detalhados para acompanhar o desempenho e tomar decisões estratégicas.',
		},
		{
			icon: Search,
			title: 'Consulta Serasa',
			description:
				'Integração direta com Serasa para análise de crédito rápida e segura de inquilinos.',
		},
	]

	return (
		<section id="recursos" className={styles.featuresSection} aria-labelledby="features-heading">
			<div className={styles.container}>
				<header className={styles.sectionHeader}>
					<span className={styles.sectionLabel}>Recursos</span>
					<h2 id="features-heading" className={styles.sectionTitle}>
						Tudo que você precisa para crescer
					</h2>
					<p className={styles.sectionDescription}>
						Ferramentas poderosas e intuitivas projetadas para otimizar seu dia a dia e aumentar sua
						produtividade.
					</p>
				</header>

				<ul className={styles.featuresGrid}>
					{features.map((feature) => {
						const Icon = feature.icon
						return (
							<li key={feature.title} className={styles.featureCard}>
								<div className={styles.featureIconWrapper} aria-hidden="true">
									<Icon className={styles.featureIcon} />
								</div>
								<h3 className={styles.featureTitle}>{feature.title}</h3>
								<p className={styles.featureDescription}>{feature.description}</p>
							</li>
						)
					})}
				</ul>
			</div>
		</section>
	)
}
