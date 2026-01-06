import { AlertTriangle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../Button/Button'
import * as styles from './ConfirmDialog.css'

interface ConfirmDialogProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	title: string
	description: string
	confirmText?: string
	cancelText?: string
	isLoading?: boolean
	variant?: 'danger' | 'warning'
	requireConfirmation?: boolean
	confirmationText?: string
}

export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmText = 'Confirmar',
	cancelText = 'Cancelar',
	isLoading = false,
	variant = 'danger',
	requireConfirmation = false,
	confirmationText = 'EXCLUIR',
}: ConfirmDialogProps) {
	const [inputValue, setInputValue] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	// Unified effect for keyboard handling and body overflow
	useEffect(() => {
		if (!isOpen) {
			setInputValue('')
			return
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !isLoading) {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		document.body.style.overflow = 'hidden'

		// Focus input when dialog opens (replaces autoFocus)
		if (requireConfirmation) {
			inputRef.current?.focus()
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = 'unset'
		}
	}, [isOpen, onClose, isLoading, requireConfirmation])

	const handleOverlayClick = useCallback(() => {
		if (!isLoading) {
			onClose()
		}
	}, [isLoading, onClose])

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value.toUpperCase())
	}, [])

	const handleOverlayKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				handleOverlayClick()
			}
		},
		[handleOverlayClick],
	)

	if (!isOpen) return null

	const isConfirmDisabled = requireConfirmation && inputValue !== confirmationText

	return (
		<div
			className={styles.overlay}
			onClick={handleOverlayClick}
			onKeyDown={handleOverlayKeyDown}
			role="presentation"
		>
			<div
				className={styles.dialog}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-dialog-title"
			>
				<div className={styles.iconWrapper}>
					<AlertTriangle size={24} />
				</div>
				<h3 id="confirm-dialog-title" className={styles.title}>
					{title}
				</h3>
				<p className={styles.description}>{description}</p>

				{requireConfirmation && (
					<>
						<p className={styles.confirmText}>
							Digite <strong>{confirmationText}</strong> para confirmar:
						</p>
						<input
							ref={inputRef}
							type="text"
							className={styles.confirmInput}
							value={inputValue}
							onChange={handleInputChange}
							placeholder={confirmationText}
							disabled={isLoading}
						/>
					</>
				)}

				<div className={styles.actions}>
					<Button
						variant={variant}
						onClick={onConfirm}
						loading={isLoading}
						disabled={isConfirmDisabled || isLoading}
					>
						{confirmText}
					</Button>
					<Button variant="outline" onClick={onClose} disabled={isLoading}>
						{cancelText}
					</Button>
				</div>
			</div>
		</div>
	)
}
