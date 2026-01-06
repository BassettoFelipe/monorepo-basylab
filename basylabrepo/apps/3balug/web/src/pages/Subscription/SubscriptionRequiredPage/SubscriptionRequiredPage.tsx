import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import * as styles from './SubscriptionRequiredPage.css'

export function SubscriptionRequiredPage() {
	const navigate = useNavigate()

	return (
		<div className={styles.page}>
			<div className={styles.card}>
				<span className={styles.badge}>Assinatura necessária</span>
				<h1 className={styles.title}>Ative um plano para continuar</h1>
				<p className={styles.subtitle}>
					Sua assinatura está inativa ou expirou. Escolha um plano para voltar a acessar o CRM e
					acompanhar seus clientes, contratos e imóveis.
				</p>

				<div className={styles.highlights}>
					<div className={styles.highlightItem}>
						<div className={styles.highlightIcon}>
							<AlertCircle size={16} />
						</div>
						<p className={styles.highlightText}>
							Libere novamente recursos como funil de vendas, contratos e automação de tarefas.
						</p>
					</div>
					<div className={styles.highlightItem}>
						<div className={styles.highlightIcon}>
							<ShieldCheck size={16} />
						</div>
						<p className={styles.highlightText}>
							Dados permanecem seguros. Basta reativar para continuar de onde parou.
						</p>
					</div>
				</div>

				<div className={styles.actions}>
					<Button fullWidth onClick={() => navigate('/')}>
						Escolher plano
					</Button>
					<Button fullWidth variant="outline" onClick={() => navigate('/login')}>
						<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
							Trocar conta
							<ArrowRight size={16} />
						</span>
					</Button>
				</div>
			</div>
		</div>
	)
}
