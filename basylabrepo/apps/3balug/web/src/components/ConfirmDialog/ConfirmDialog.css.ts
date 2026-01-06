import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const fadeIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
})

const slideUp = keyframes({
	from: {
		opacity: 0,
		transform: 'translateY(20px)',
	},
	to: {
		opacity: 1,
		transform: 'translateY(0)',
	},
})

export const overlay = style({
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundColor: 'rgba(0, 0, 0, 0.6)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 1100,
	padding: vars.spacing.md,
	animation: `${fadeIn} 0.2s ease-in-out`,
})

export const dialog = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.lg,
	boxShadow: vars.shadow.xl,
	maxWidth: '400px',
	width: '100%',
	padding: vars.spacing.xl,
	animation: `${slideUp} 0.3s ease-out`,
})

export const iconWrapper = style({
	width: '64px',
	height: '64px',
	borderRadius: '50%',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	marginBottom: vars.spacing.md,
	marginLeft: 'auto',
	marginRight: 'auto',
	backgroundColor: vars.color.error.light,
	color: vars.color.error.main,
})

export const title = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.sm,
	textAlign: 'center',
})

export const description = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.xl,
	lineHeight: 1.6,
	textAlign: 'center',
})

globalStyle(`${description} strong`, {
	color: vars.color.text.primary,
	fontWeight: vars.fontWeight.bold,
	fontSize: vars.fontSize.lg,
})

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
	width: '100%',
})

export const confirmInput = style({
	width: '100%',
	padding: vars.spacing.sm,
	fontSize: vars.fontSize.base,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
	marginBottom: vars.spacing.md,
	fontFamily: 'inherit',
	':focus': {
		outline: 'none',
		borderColor: vars.color.error.main,
		boxShadow: `0 0 0 3px ${vars.color.error.light}`,
	},
})

export const confirmText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.sm,
	textAlign: 'center',
})
