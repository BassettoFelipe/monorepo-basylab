import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const container = style({
	width: '100%',
})

export const label = style({
	display: 'block',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.sm,
})

export const dropZone = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.lg,
	border: `2px dashed ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		borderColor: vars.color.primary.dark,
		backgroundColor: '#fafff0',
	},
})

export const dropZoneDragging = style({
	borderColor: vars.color.primary.dark,
	backgroundColor: '#fafff0',
	transform: 'scale(1.01)',
})

export const dropZoneDisabled = style({
	opacity: 0.6,
	cursor: 'not-allowed',

	':hover': {
		borderColor: vars.color.border.primary,
		backgroundColor: vars.color.bg.secondary,
	},
})

export const icon = style({
	color: vars.color.text.secondary,
})

export const dropText = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	textAlign: 'center',
})

export const dropHint = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textAlign: 'center',
})

export const hiddenInput = style({
	display: 'none',
})

export const photosGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
	gap: vars.spacing.md,
	marginTop: vars.spacing.md,
})

export const photoCard = style({
	position: 'relative',
	aspectRatio: '4/3',
	borderRadius: vars.borderRadius.md,
	overflow: 'hidden',
	border: `1px solid ${vars.color.border.primary}`,
	backgroundColor: vars.color.bg.secondary,
})

export const photoCardPrimary = style({
	border: `2px solid ${vars.color.primary.main}`,
	boxShadow: '0 0 0 2px rgba(230, 255, 75, 0.3)',
})

export const photoImage = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
})

export const photoOverlay = style({
	position: 'absolute',
	inset: 0,
	background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
	opacity: 0,
	transition: `opacity ${vars.transitionDuration.base}`,

	selectors: {
		[`${photoCard}:hover &`]: {
			opacity: 1,
		},
	},
})

export const photoActions = style({
	position: 'absolute',
	bottom: vars.spacing.sm,
	left: vars.spacing.sm,
	right: vars.spacing.sm,
	display: 'flex',
	gap: vars.spacing.xs,
	justifyContent: 'center',
})

export const photoActionButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '32px',
	height: '32px',
	padding: 0,
	border: 'none',
	borderRadius: vars.borderRadius.md,
	backgroundColor: 'rgba(255, 255, 255, 0.9)',
	color: vars.color.text.primary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: '#fff',
		transform: 'scale(1.1)',
	},

	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
	},
})

export const photoActionButtonDanger = style({
	':hover': {
		backgroundColor: vars.color.error.light,
		color: vars.color.error.main,
	},
})

export const primaryBadge = style({
	position: 'absolute',
	top: vars.spacing.sm,
	left: vars.spacing.sm,
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `2px ${vars.spacing.sm}`,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: '#fff',
	backgroundColor: vars.color.primary.main,
	borderRadius: vars.borderRadius.full,
})

const spin = keyframes({
	'0%': { transform: 'rotate(0deg)' },
	'100%': { transform: 'rotate(360deg)' },
})

export const uploadingOverlay = style({
	position: 'absolute',
	inset: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: 'rgba(255, 255, 255, 0.8)',
})

export const spinner = style({
	animation: `${spin} 1s linear infinite`,
	color: vars.color.primary.main,
})

export const errorMessage = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.error.main,
	marginTop: vars.spacing.xs,
})

export const emptyState = style({
	textAlign: 'center',
	padding: vars.spacing.xl,
	color: vars.color.text.secondary,
})
