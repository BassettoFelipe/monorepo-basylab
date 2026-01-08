import {
	ArrowDownAZ,
	ArrowUpAZ,
	Building2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Edit,
	Eye,
	Filter,
	Home,
	MapPin,
	Plus,
	RotateCcw,
	Ruler,
	SearchX,
	Trash2,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useDeletePropertyMutation } from '@/queries/properties/useDeletePropertyMutation'
import { usePropertiesQuery } from '@/queries/properties/usePropertiesQuery'
import { usePropertyQuery } from '@/queries/properties/usePropertyQuery'
import type {
	ListingType,
	Property,
	PropertySortBy,
	PropertySortOrder,
	PropertyStatus,
	PropertyType,
} from '@/types/property.types'
import { BRAZILIAN_STATES } from '@/types/property-owner.types'
import { CreatePropertyModal } from './components/CreatePropertyModal/CreatePropertyModal'
import { EditPropertyModal } from './components/EditPropertyModal/EditPropertyModal'
import * as styles from './styles.css'

const propertyTypeLabels: Record<PropertyType, string> = {
	house: 'Casa',
	apartment: 'Apartamento',
	land: 'Terreno',
	commercial: 'Comercial',
	rural: 'Rural',
}

const listingTypeLabels: Record<ListingType, string> = {
	rent: 'Locacao',
	sale: 'Venda',
	both: 'Ambos',
}

const statusLabels: Record<PropertyStatus, string> = {
	available: 'Disponivel',
	rented: 'Alugado',
	sold: 'Vendido',
	maintenance: 'Manutencao',
	unavailable: 'Indisponivel',
}

const getTypeBadgeClass = (type: PropertyType) => {
	const classes: Record<PropertyType, string> = {
		house: styles.badgeHouse,
		apartment: styles.badgeApartment,
		land: styles.badgeLand,
		commercial: styles.badgeCommercial,
		rural: styles.badgeRural,
	}
	return classes[type]
}

const getListingTypeBadgeClass = (listingType: ListingType) => {
	const classes: Record<ListingType, string> = {
		rent: styles.badgeRent,
		sale: styles.badgeSale,
		both: styles.badgeBoth,
	}
	return classes[listingType]
}

const getStatusBadgeClass = (status: PropertyStatus) => {
	const classes: Record<PropertyStatus, string> = {
		available: styles.badgeAvailable,
		rented: styles.badgeRented,
		sold: styles.badgeSold,
		maintenance: styles.badgeMaintenance,
		unavailable: styles.badgeUnavailable,
	}
	return classes[status]
}

const formatCurrency = (value: number | null) => {
	if (value === null || value === undefined) return null
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value / 100)
}

const typeOptions = [
	{ value: '', label: 'Todos' },
	{ value: 'house', label: 'Casa' },
	{ value: 'apartment', label: 'Apartamento' },
	{ value: 'land', label: 'Terreno' },
	{ value: 'commercial', label: 'Comercial' },
	{ value: 'rural', label: 'Rural' },
]

const listingTypeFilterOptions = [
	{ value: '', label: 'Todas' },
	{ value: 'rent', label: 'Locacao' },
	{ value: 'sale', label: 'Venda' },
	{ value: 'both', label: 'Ambos' },
]

const statusOptions = [
	{ value: '', label: 'Todos' },
	{ value: 'available', label: 'Disponivel' },
	{ value: 'rented', label: 'Alugado' },
	{ value: 'sold', label: 'Vendido' },
	{ value: 'maintenance', label: 'Manutencao' },
	{ value: 'unavailable', label: 'Indisponivel' },
]

const sortByOptions = [
	{ value: 'title', label: 'Titulo' },
	{ value: 'createdAt', label: 'Data de cadastro' },
	{ value: 'rentalPrice', label: 'Preco de aluguel' },
	{ value: 'salePrice', label: 'Preco de venda' },
	{ value: 'city', label: 'Cidade' },
	{ value: 'area', label: 'Area' },
]

const sortOrderOptions = [
	{ value: 'asc', label: 'Crescente' },
	{ value: 'desc', label: 'Decrescente' },
]

export function PropertiesPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
	const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)

	const limit = 20

	// Extrair estados da URL
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1
	const typeFilter = (searchParams.get('type') || '') as PropertyType | ''
	const statusFilter = (searchParams.get('status') || '') as PropertyStatus | ''
	const listingTypeFilter = (searchParams.get('listingType') || '') as ListingType | ''
	const state = searchParams.get('state') || undefined
	const city = searchParams.get('city') || undefined
	const minBedrooms = searchParams.get('minBedrooms') || undefined
	const maxBedrooms = searchParams.get('maxBedrooms') || undefined
	const sortBy = (searchParams.get('sortBy') as PropertySortBy) || 'title'
	const sortOrder = (searchParams.get('sortOrder') as PropertySortOrder) || 'asc'

	const modalAction = searchParams.get('modal')
	const editId = searchParams.get('id')

	const isCreateModalOpen = modalAction === 'create'
	const isEditModalOpen = modalAction === 'edit' && !!editId
	const isDeleteDialogOpen = modalAction === 'delete' && !!editId

	// Conta quantos filtros avancados estao ativos
	const activeFiltersCount = [
		typeFilter,
		statusFilter,
		listingTypeFilter,
		state,
		city,
		minBedrooms,
		maxBedrooms,
	].filter(Boolean).length

	const { data, isLoading, error } = usePropertiesQuery({
		search: search || undefined,
		type: typeFilter || undefined,
		status: statusFilter || undefined,
		listingType: listingTypeFilter || undefined,
		state,
		city,
		minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
		maxBedrooms: maxBedrooms ? Number(maxBedrooms) : undefined,
		sortBy,
		sortOrder,
		page,
		limit,
	})

	const { data: editPropertyData, isLoading: isLoadingProperty } = usePropertyQuery(editId || '', {
		enabled: isEditModalOpen,
	})

	const deleteMutation = useDeletePropertyMutation()

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

	const clearAllFilters = () => {
		const newParams = new URLSearchParams()
		if (searchParams.get('modal')) {
			newParams.set('modal', searchParams.get('modal')!)
		}
		if (searchParams.get('id')) {
			newParams.set('id', searchParams.get('id')!)
		}
		setSearchParams(newParams)
	}

	const handleSort = (field: PropertySortBy) => {
		if (sortBy === field) {
			updateSearchParams({
				sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
				page: '1',
			})
		} else {
			updateSearchParams({
				sortBy: field,
				sortOrder: 'asc',
				page: '1',
			})
		}
	}

	const getSortIcon = (field: PropertySortBy) => {
		const isActive = sortBy === field
		if (isActive) {
			return sortOrder === 'asc' ? (
				<ArrowUpAZ size={14} className={styles.sortIconActive} />
			) : (
				<ArrowDownAZ size={14} className={styles.sortIconActive} />
			)
		}
		return <ArrowUpAZ size={14} className={styles.sortIcon} />
	}

	const openCreateModal = () => {
		updateSearchParams({ modal: 'create' })
	}

	const viewPropertyDetails = (property: Property) => {
		navigate(`/properties/${property.id}`)
	}

	const openEditModal = (property: Property) => {
		updateSearchParams({ modal: 'edit', id: property.id })
	}

	const openDeleteDialog = (property: Property) => {
		setPropertyToDelete(property)
		updateSearchParams({ modal: 'delete', id: property.id })
	}

	const closeModal = useCallback(() => {
		setSearchParams((prevParams) => {
			const newParams = new URLSearchParams(prevParams)
			newParams.delete('modal')
			newParams.delete('id')
			return newParams
		})
		setPropertyToDelete(null)
	}, [setSearchParams])

	const handleConfirmDelete = useCallback(async () => {
		if (!propertyToDelete?.id) return

		try {
			await deleteMutation.mutateAsync(propertyToDelete.id)
			closeModal()
		} catch {
			// Error is handled by the mutation
		}
	}, [propertyToDelete?.id, deleteMutation, closeModal])

	const getPaginationPages = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
		const pages: (number | 'ellipsis')[] = []
		const showEllipsisThreshold = 7

		if (totalPages <= showEllipsisThreshold) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
			return pages
		}

		// Always show first page
		pages.push(1)

		if (currentPage > 3) {
			pages.push('ellipsis')
		}

		// Pages around current
		const start = Math.max(2, currentPage - 1)
		const end = Math.min(totalPages - 1, currentPage + 1)

		for (let i = start; i <= end; i++) {
			pages.push(i)
		}

		if (currentPage < totalPages - 2) {
			pages.push('ellipsis')
		}

		// Always show last page
		if (totalPages > 1) {
			pages.push(totalPages)
		}

		return pages
	}

	return (
		<AdminLayout>
			<div className={styles.sectionHeader}>
				<div className={styles.sectionTitleWrapper}>
					<h2 className={styles.sectionTitle}>Imoveis</h2>
					<p className={styles.sectionDescription}>
						{data?.total || 0} {data?.total === 1 ? 'imovel cadastrado' : 'imoveis cadastrados'}
					</p>
				</div>
				<Button onClick={openCreateModal} variant="primary">
					<Plus size={20} />
					Adicionar Imovel
				</Button>
			</div>

			<div className={styles.filtersCard}>
				<div className={styles.filterRow}>
					<div className={styles.filterItem} style={{ flex: 2 }}>
						<label className={styles.filterLabel} htmlFor="search-filter">
							Buscar
						</label>
						<Input
							id="search-filter"
							value={search}
							onChange={(e) => {
								updateSearchParams({ search: e.target.value, page: '1' })
							}}
							placeholder="Buscar por titulo, endereco, cidade..."
							fullWidth
						/>
					</div>
					<div className={styles.filterItem}>
						<label className={styles.filterLabel} htmlFor="type-filter">
							Tipo
						</label>
						<Select
							id="type-filter"
							value={typeFilter}
							onChange={(e) => {
								updateSearchParams({ type: e.target.value, page: '1' })
							}}
							options={typeOptions}
							fullWidth
						/>
					</div>
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
					<div className={styles.filterActions}>
						<Button
							variant="outline"
							size="small"
							onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
							title={
								showAdvancedFilters ? 'Ocultar filtros avancados' : 'Mostrar filtros avancados'
							}
						>
							<Filter size={16} />
							Filtros
							{activeFiltersCount > 0 && (
								<span className={styles.filterBadge}>{activeFiltersCount}</span>
							)}
							{showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
						</Button>
						{(search || activeFiltersCount > 0 || sortBy !== 'title' || sortOrder !== 'asc') && (
							<Button
								variant="outline"
								size="small"
								onClick={clearAllFilters}
								title="Limpar filtros"
							>
								<RotateCcw size={16} />
								Resetar
							</Button>
						)}
					</div>
				</div>

				{showAdvancedFilters && (
					<>
						<div className={styles.filterDivider} />
						<div className={styles.filterRow}>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="listing-type-filter">
									Finalidade
								</label>
								<Select
									id="listing-type-filter"
									value={listingTypeFilter}
									onChange={(e) => {
										updateSearchParams({ listingType: e.target.value, page: '1' })
									}}
									options={listingTypeFilterOptions}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="state-filter">
									Estado
								</label>
								<Select
									id="state-filter"
									value={state || ''}
									onChange={(e) => {
										updateSearchParams({ state: e.target.value, page: '1' })
									}}
									options={[
										{ value: '', label: 'Todos' },
										...BRAZILIAN_STATES.map((s) => ({ value: s.value, label: s.label })),
									]}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="city-filter">
									Cidade
								</label>
								<Input
									id="city-filter"
									value={city || ''}
									onChange={(e) => {
										updateSearchParams({ city: e.target.value, page: '1' })
									}}
									placeholder="Filtrar por cidade..."
									fullWidth
								/>
							</div>
						</div>
						<div className={styles.filterRow} style={{ marginTop: '16px' }}>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="minBedrooms-filter">
									Min. Quartos
								</label>
								<Input
									id="minBedrooms-filter"
									type="number"
									min="0"
									value={minBedrooms || ''}
									onChange={(e) => {
										updateSearchParams({ minBedrooms: e.target.value, page: '1' })
									}}
									placeholder="0"
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="maxBedrooms-filter">
									Max. Quartos
								</label>
								<Input
									id="maxBedrooms-filter"
									type="number"
									min="0"
									value={maxBedrooms || ''}
									onChange={(e) => {
										updateSearchParams({ maxBedrooms: e.target.value, page: '1' })
									}}
									placeholder="10"
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="sortBy-filter">
									Ordenar por
								</label>
								<Select
									id="sortBy-filter"
									value={sortBy}
									onChange={(e) => {
										updateSearchParams({ sortBy: e.target.value, page: '1' })
									}}
									options={sortByOptions}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="sortOrder-filter">
									Ordem
								</label>
								<Select
									id="sortOrder-filter"
									value={sortOrder}
									onChange={(e) => {
										updateSearchParams({ sortOrder: e.target.value, page: '1' })
									}}
									options={sortOrderOptions}
									fullWidth
								/>
							</div>
						</div>
					</>
				)}
			</div>

			{isLoading && (
				<div className={styles.tableWrapper}>
					<table className={styles.table}>
						<thead className={styles.tableHeader}>
							<tr>
								<th className={`${styles.tableHeaderCell} ${styles.colProperty}`}>Imovel</th>
								<th className={`${styles.tableHeaderCell} ${styles.colType}`}>Tipo</th>
								<th className={`${styles.tableHeaderCell} ${styles.colListingType}`}>Finalidade</th>
								<th className={`${styles.tableHeaderCell} ${styles.colStatus}`}>Status</th>
								<th className={`${styles.tableHeaderCell} ${styles.colPrices}`}>Valores</th>
								<th className={`${styles.tableHeaderCell} ${styles.colFeatures}`}>Area</th>
								<th className={`${styles.tableHeaderCell} ${styles.colActions}`}>Acoes</th>
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: 5 }).map((_, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list with fixed order
								<tr key={index} className={styles.tableRow}>
									<td className={`${styles.tableCell} ${styles.colProperty}`}>
										<div className={styles.propertyMainInfo}>
											<Skeleton width={48} height={48} variant="rounded" />
											<div className={styles.propertyInfo}>
												<Skeleton width={140} height={14} variant="rounded" />
												<Skeleton width={100} height={12} variant="rounded" />
											</div>
										</div>
									</td>
									<td className={`${styles.tableCell} ${styles.colType}`}>
										<Skeleton width={70} height={20} variant="rounded" />
									</td>
									<td className={`${styles.tableCell} ${styles.colListingType}`}>
										<Skeleton width={60} height={20} variant="rounded" />
									</td>
									<td className={`${styles.tableCell} ${styles.colStatus}`}>
										<Skeleton width={70} height={20} variant="rounded" />
									</td>
									<td className={`${styles.tableCell} ${styles.colPrices}`}>
										<div className={styles.priceInfo}>
											<Skeleton width={100} height={13} variant="rounded" />
											<Skeleton width={80} height={13} variant="rounded" />
										</div>
									</td>
									<td className={`${styles.tableCell} ${styles.colFeatures}`}>
										<Skeleton width={60} height={13} variant="rounded" />
									</td>
									<td className={`${styles.tableCell} ${styles.colActions}`}>
										<div className={styles.actions}>
											<Skeleton width={30} height={30} variant="rounded" />
											<Skeleton width={30} height={30} variant="rounded" />
											<Skeleton width={30} height={30} variant="rounded" />
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{error && (
				<EmptyState
					icon={Building2}
					title="Erro ao carregar imoveis"
					description="Nao foi possivel carregar os imoveis. Tente novamente."
				/>
			)}

			{!isLoading && !error && data && data.data.length === 0 && (
				<EmptyState
					icon={search || activeFiltersCount > 0 ? SearchX : Building2}
					title={
						search || activeFiltersCount > 0
							? 'Nenhum imovel encontrado'
							: 'Nenhum imovel cadastrado'
					}
					description={
						search || activeFiltersCount > 0
							? 'Nenhum imovel corresponde aos filtros aplicados. Tente ajustar os criterios de busca.'
							: 'Adicione imoveis para comecar a gerenciar seu portfolio.'
					}
					action={
						search || activeFiltersCount > 0
							? {
									label: 'Limpar Filtros',
									onClick: clearAllFilters,
								}
							: {
									label: 'Adicionar Primeiro Imovel',
									onClick: openCreateModal,
								}
					}
				/>
			)}

			{!isLoading && !error && data && data.data.length > 0 && (
				<>
					<div className={styles.tableWrapper}>
						<table className={styles.table}>
							<thead className={styles.tableHeader}>
								<tr>
									<th
										className={`${styles.tableHeaderCell} ${styles.colProperty} ${styles.sortableHeader}`}
										onClick={() => handleSort('title')}
									>
										<span className={styles.sortableHeaderContent}>
											Imovel {getSortIcon('title')}
										</span>
									</th>
									<th className={`${styles.tableHeaderCell} ${styles.colType}`}>Tipo</th>
									<th className={`${styles.tableHeaderCell} ${styles.colListingType}`}>
										Finalidade
									</th>
									<th className={`${styles.tableHeaderCell} ${styles.colStatus}`}>Status</th>
									<th
										className={`${styles.tableHeaderCell} ${styles.colPrices} ${styles.sortableHeader}`}
										onClick={() => handleSort('rentalPrice')}
									>
										<span className={styles.sortableHeaderContent}>
											Valores {getSortIcon('rentalPrice')}
										</span>
									</th>
									<th
										className={`${styles.tableHeaderCell} ${styles.colFeatures} ${styles.sortableHeader}`}
										onClick={() => handleSort('area')}
									>
										<span className={styles.sortableHeaderContent}>Area {getSortIcon('area')}</span>
									</th>
									<th className={`${styles.tableHeaderCell} ${styles.colActions}`}>Acoes</th>
								</tr>
							</thead>
							<tbody>
								{data.data.map((property) => {
									const rentalPriceFormatted = formatCurrency(property.rentalPrice)
									const salePriceFormatted = formatCurrency(property.salePrice)

									return (
										<tr key={property.id} className={styles.tableRow}>
											<td className={`${styles.tableCell} ${styles.colProperty}`}>
												<div className={styles.propertyMainInfo}>
													{property.primaryPhoto ? (
														<img
															src={property.primaryPhoto.url}
															alt={property.title}
															className={styles.propertyThumbnail}
														/>
													) : (
														<div className={styles.propertyThumbnailFallback}>
															<Home size={20} />
														</div>
													)}
													<div className={styles.propertyInfo}>
														<span className={styles.propertyTitle}>{property.title}</span>
														<div className={styles.propertyMeta}>
															{property.code && (
																<span className={styles.propertyCode}>#{property.code}</span>
															)}
															{(property.city || property.state) && (
																<span className={styles.propertyAddress}>
																	<MapPin size={10} style={{ marginRight: 2 }} />
																	{property.city && property.state
																		? `${property.city}/${property.state}`
																		: property.city || property.state}
																</span>
															)}
														</div>
													</div>
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colType}`}>
												<span className={`${styles.badge} ${getTypeBadgeClass(property.type)}`}>
													{propertyTypeLabels[property.type]}
												</span>
											</td>
											<td className={`${styles.tableCell} ${styles.colListingType}`}>
												<span
													className={`${styles.badge} ${getListingTypeBadgeClass(property.listingType)}`}
												>
													{listingTypeLabels[property.listingType]}
												</span>
											</td>
											<td className={`${styles.tableCell} ${styles.colStatus}`}>
												<span className={`${styles.badge} ${getStatusBadgeClass(property.status)}`}>
													{statusLabels[property.status]}
												</span>
											</td>
											<td className={`${styles.tableCell} ${styles.colPrices}`}>
												<div className={styles.priceInfo}>
													{(property.listingType === 'rent' || property.listingType === 'both') && (
														<div className={styles.priceRow}>
															{rentalPriceFormatted ? (
																<>
																	<span className={styles.priceLabel}>Aluguel:</span>
																	<span className={styles.priceValue}>{rentalPriceFormatted}</span>
																</>
															) : (
																<span className={styles.priceValueMuted}>Aluguel: -</span>
															)}
														</div>
													)}
													{(property.listingType === 'sale' || property.listingType === 'both') && (
														<div className={styles.priceRow}>
															{salePriceFormatted ? (
																<>
																	<span className={styles.priceLabel}>Venda:</span>
																	<span className={styles.priceValue}>{salePriceFormatted}</span>
																</>
															) : (
																<span className={styles.priceValueMuted}>Venda: -</span>
															)}
														</div>
													)}
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colFeatures}`}>
												<div className={styles.featureRow}>
													<Ruler
														size={14}
														className={property.area ? styles.featureIcon : styles.featureIconMuted}
													/>
													<span
														className={property.area ? styles.featureText : styles.featureTextMuted}
													>
														{property.area ? `${property.area}m²` : '-'}
													</span>
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colActions}`}>
												<div className={styles.actions}>
													<button
														type="button"
														className={styles.iconButton}
														onClick={() => viewPropertyDetails(property)}
														title="Ver detalhes"
													>
														<Eye size={16} />
													</button>
													<button
														type="button"
														className={styles.iconButton}
														onClick={() => openEditModal(property)}
														title="Editar imovel"
													>
														<Edit size={16} />
													</button>
													<button
														type="button"
														className={`${styles.iconButton} ${styles.iconButtonDanger}`}
														onClick={() => openDeleteDialog(property)}
														title="Excluir imovel"
													>
														<Trash2 size={16} />
													</button>
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>

					{data.totalPages > 1 && (
						<div className={styles.pagination}>
							<div className={styles.paginationInfo}>
								Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, data.total)} de{' '}
								{data.total} imoveis
							</div>
							<div className={styles.paginationButtons}>
								<button
									type="button"
									className={styles.paginationButton}
									onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
									disabled={page === 1}
									title="Pagina anterior"
								>
									<ChevronLeft size={16} />
								</button>

								{getPaginationPages(page, data.totalPages).map((pageNum, index) =>
									pageNum === 'ellipsis' ? (
										// biome-ignore lint/suspicious/noArrayIndexKey: Ellipsis items have no unique identifier
										<span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>
											...
										</span>
									) : (
										<button
											key={pageNum}
											type="button"
											className={`${styles.paginationButton} ${
												page === pageNum ? styles.paginationButtonActive : ''
											}`}
											onClick={() => updateSearchParams({ page: String(pageNum) })}
										>
											{pageNum}
										</button>
									),
								)}

								<button
									type="button"
									className={styles.paginationButton}
									onClick={() =>
										updateSearchParams({ page: String(Math.min(data.totalPages, page + 1)) })
									}
									disabled={page === data.totalPages}
									title="Proxima pagina"
								>
									<ChevronRight size={16} />
								</button>
							</div>
						</div>
					)}
				</>
			)}

			<CreatePropertyModal isOpen={isCreateModalOpen} onClose={closeModal} />

			<EditPropertyModal
				isOpen={isEditModalOpen}
				onClose={closeModal}
				property={editPropertyData || null}
				isLoading={isLoadingProperty}
			/>

			<ConfirmDialog
				isOpen={isDeleteDialogOpen && !!propertyToDelete}
				onClose={closeModal}
				onConfirm={handleConfirmDelete}
				title="Excluir Imovel"
				description={`Tem certeza que deseja excluir <strong>${propertyToDelete?.title || ''}</strong>? Esta acao nao pode ser desfeita.`}
				confirmText="Excluir"
				cancelText="Cancelar"
				isLoading={deleteMutation.isPending}
				variant="danger"
				requireConfirmation
				confirmationText="EXCLUIR"
			/>
		</AdminLayout>
	)
}
