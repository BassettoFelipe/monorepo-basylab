import { keyframes, style, styleVariants } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const button = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	borderRadius: vars.borderRadius.md,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.medium,
	letterSpacing: vars.letterSpacing.wide,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	cursor: 'pointer',
	border: '2px solid transparent',
	whiteSpace: 'nowrap',
	textTransform: 'none',

	selectors: {
		'&:disabled': {
			opacity: vars.opacity[50],
			cursor: 'not-allowed',
		},
		'&:focus-visible': {
			outline: 'none',
		},
	},
})

export const size = styleVariants({
	small: {
		padding: `${vars.spacing.xs} ${vars.spacing.md}`,
		fontSize: vars.fontSize.sm,
		minHeight: '36px',
	},
	medium: {
		padding: `${vars.spacing.sm} ${vars.spacing.lg}`,
		fontSize: vars.fontSize.base,
		minHeight: '44px',
	},
	large: {
		padding: `${vars.spacing.md} ${vars.spacing.xl}`,
		fontSize: vars.fontSize.lg,
		minHeight: '52px',
	},
})

export const variant = styleVariants({
	primary: {
		backgroundColor: vars.color.primary.main,
		color: vars.color.primary.dark,
		borderColor: vars.color.primary.main,
		fontWeight: vars.fontWeight.bold,

		selectors: {
			'&:hover:not(:disabled)': {
				backgroundColor: vars.color.primary.dark,
				borderColor: vars.color.primary.dark,
				color: vars.color.primary.main,
				boxShadow: vars.shadow.md,
				transform: 'translateY(-1px)',
			},
			'&:active:not(:disabled)': {
				transform: 'translateY(0)',
				boxShadow: vars.shadow.sm,
			},
		},
	},

	secondary: {
		backgroundColor: vars.color.primary.dark,
		color: vars.color.neutral.white,
		borderColor: vars.color.primary.dark,

		selectors: {
			'&:hover:not(:disabled)': {
				backgroundColor: vars.color.secondary.main,
				borderColor: vars.color.secondary.main,
				boxShadow: vars.shadow.md,
				transform: 'translateY(-1px)',
			},
			'&:active:not(:disabled)': {
				backgroundColor: vars.color.primary.dark,
				transform: 'translateY(0)',
			},
		},
	},

	outline: {
		backgroundColor: vars.color.neutral.white,
		borderColor: vars.color.primary.dark,
		color: vars.color.primary.dark,

		selectors: {
			'&:hover:not(:disabled)': {
				backgroundColor: vars.color.primary.dark,
				borderColor: vars.color.primary.dark,
				color: vars.color.neutral.white,
				transform: 'translateY(-1px)',
				boxShadow: vars.shadow.sm,
			},
			'&:active:not(:disabled)': {
				backgroundColor: vars.color.primary.dark,
				borderColor: vars.color.primary.dark,
				color: vars.color.neutral.white,
				transform: 'translateY(0)',
			},
		},
	},

	ghost: {
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		color: vars.color.text.primary,

		selectors: {
			'&:hover:not(:disabled)': {
				backgroundColor: vars.color.bg.secondary,
				color: vars.color.secondary.main,
			},
			'&:active:not(:disabled)': {
				backgroundColor: vars.color.neutral.grayLight,
			},
		},
	},

	danger: {
		backgroundColor: vars.color.error.main,
		color: vars.color.neutral.white,
		borderColor: vars.color.error.main,

		selectors: {
			'&:hover:not(:disabled)': {
				backgroundColor: vars.color.error.dark,
				borderColor: vars.color.error.dark,
				boxShadow: vars.shadow.md,
			},
			'&:active:not(:disabled)': {
				backgroundColor: vars.color.error.main,
			},
		},
	},

	warning: {
		backgroundColor: vars.color.warning.main,
		color: vars.color.neutral.white,
		borderColor: vars.color.warning.main,

		selectors: {
			'&:hover:not(:disabled)': {
				backgroundColor: vars.color.warning.dark,
				borderColor: vars.color.warning.dark,
				boxShadow: vars.shadow.md,
			},
			'&:active:not(:disabled)': {
				backgroundColor: vars.color.warning.main,
			},
		},
	},
})

export const fullWidth = style({
	width: '100%',
})

export const loading = style({
	position: 'relative',
	color: 'transparent',
	pointerEvents: 'none',
})

const spinAnimation = keyframes({
	'0%': {
		transform: 'rotate(0deg)',
	},
	'100%': {
		transform: 'rotate(360deg)',
	},
})

const spinnerBase = style({
	position: 'absolute',
	width: '18px',
	height: '18px',
	border: '2px solid',
	borderRadius: vars.borderRadius.full,
	animation: `${spinAnimation} 0.6s linear infinite`,
})

export const spinnerVariant = styleVariants({
	primary: [
		spinnerBase,
		{
			borderColor: vars.color.primary.dark,
			borderTopColor: 'transparent',
		},
	],
	secondary: [
		spinnerBase,
		{
			borderColor: vars.color.neutral.white,
			borderTopColor: 'transparent',
		},
	],
	outline: [
		spinnerBase,
		{
			borderColor: vars.color.primary.dark,
			borderTopColor: 'transparent',
		},
	],
	ghost: [
		spinnerBase,
		{
			borderColor: vars.color.text.primary,
			borderTopColor: 'transparent',
		},
	],
	danger: [
		spinnerBase,
		{
			borderColor: vars.color.neutral.white,
			borderTopColor: 'transparent',
		},
	],
	warning: [
		spinnerBase,
		{
			borderColor: vars.color.neutral.white,
			borderTopColor: 'transparent',
		},
	],
})
