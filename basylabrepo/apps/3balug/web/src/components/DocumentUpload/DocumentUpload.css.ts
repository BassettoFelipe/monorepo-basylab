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

export const uploadSection = style({
	display: 'flex',
	gap: vars.spacing.md,
	marginBottom: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			flexDirection: 'column',
		},
	},
})

export const selectWrapper = style({
	flex: '0 0 200px',

	'@media': {
		'(max-width: 640px)': {
			flex: '1',
		},
	},
})

export const dropZone = style({
	flex: 1,
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
	minHeight: '120px',

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

export const documentsList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const documentCard = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		borderColor: vars.color.primary.main,
		backgroundColor: '#fafff0',
	},
})

export const documentIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '40px',
	height: '40px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const documentIconPdf = style({
	backgroundColor: '#fee2e2',
	color: '#dc2626',
})

export const documentIconImage = style({
	backgroundColor: '#dbeafe',
	color: '#2563eb',
})

export const documentInfo = style({
	flex: 1,
	minWidth: 0,
})

export const documentName = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

export const documentMeta = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	marginTop: '2px',
})

export const documentTypeBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `2px ${vars.spacing.sm}`,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.primary.dark,
	backgroundColor: '#fafff0',
	borderRadius: vars.borderRadius.full,
	border: `1px solid ${vars.color.primary.main}`,
})

export const documentActions = style({
	display: 'flex',
	gap: vars.spacing.xs,
	flexShrink: 0,
})

export const actionButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '32px',
	height: '32px',
	padding: 0,
	border: 'none',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: vars.color.bg.tertiary,
		color: vars.color.text.primary,
	},

	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
	},
})

export const actionButtonDanger = style({
	':hover': {
		backgroundColor: vars.color.error.light,
		color: vars.color.error.main,
	},
})

const spin = keyframes({
	'0%': { transform: 'rotate(0deg)' },
	'100%': { transform: 'rotate(360deg)' },
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
	fontSize: vars.fontSize.sm,
})

export const select = style({
	width: '100%',
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	fontSize: vars.fontSize.sm,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.primary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		borderColor: vars.color.primary.main,
	},

	':focus': {
		outline: 'none',
		borderColor: vars.color.primary.main,
		boxShadow: '0 0 0 2px rgba(230, 255, 75, 0.3)',
	},
})
