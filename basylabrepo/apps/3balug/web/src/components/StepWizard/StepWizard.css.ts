import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const fadeIn = keyframes({
	from: { opacity: 0, transform: 'translateX(10px)' },
	to: { opacity: 1, transform: 'translateX(0)' },
})

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
})

export const header = style({
	padding: `${vars.spacing.lg} ${vars.spacing.xl}`,
	borderBottom: `1px solid ${vars.color.border.primary}`,
	backgroundColor: vars.color.bg.secondary,
})

export const stepsContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
})

export const stepItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

export const stepCircle = style({
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	transition: `all ${vars.transitionDuration.base}`,
	border: '2px solid transparent',
})

export const stepCirclePending = style({
	backgroundColor: vars.color.bg.primary,
	border: `2px solid ${vars.color.border.primary}`,
	color: vars.color.text.secondary,
})

export const stepCircleActive = style({
	backgroundColor: vars.color.primary.main,
	color: vars.color.text.inverse,
	boxShadow: `0 0 0 4px rgba(239, 68, 68, 0.15)`,
})

export const stepCircleCompleted = style({
	backgroundColor: vars.color.success.main,
	color: vars.color.text.inverse,
})

export const stepLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	display: 'none',

	'@media': {
		'(min-width: 768px)': {
			display: 'block',
		},
	},
})

export const stepLabelActive = style({
	color: vars.color.text.primary,
})

export const stepConnector = style({
	width: '24px',
	height: '2px',
	backgroundColor: vars.color.border.primary,
	transition: `background-color ${vars.transitionDuration.base}`,

	'@media': {
		'(min-width: 768px)': {
			width: '40px',
		},
	},
})

export const stepConnectorCompleted = style({
	backgroundColor: vars.color.success.main,
})

export const body = style({
	flex: 1,
	padding: vars.spacing.xl,
	overflowY: 'auto',
	animation: `${fadeIn} ${vars.transitionDuration.base} ease-out`,
})

export const stepTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.xs,
})

export const stepDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.xl,
})

export const footer = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: `${vars.spacing.md} ${vars.spacing.xl}`,
	borderTop: `1px solid ${vars.color.border.primary}`,
	backgroundColor: vars.color.bg.primary,
})

export const footerLeft = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const footerRight = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const progressText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
})

export const progressBar = style({
	width: '100px',
	height: '4px',
	backgroundColor: vars.color.border.primary,
	borderRadius: vars.borderRadius.full,
	overflow: 'hidden',

	'@media': {
		'(max-width: 640px)': {
			display: 'none',
		},
	},
})

export const progressBarFill = style({
	height: '100%',
	backgroundColor: vars.color.primary.main,
	borderRadius: vars.borderRadius.full,
	transition: `width ${vars.transitionDuration.base}`,
})
