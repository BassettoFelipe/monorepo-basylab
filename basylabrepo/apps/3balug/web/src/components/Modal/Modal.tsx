import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import * as styles from './Modal.css'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: ReactNode
	footer?: ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
	customHeader?: ReactNode
}

export function Modal({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size = 'md',
	customHeader,
}: ModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null)
	const previousActiveElement = useRef<HTMLElement | null>(null)

	// Gerencia focus trap e restaura focus ao fechar
	useEffect(() => {
		if (isOpen && dialogRef.current) {
			// Salva o elemento que tinha focus antes de abrir o modal
			previousActiveElement.current = document.activeElement as HTMLElement

			// Foca no primeiro elemento focável dentro do modal
			const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			)
			if (focusableElements.length > 0) {
				focusableElements[0].focus()
			}

			// Previne scroll do body quando modal está aberto
			document.body.style.overflow = 'hidden'
		}

		return () => {
			document.body.style.overflow = 'unset'
			// Restaura focus ao elemento anterior quando o modal fecha
			if (previousActiveElement.current && !isOpen) {
				previousActiveElement.current.focus()
			}
		}
	}, [isOpen])

	// Fecha modal com ESC
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	// Focus trap - mantém o focus dentro do modal
	useEffect(() => {
		if (!isOpen || !dialogRef.current) return

		const handleTabKey = (event: KeyboardEvent) => {
			if (event.key !== 'Tab' || !dialogRef.current) return

			const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
			)

			if (focusableElements.length === 0) return

			const firstElement = focusableElements[0]
			const lastElement = focusableElements[focusableElements.length - 1]

			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault()
				lastElement.focus()
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault()
				firstElement.focus()
			}
		}

		document.addEventListener('keydown', handleTabKey)
		return () => document.removeEventListener('keydown', handleTabKey)
	}, [isOpen])

	const handleOverlayClick = useCallback(() => {
		onClose()
	}, [onClose])

	if (!isOpen) return null

	const modalSizeClass =
		size === 'sm'
			? styles.modalSm
			: size === 'lg'
				? styles.modalLg
				: size === 'xl'
					? styles.modalXl
					: size === 'full'
						? styles.modalFull
						: styles.modalMd

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Presentational overlay - click closes modal, ESC key handler via useEffect
		<div className={styles.overlay} onClick={handleOverlayClick} role="presentation">
			<dialog
				ref={dialogRef}
				className={`${styles.modal} ${modalSizeClass}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				open
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				{customHeader ? (
					customHeader
				) : (
					<div className={styles.header}>
						<h2 id="modal-title" className={styles.title}>
							{title}
						</h2>
						<button
							type="button"
							className={styles.closeButton}
							onClick={onClose}
							aria-label="Fechar modal"
						>
							<X size={20} />
						</button>
					</div>
				)}
				<div className={styles.body}>{children}</div>
				{footer && <div className={styles.footer}>{footer}</div>}
			</dialog>
		</div>
	)
}
