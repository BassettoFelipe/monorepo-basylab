import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const fadeIn = keyframes({
	'0%': {
		opacity: 0,
		transform: 'translateY(20px)',
	},
	'100%': {
		opacity: 1,
		transform: 'translateY(0)',
	},
})

const scaleIn = keyframes({
	'0%': {
		opacity: 0,
		transform: 'scale(0.8)',
	},
	'50%': {
		transform: 'scale(1.05)',
	},
	'100%': {
		opacity: 1,
		transform: 'scale(1)',
	},
})

const pulse = keyframes({
	'0%, 100%': {
		opacity: 1,
	},
	'50%': {
		opacity: 0.6,
	},
})

export const page = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '100%',
	backgroundColor: vars.color.bg.secondary,
})

export const container = style({
	width: '100%',
	maxWidth: '480px',
	margin: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	boxShadow: vars.shadow.lg,
	animation: `${fadeIn} 0.5s ease-out`,
})

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	padding: vars.spacing['3xl'],
	'@media': {
		'(max-width: 640px)': {
			padding: vars.spacing.xl,
		},
	},
})

export const iconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '80px',
	height: '80px',
	margin: '0 auto',
	marginBottom: vars.spacing.xl,
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.success.light,
	animation: `${scaleIn} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)`,
})

export const icon = style({
	color: vars.color.success.main,
	width: '44px',
	height: '44px',
})

export const header = style({
	textAlign: 'center',
	marginBottom: vars.spacing.xl,
})

export const title = style({
	fontSize: vars.fontSize['2xl'],
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.sm,
	lineHeight: vars.lineHeight.tight,
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.xl,
		},
	},
})

export const subtitle = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,
	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const infoBox = style({
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.tertiary,
	borderRadius: vars.borderRadius.lg,
	marginBottom: vars.spacing.xl,
	border: `1px solid ${vars.color.border.secondary}`,
})

export const infoText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,
	margin: 0,
	textAlign: 'center',
})

export const countdown = style({
	textAlign: 'center',
	marginBottom: vars.spacing.xl,
})

export const countdownText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.tertiary,
	margin: 0,
})

export const countdownNumber = style({
	color: vars.color.success.main,
	fontWeight: vars.fontWeight.bold,
	fontSize: vars.fontSize.lg,
	animation: `${pulse} 1s ease-in-out infinite`,
})

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})
