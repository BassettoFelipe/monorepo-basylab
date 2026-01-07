import { Edit, Eye, FileText, Plus, XCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Select } from '@/components/Select/Select'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useContractQuery } from '@/queries/contracts/useContractQuery'
import { useContractsQuery } from '@/queries/contracts/useContractsQuery'
import type { Contract, ContractStatus } from '@/types/contract.types'
import { CreateContractModal } from './components/CreateContractModal/CreateContractModal'
import { EditContractModal } from './components/EditContractModal/EditContractModal'
import { TerminateContractModal } from './components/TerminateContractModal/TerminateContractModal'
import { ViewContractModal } from './components/ViewContractModal/ViewContractModal'
import * as styles from './styles.css'

const statusLabels: Record<ContractStatus, string> = {
	active: 'Ativo',
	terminated: 'Encerrado',
	cancelled: 'Cancelado',
	expired: 'Expirado',
}

const getStatusBadgeClass = (status: ContractStatus) => {
	const classes: Record<ContractStatus, string> = {
		active: styles.badgeActive,
		terminated: styles.badgeTerminated,
		cancelled: styles.badgeCancelled,
		expired: styles.badgeExpired,
	}
	return classes[status]
}

const formatCurrency = (value: number | null) => {
	if (value === null || value === undefined) return '-'
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value / 100)
}

const formatDate = (dateStr: string) => {
	return new Date(dateStr).toLocaleDateString('pt-BR')
}

const statusOptions = [
	{ value: '', label: 'Todos' },
	{ value: 'active', label: 'Ativo' },
	{ value: 'terminated', label: 'Encerrado' },
	{ value: 'cancelled', label: 'Cancelado' },
	{ value: 'expired', label: 'Expirado' },
]

export function ContractsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

	const limit = 20

	// Extrair estados da URL
	const statusFilter = (searchParams.get('status') || '') as ContractStatus | ''
	const page = Number(searchParams.get('page')) || 1

	const modalAction = searchParams.get('modal')
	const editId = searchParams.get('id')

	const isCreateModalOpen = modalAction === 'create'
	const isViewModalOpen = modalAction === 'view' && !!editId
	const isEditModalOpen = modalAction === 'edit' && !!editId
	const isTerminateModalOpen = modalAction === 'terminate' && !!editId

	const { data, isLoading, error } = useContractsQuery({
		status: statusFilter || undefined,
		page,
		limit,
	})

	const { data: editContractData, isLoading: isLoadingContract } = useContractQuery(editId || '', {
		enabled: isViewModalOpen || isEditModalOpen || isTerminateModalOpen,
	})

	const updateSearchParams = (updates: Record<string, string>) => {
		const newParams = new URLSearchParams(searchParams)
		for (const [key, value] of Object.entries(updates)) {
			if (value) {
				newParams.set(key, value)
			} else {
				newParams.delete(key)
			}
		}
		setSearchParams(newParams)
	}

	const openCreateModal = () => {
		updateSearchParams({ modal: 'create' })
	}

	const openViewModal = (contract: Contract) => {
		updateSearchParams({ modal: 'view', id: contract.id })
	}

	const openEditModal = (contract: Contract) => {
		updateSearchParams({ modal: 'edit', id: contract.id })
	}

	const openEditFromView = () => {
		if (editId) {
			updateSearchParams({ modal: 'edit', id: editId })
		}
	}

	const openTerminateModal = (contract: Contract) => {
		updateSearchParams({ modal: 'terminate', id: contract.id })
	}

	const closeModal = () => {
		const newParams = new URLSearchParams(searchParams)
		newParams.delete('modal')
		newParams.delete('id')
		setSearchParams(newParams)
	}

	return (
		<AdminLayout>
			<div className={styles.sectionHeader}>
				<div className={styles.sectionTitleWrapper}>
					<h2 className={styles.sectionTitle}>Contratos</h2>
					<p className={styles.sectionDescription}>
						{data?.total || 0} {data?.total === 1 ? 'contrato cadastrado' : 'contratos cadastrados'}
					</p>
				</div>
				<Button onClick={openCreateModal} variant="primary">
					<Plus size={20} />
					Novo Contrato
				</Button>
			</div>

			<div className={styles.filtersCard}>
				<div className={styles.filterRow}>
					<div className={styles.filterItem}>
						<label className={styles.filterLabel} htmlFor="status-filter">
							Status
						</label>
						<Select
							id="status-filter"
							value={statusFilter}
							onChange={(e) => {
								updateSearchParams({ status: e.target.value, page: '1' })
							}}
							options={statusOptions}
							fullWidth
						/>
					</div>
				</div>
			</div>

			{isLoading && (
				<div>
					<div style={{ marginBottom: '8px' }}>
						<Skeleton width="100%" height="60px" />
					</div>
					<div style={{ marginBottom: '8px' }}>
						<Skeleton width="100%" height="60px" />
					</div>
					<Skeleton width="100%" height="60px" />
				</div>
			)}

			{error && (
				<EmptyState
					icon={FileText}
					title="Erro ao carregar contratos"
					description="Nao foi possivel carregar os contratos. Tente novamente."
				/>
			)}

			{!isLoading && !error && data && data.data.length === 0 && (
				<EmptyState
					icon={FileText}
					title="Nenhum contrato cadastrado"
					description="Crie contratos para gerenciar as locacoes."
					action={{
						label: 'Criar Primeiro Contrato',
						onClick: openCreateModal,
					}}
				/>
			)}

			{!isLoading && !error && data && data.data.length > 0 && (
				<>
					<div className={styles.tableWrapper}>
						<table className={styles.table}>
							<thead className={styles.tableHeader}>
								<tr>
									<th className={styles.tableHeaderCell}>Imovel</th>
									<th className={styles.tableHeaderCell}>Inquilino</th>
									<th className={styles.tableHeaderCell}>Periodo</th>
									<th className={styles.tableHeaderCell}>Aluguel</th>
									<th className={styles.tableHeaderCell}>Dia Venc.</th>
									<th className={styles.tableHeaderCell}>Status</th>
									<th className={styles.tableHeaderCell}>Acoes</th>
								</tr>
							</thead>
							<tbody>
								{data.data.map((contract) => (
									<tr key={contract.id} className={styles.tableRow}>
										<td className={styles.tableCell}>
											<div className={styles.contractInfo}>
												<span className={styles.contractTitle}>
													{contract.property?.title || '-'}
												</span>
												<span className={styles.contractSubtitle}>
													{contract.property?.city && contract.property?.state
														? `${contract.property.city}/${contract.property.state}`
														: '-'}
												</span>
											</div>
										</td>
										<td className={styles.tableCell}>
											<span>{contract.tenant?.name || '-'}</span>
										</td>
										<td className={styles.tableCell}>
											<div className={styles.dateInfo}>
												<span>
													<span className={styles.dateLabel}>Inicio: </span>
													{formatDate(contract.startDate)}
												</span>
												<span>
													<span className={styles.dateLabel}>Fim: </span>
													{formatDate(contract.endDate)}
												</span>
											</div>
										</td>
										<td className={styles.tableCell}>
											<span className={styles.priceValue}>
												{formatCurrency(contract.rentalAmount)}
											</span>
										</td>
										<td className={styles.tableCell}>
											<span>Dia {contract.paymentDay}</span>
										</td>
										<td className={styles.tableCell}>
											<span className={`${styles.badge} ${getStatusBadgeClass(contract.status)}`}>
												{statusLabels[contract.status]}
											</span>
										</td>
										<td className={styles.tableCell}>
											<div className={styles.actions}>
												<button
													type="button"
													className={styles.iconButton}
													onClick={() => openViewModal(contract)}
													title="Visualizar contrato"
												>
													<Eye size={18} />
												</button>
												{contract.status === 'active' && (
													<>
														<button
															type="button"
															className={styles.iconButton}
															onClick={() => openEditModal(contract)}
															title="Editar contrato"
														>
															<Edit size={18} />
														</button>
														<button
															type="button"
															className={`${styles.iconButton} ${styles.iconButtonWarning}`}
															onClick={() => openTerminateModal(contract)}
															title="Encerrar contrato"
														>
															<XCircle size={18} />
														</button>
													</>
												)}
												{contract.status !== 'active' && (
													<span style={{ color: '#9CA3AF', fontSize: '13px' }}>-</span>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{data.totalPages > 1 && (
						<div className={styles.pagination}>
							<div className={styles.paginationInfo}>
								Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, data.total)} de{' '}
								{data.total} contratos
							</div>
							<div className={styles.paginationButtons}>
								<Button
									variant="outline"
									size="small"
									onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
									disabled={page === 1}
								>
									Anterior
								</Button>
								<Button
									variant="outline"
									size="small"
									onClick={() =>
										updateSearchParams({
											page: String(Math.min(data.totalPages, page + 1)),
										})
									}
									disabled={page === data.totalPages}
								>
									Proxima
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			<CreateContractModal isOpen={isCreateModalOpen} onClose={closeModal} />

			<ViewContractModal
				isOpen={isViewModalOpen}
				onClose={closeModal}
				contract={editContractData || null}
				onEdit={openEditFromView}
				isLoading={isLoadingContract}
			/>

			<EditContractModal
				isOpen={isEditModalOpen}
				onClose={closeModal}
				contract={editContractData || null}
			/>

			<TerminateContractModal
				isOpen={isTerminateModalOpen}
				onClose={closeModal}
				contract={editContractData || null}
			/>
		</AdminLayout>
	)
}
