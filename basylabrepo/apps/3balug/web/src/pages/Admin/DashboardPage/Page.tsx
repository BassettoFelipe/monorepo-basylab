import {
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle,
	Clock,
	DollarSign,
	FileText,
	Users,
} from 'lucide-react'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { StatCard } from '@/components/StatCard/StatCard'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useDashboardStatsQuery } from '@/queries/dashboard/useDashboardStatsQuery'
import * as styles from './styles.css'

function formatCurrency(valueInCents: number): string {
	// Converte de centavos para reais
	const valueInReais = valueInCents / 100
	return valueInReais.toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	})
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('pt-BR')
}

function getDaysUntil(dateString: string): number {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const endDate = new Date(dateString)
	endDate.setHours(0, 0, 0, 0)
	const diffTime = endDate.getTime() - today.getTime()
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function StatCardSkeleton() {
	return (
		<div className={styles.statCardSkeleton}>
			<div className={styles.statCardSkeletonHeader}>
				<Skeleton width="60%" height="12px" variant="rounded" />
				<Skeleton width="48px" height="48px" variant="rounded" />
			</div>
			<Skeleton width="50%" height="32px" variant="rounded" />
		</div>
	)
}

function ContractItemSkeleton() {
	return (
		<div className={styles.expiringContractItem}>
			<div className={styles.expiringContractInfo}>
				<div className={styles.expiringContractHeader}>
					<Skeleton width="16px" height="16px" variant="rectangular" />
					<Skeleton width="120px" height="14px" variant="rounded" />
				</div>
				<Skeleton width="180px" height="12px" variant="rounded" />
			</div>
			<div className={styles.expiringContractRight}>
				<Skeleton width="80px" height="14px" variant="rounded" />
				<Skeleton width="60px" height="20px" variant="rounded" />
			</div>
		</div>
	)
}

function ActivityItemSkeleton() {
	return (
		<div className={styles.activityItem}>
			<Skeleton width="32px" height="32px" variant="circular" />
			<div className={styles.activityContent}>
				<Skeleton width="140px" height="14px" variant="rounded" />
				<Skeleton width="200px" height="12px" variant="rounded" />
			</div>
			<Skeleton width="40px" height="12px" variant="rounded" />
		</div>
	)
}

export function DashboardPage() {
	const { data: stats, isLoading, error } = useDashboardStatsQuery()

	// Mock de banners de anúncio (futuramente virá do backend)
	const banners = [
		{
			id: 1,
			desktop: '/assets/images/banners/banner-desktop.jpg',
			tablet: '/assets/images/banners/banner-tablet.jpg',
			mobile: '/assets/images/banners/banner-mobile.jpg',
		},
		{
			id: 2,
			desktop: '/assets/images/banners/banner-desktop.jpg',
			tablet: '/assets/images/banners/banner-tablet.jpg',
			mobile: '/assets/images/banners/banner-mobile.jpg',
		},
		{
			id: 3,
			desktop: '/assets/images/banners/banner-desktop.jpg',
			tablet: '/assets/images/banners/banner-tablet.jpg',
			mobile: '/assets/images/banners/banner-mobile.jpg',
		},
	]

	const statCards = [
		{
			title: 'Total de Imóveis',
			value: stats?.properties.total.toString() ?? '0',
			icon: Building2,
			color: 'primary' as const,
		},
		{
			title: 'Clientes',
			value: ((stats?.propertyOwners.total ?? 0) + (stats?.tenants.total ?? 0)).toString(),
			icon: Users,
			color: 'success' as const,
		},
		{
			title: 'Contratos Ativos',
			value: stats?.contracts.active.toString() ?? '0',
			icon: FileText,
			color: 'info' as const,
		},
		{
			title: 'Receita Mensal',
			value: formatCurrency(stats?.contracts.totalRentalAmount ?? 0),
			icon: DollarSign,
			color: 'success' as const,
		},
	]

	const recentActivities = [
		{
			icon: CheckCircle,
			title: 'Sistema configurado',
			description: 'Sua conta foi criada com sucesso',
			time: 'Agora',
			color: 'success' as const,
		},
	]

	const upcomingTasks = [
		{
			icon: Building2,
			title: 'Cadastrar primeiro imóvel',
			description: 'Comece adicionando imóveis ao sistema',
			priority: 'high' as const,
		},
		{
			icon: Users,
			title: 'Cadastrar clientes',
			description: 'Adicione proprietários e locatários',
			priority: 'medium' as const,
		},
		{
			icon: FileText,
			title: 'Criar contratos',
			description: 'Gere contratos de locação',
			priority: 'medium' as const,
		},
	]

	return (
		<AdminLayout showSidebar={true}>
			{/* Banner Full Width com Degradê */}
			<div className={styles.bannerWrapper}>
				<Swiper
					modules={[Pagination, Autoplay]}
					pagination={{
						clickable: true,
					}}
					autoplay={{
						delay: 5000,
						disableOnInteraction: false,
					}}
					loop={true}
					speed={600}
					className={styles.swiper}
				>
					{banners.map((banner) => (
						<SwiperSlide key={banner.id} className={styles.swiperSlide}>
							<picture>
								<source media="(max-width: 640px)" srcSet={banner.mobile} />
								<source media="(max-width: 1024px)" srcSet={banner.tablet} />
								<img
									src={banner.desktop}
									alt={`Banner ${banner.id}`}
									className={styles.bannerImage}
									loading="lazy"
								/>
							</picture>
						</SwiperSlide>
					))}
				</Swiper>
				<div className={styles.bannerGradient} aria-hidden="true" />
			</div>

			{error && (
				<div className={styles.errorBanner}>
					<AlertTriangle size={20} />
					<span>Erro ao carregar estatísticas. Tente novamente mais tarde.</span>
				</div>
			)}

			{/* Stats Grid - com Skeletons */}
			<div className={styles.statsGrid}>
				{isLoading ? (
					<>
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
					</>
				) : (
					statCards.map((stat) => (
						<StatCard
							key={stat.title}
							title={stat.title}
							value={stat.value}
							icon={stat.icon}
							color={stat.color}
						/>
					))
				)}
			</div>

			<div className={styles.contentGrid}>
				{/* Contratos Vencendo */}
				<div className={styles.card}>
					<div className={styles.cardHeader}>
						<div className={styles.cardHeaderContent}>
							<Calendar size={20} />
							<h3 className={styles.cardTitle}>Contratos Vencendo (30 dias)</h3>
						</div>
					</div>
					<div className={styles.cardBody}>
						{isLoading ? (
							<>
								<ContractItemSkeleton />
								<ContractItemSkeleton />
								<ContractItemSkeleton />
							</>
						) : stats?.expiringContracts && stats.expiringContracts.length > 0 ? (
							stats.expiringContracts.map((contract) => {
								const daysUntil = getDaysUntil(contract.endDate)
								const isUrgent = daysUntil <= 7
								return (
									<div key={contract.id} className={styles.expiringContractItem}>
										<div className={styles.expiringContractInfo}>
											<div className={styles.expiringContractHeader}>
												<FileText size={16} />
												<span className={styles.expiringContractId}>
													Contrato #{contract.id.slice(0, 8)}
												</span>
											</div>
											<p className={styles.expiringContractDetails}>
												Vence em {formatDate(contract.endDate)} ({daysUntil} dias)
											</p>
										</div>
										<div className={styles.expiringContractRight}>
											<span className={styles.expiringContractValue}>
												{formatCurrency(contract.rentalAmount)}
											</span>
											<span
												className={`${styles.expiringContractBadge} ${isUrgent ? styles.badgeUrgent : styles.badgeWarning}`}
											>
												{isUrgent ? 'Urgente' : 'Atenção'}
											</span>
										</div>
									</div>
								)
							})
						) : (
							<div className={styles.emptyState}>
								<CheckCircle size={32} className={styles.emptyStateIcon} />
								<p>Nenhum contrato vencendo nos próximos 30 dias</p>
							</div>
						)}
					</div>
				</div>

				{/* Atividades Recentes */}
				<div className={styles.card}>
					<div className={styles.cardHeader}>
						<div className={styles.cardHeaderContent}>
							<Clock size={20} />
							<h3 className={styles.cardTitle}>Atividades Recentes</h3>
						</div>
					</div>
					<div className={styles.cardBody}>
						{isLoading ? (
							<>
								<ActivityItemSkeleton />
								<ActivityItemSkeleton />
							</>
						) : (
							recentActivities.map((activity) => {
								const Icon = activity.icon
								return (
									<div key={activity.title} className={styles.activityItem}>
										<div
											className={`${styles.activityIcon} ${styles.activityIconColor[activity.color]}`}
										>
											<Icon size={16} />
										</div>
										<div className={styles.activityContent}>
											<h4 className={styles.activityTitle}>{activity.title}</h4>
											<p className={styles.activityDescription}>{activity.description}</p>
										</div>
										<span className={styles.activityTime}>{activity.time}</span>
									</div>
								)
							})
						)}
					</div>
				</div>
			</div>

			{/* Próximas Tarefas - só mostra se não há dados */}
			{stats && stats.properties.total === 0 && (
				<div className={styles.card} style={{ marginBottom: 'var(--spacing-2xl)' }}>
					<div className={styles.cardHeader}>
						<div className={styles.cardHeaderContent}>
							<Calendar size={20} />
							<h3 className={styles.cardTitle}>Próximas Tarefas</h3>
						</div>
					</div>
					<div className={styles.cardBody}>
						{upcomingTasks.map((task) => {
							const Icon = task.icon
							return (
								<div key={task.title} className={styles.taskItem}>
									<div className={styles.taskIconWrapper}>
										<Icon size={20} />
									</div>
									<div className={styles.taskContent}>
										<h4 className={styles.taskTitle}>{task.title}</h4>
										<p className={styles.taskDescription}>{task.description}</p>
									</div>
									<span
										className={`${styles.taskPriority} ${styles.taskPriorityColor[task.priority]}`}
									>
										{task.priority === 'high'
											? 'Alta'
											: task.priority === 'medium'
												? 'Média'
												: 'Baixa'}
									</span>
								</div>
							)
						})}
					</div>
				</div>
			)}

			<div className={styles.quickActions}>
				<h3 className={styles.quickActionsTitle}>Ações Rápidas</h3>
				<div className={styles.quickActionsGrid}>
					<button type="button" className={styles.quickActionCard}>
						<Building2 size={32} />
						<span>Adicionar Imóvel</span>
						<span className={styles.comingSoonBadge}>Em breve</span>
					</button>
					<button type="button" className={styles.quickActionCard}>
						<Users size={32} />
						<span>Novo Cliente</span>
						<span className={styles.comingSoonBadge}>Em breve</span>
					</button>
					<button type="button" className={styles.quickActionCard}>
						<FileText size={32} />
						<span>Criar Contrato</span>
						<span className={styles.comingSoonBadge}>Em breve</span>
					</button>
					<button type="button" className={styles.quickActionCard}>
						<Calendar size={32} />
						<span>Agendar Visita</span>
						<span className={styles.comingSoonBadge}>Em breve</span>
					</button>
				</div>
			</div>
		</AdminLayout>
	)
}
