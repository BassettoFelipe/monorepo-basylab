import { style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

export const confirmEmailHeader = style({
	textAlign: 'center',
	marginBottom: vars.spacing['2xl'],

	'@media': {
		[mediaQuery.md]: {
			marginBottom: vars.spacing.lg,
		},
		'(max-width: 480px)': {
			marginBottom: vars.spacing.md,
		},
	},
})

export const confirmEmailIcon = style({
	width: '80px',
	height: '80px',
	margin: `0 auto ${vars.spacing.xl}`,
	backgroundColor: vars.color.neutral.offWhite,
	borderRadius: vars.borderRadius.xl,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: vars.color.primary.dark,
	position: 'relative',
	boxShadow: vars.shadow.sm,

	selectors: {
		'&::before': {
			content: '""',
			position: 'absolute',
			inset: '-4px',
			borderRadius: vars.borderRadius.xl,
			background: `linear-gradient(135deg, ${vars.color.primary.main} 0%, ${vars.color.secondary.main} 100%)`,
			opacity: 0.2,
			zIndex: -1,
		},
	},

	'@media': {
		[mediaQuery.md]: {
			width: '64px',
			height: '64px',
			margin: `0 auto ${vars.spacing.md}`,
		},
		'(max-width: 480px)': {
			width: '56px',
			height: '56px',
			margin: `0 auto ${vars.spacing.sm}`,
		},
	},
})

export const confirmEmailTitle = style({
	fontSize: vars.fontSize['3xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: vars.spacing.sm,
	lineHeight: vars.lineHeight.tight,
	letterSpacing: vars.letterSpacing.tight,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize['2xl'],
		},
	},
})

export const confirmEmailSubtitle = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.xs,
	lineHeight: vars.lineHeight.normal,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const confirmEmailEmail = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.secondary.main,
	letterSpacing: vars.letterSpacing.tight,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize.base,
		},
	},
})
