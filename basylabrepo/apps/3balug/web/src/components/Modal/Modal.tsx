import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect } from 'react'
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
	// Fecha modal com ESC
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
			// Previne scroll do body quando modal está aberto
			document.body.style.overflow = 'hidden'
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = 'unset'
		}
	}, [isOpen, onClose])

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
