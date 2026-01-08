import { Building2, Check, ChevronDown, Loader2, Mail, MapPin, Phone, Search, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar/Avatar'
import type { PropertyOwner } from '@/types/property-owner.types'
import { applyMask } from '@/utils/masks'
import * as styles from './OwnerSelect.css'

interface OwnerSelectProps {
	owners: PropertyOwner[]
	value: string
	onChange: (ownerId: string) => void
	label?: string
	error?: string
	required?: boolean
	disabled?: boolean
	isLoading?: boolean
	fullWidth?: boolean
	placeholder?: string
}

export function OwnerSelect({
	owners,
	value,
	onChange,
	label,
	error,
	required = false,
	disabled = false,
	isLoading = false,
	fullWidth = true,
	placeholder = 'Selecione o proprietario',
}: OwnerSelectProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const containerRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	const selectedOwner = useMemo(() => {
		return owners.find((owner) => owner.id === value)
	}, [owners, value])

	const filteredOwners = useMemo(() => {
		if (!searchTerm.trim()) return owners

		const term = searchTerm.toLowerCase()
		return owners.filter((owner) => {
			const searchableFields = [
				owner.name,
				owner.document,
				owner.email,
				owner.phone,
				owner.city,
				owner.neighborhood,
			]
			return searchableFields.some((field) => field?.toLowerCase().includes(term))
		})
	}, [owners, searchTerm])

	const handleToggle = useCallback(() => {
		if (disabled || isLoading) return
		setIsOpen((prev) => !prev)
	}, [disabled, isLoading])

	const handleSelect = useCallback(
		(ownerId: string) => {
			onChange(ownerId)
			setIsOpen(false)
			setSearchTerm('')
		},
		[onChange],
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false)
				setSearchTerm('')
			} else if (e.key === 'Enter' && !isOpen) {
				e.preventDefault()
				setIsOpen(true)
			}
		},
		[isOpen],
	)

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false)
				setSearchTerm('')
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Focus search input when dropdown opens
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}, [isOpen])

	const formatDocument = (owner: PropertyOwner) => {
		return applyMask(owner.document, owner.documentType)
	}

	const formatLocation = (owner: PropertyOwner) => {
		const parts = [owner.city, owner.state].filter(Boolean)
		return parts.length > 0 ? parts.join(' - ') : null
	}

	const containerClasses = [styles.container, fullWidth && styles.fullWidth]
		.filter(Boolean)
		.join(' ')

	const triggerClasses = [
		styles.selectTrigger,
		error && styles.selectTriggerError,
		disabled && styles.selectTriggerDisabled,
		isOpen && styles.selectTriggerOpen,
	]
		.filter(Boolean)
		.join(' ')

	const chevronClasses = [styles.chevronIcon, isOpen && styles.chevronIconOpen]
		.filter(Boolean)
		.join(' ')

	return (
		<div className={containerClasses} ref={containerRef}>
			{label && (
				<label className={styles.label}>
					{label}
					{required && <span className={styles.required}>*</span>}
				</label>
			)}

			<div className={styles.dropdownWrapper}>
				<div
					className={triggerClasses}
					onClick={handleToggle}
					onKeyDown={handleKeyDown}
					tabIndex={disabled ? -1 : 0}
					role="combobox"
					aria-expanded={isOpen}
					aria-haspopup="listbox"
					aria-disabled={disabled}
				>
					{isLoading ? (
						<div className={styles.loadingContainer}>
							<Loader2 size={18} className={styles.loadingSpinner} />
							<span>Carregando...</span>
						</div>
					) : selectedOwner ? (
						<div className={styles.selectedOwnerTrigger}>
							<Avatar
								src={selectedOwner.photoUrl}
								name={selectedOwner.name}
								size="small"
							/>
							<div className={styles.selectedOwnerInfo}>
								<span className={styles.selectedOwnerName}>{selectedOwner.name}</span>
								<span className={styles.selectedOwnerDocument}>
									{formatDocument(selectedOwner)}
								</span>
							</div>
						</div>
					) : (
						<span className={styles.placeholder}>{placeholder}</span>
					)}
					<ChevronDown size={20} className={chevronClasses} />
				</div>

				{isOpen && (
					<div className={styles.dropdown}>
						<div className={styles.searchContainer}>
							<div className={styles.searchWrapper}>
								<Search size={16} className={styles.searchIcon} />
								<input
									ref={searchInputRef}
									type="text"
									className={styles.searchInput}
									placeholder="Buscar por nome, documento, email..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						<div className={styles.optionsList} role="listbox">
							{filteredOwners.length === 0 ? (
								<div className={styles.noResults}>
									{searchTerm
										? 'Nenhum proprietario encontrado'
										: 'Nenhum proprietario cadastrado'}
								</div>
							) : (
								filteredOwners.map((owner) => {
									const isSelected = owner.id === value
									const location = formatLocation(owner)

									return (
										<div
											key={owner.id}
											className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
											onClick={() => handleSelect(owner.id)}
											role="option"
											aria-selected={isSelected}
										>
											<Avatar src={owner.photoUrl} name={owner.name} size="small" />
											<div className={styles.optionInfo}>
												<span className={styles.optionName}>{owner.name}</span>
												<div className={styles.optionMeta}>
													<span className={styles.optionMetaItem}>
														<User size={12} />
														{formatDocument(owner)}
													</span>
													{location && (
														<span className={styles.optionMetaItem}>
															<MapPin size={12} />
															{location}
														</span>
													)}
												</div>
											</div>
											{isSelected && <Check size={18} className={styles.checkIcon} />}
										</div>
									)
								})
							)}
						</div>
					</div>
				)}
			</div>

			{error && <span className={styles.errorMessage}>{error}</span>}

			{/* Preview Card - Dados complementares */}
			{selectedOwner && (
				<div className={styles.previewCard}>
					{selectedOwner.email && (
						<div className={styles.previewMetaItem}>
							<Mail size={14} className={styles.previewMetaIcon} />
							<span>{selectedOwner.email}</span>
						</div>
					)}
					{selectedOwner.phone && (
						<div className={styles.previewMetaItem}>
							<Phone size={14} className={styles.previewMetaIcon} />
							<span>{applyMask(selectedOwner.phone, 'phone')}</span>
						</div>
					)}
					{selectedOwner.city && (
						<div className={styles.previewMetaItem}>
							<MapPin size={14} className={styles.previewMetaIcon} />
							<span>{selectedOwner.city}{selectedOwner.state ? ` - ${selectedOwner.state}` : ''}</span>
						</div>
					)}
					{selectedOwner.propertiesCount !== undefined && (
						<div className={styles.previewMetaItem}>
							<Building2 size={14} className={styles.previewMetaIcon} />
							<span>{selectedOwner.propertiesCount} {selectedOwner.propertiesCount === 1 ? 'imovel' : 'imoveis'}</span>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
