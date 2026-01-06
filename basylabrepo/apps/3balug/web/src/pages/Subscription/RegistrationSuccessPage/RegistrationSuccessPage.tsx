import { Building2, CheckCircle, LogIn, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import * as styles from './RegistrationSuccessPage.css'

export function RegistrationSuccessPage() {
	const navigate = useNavigate()

	const handleGoToLogin = () => {
		navigate('/login', { replace: true })
	}

	const nextSteps = [
		{
			id: 'login',
			icon: LogIn,
			title: 'Acesse sua conta',
			description: 'Faça login com o email e senha que você cadastrou',
		},
		{
			id: 'properties',
			icon: Building2,
			title: 'Cadastre seus imóveis',
			description: 'Adicione seus imóveis ao sistema e comece a gerenciar',
		},
		{
			id: 'clients',
			icon: Users,
			title: 'Gerencie seus clientes',
			description: 'Cadastre clientes e organize suas negociações',
		},
	]

	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<div className={styles.content}>
					<div className={styles.iconWrapper}>
						<CheckCircle className={styles.icon} />
					</div>

					<div className={styles.header}>
						<h1 className={styles.title}>Cadastro Concluído com Sucesso!</h1>
						<p className={styles.subtitle}>
							Sua assinatura foi ativada. Você já pode acessar todas as funcionalidades do CRM
							Imobiliário.
						</p>
					</div>

					<div className={styles.divider} />

					<div className={styles.stepsSection}>
						<h2 className={styles.stepsTitle}>Próximos passos</h2>
						<div className={styles.stepsList}>
							{nextSteps.map((step) => {
								const IconComponent = step.icon
								return (
									<div key={step.id} className={styles.stepCard}>
										<div className={styles.stepIconWrapper}>
											<IconComponent className={styles.stepIcon} />
										</div>
										<div className={styles.stepContent}>
											<h3 className={styles.stepTitle}>{step.title}</h3>
											<p className={styles.stepDescription}>{step.description}</p>
										</div>
									</div>
								)
							})}
						</div>
					</div>

					<div className={styles.actions}>
						<Button onClick={handleGoToLogin} fullWidth>
							Fazer Login Agora
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
