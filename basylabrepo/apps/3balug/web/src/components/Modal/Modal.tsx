import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import * as styles from './Modal.css'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: ReactNode
	footer?: ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
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

	if (!isOpen) return null

	const modalSizeClass =
		size === 'sm'
			? styles.modalSm
			: size === 'lg'
				? styles.modalLg
				: size === 'xl'
					? styles.modalXl
					: styles.modalMd

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: Overlay click-to-dismiss is a common UX pattern, keyboard users can use Escape key
		<div className={styles.overlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${modalSizeClass}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
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
				<div className={styles.body}>{children}</div>
				{footer && <div className={styles.footer}>{footer}</div>}
			</div>
		</div>
	)
}
