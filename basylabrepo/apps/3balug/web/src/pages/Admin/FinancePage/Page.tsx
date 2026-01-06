import { AlertCircle, CreditCard, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { StatCard } from '@/components/StatCard/StatCard'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import * as styles from './styles.css'

export function FinancePage() {
	const financialStats = [
		{
			title: 'Receita do Mês',
			value: 'R$ 0,00',
			icon: TrendingUp,
			color: 'success' as const,
			trend: { value: 0, isPositive: true },
		},
		{
			title: 'Despesas do Mês',
			value: 'R$ 0,00',
			icon: TrendingDown,
			color: 'error' as const,
			trend: { value: 0, isPositive: false },
		},
		{
			title: 'Cobranças Pendentes',
			value: '0',
			icon: AlertCircle,
			color: 'warning' as const,
		},
		{
			title: 'Saldo Disponível',
			value: 'R$ 0,00',
			icon: CreditCard,
			color: 'info' as const,
		},
	]

	return (
		<AdminLayout>
			<PageHeader
				title="Financeiro"
				description="Controle de receitas, despesas e cobranças"
				icon={DollarSign}
			/>

			<div className={styles.statsGrid}>
				{financialStats.map((stat) => (
					<StatCard
						key={stat.title}
						title={stat.title}
						value={stat.value}
						icon={stat.icon}
						color={stat.color}
						trend={stat.trend}
					/>
				))}
			</div>

			<EmptyState
				icon={DollarSign}
				title="Nenhuma transação registrada"
				description="Aqui você terá acesso a cobranças automáticas, split financeiro, multas e juros, além de relatórios completos."
			/>
		</AdminLayout>
	)
}
