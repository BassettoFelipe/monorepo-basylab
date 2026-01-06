import { style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

export const pageWrapper = style({
	minHeight: '100%',
	backgroundColor: vars.color.bg.primary,
	paddingTop: vars.spacing['3xl'],
	paddingBottom: vars.spacing['4xl'],
})

export const container = style({
	width: '100%',
	maxWidth: '900px',
	margin: '0 auto',
	padding: `0 ${vars.spacing.lg}`,

	'@media': {
		[mediaQuery.md]: {
			padding: `0 ${vars.spacing.md}`,
		},
	},
})

export const content = style({
	backgroundColor: vars.color.neutral.white,
	borderRadius: vars.borderRadius.xl,
	padding: vars.spacing['3xl'],
	boxShadow: vars.shadow.sm,

	'@media': {
		[mediaQuery.md]: {
			padding: vars.spacing.xl,
		},
	},
})

export const title = style({
	fontSize: vars.fontSize['3xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: vars.spacing.sm,
	lineHeight: vars.lineHeight.tight,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize['2xl'],
		},
	},
})

export const lastUpdated = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing['2xl'],
})

export const section = style({
	marginBottom: vars.spacing['2xl'],
})

export const sectionTitle = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: vars.spacing.md,
	lineHeight: vars.lineHeight.tight,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize.lg,
		},
	},
})

export const paragraph = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.spacing.md,

	selectors: {
		'&:last-child': {
			marginBottom: 0,
		},
	},
})

export const list = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,
	marginLeft: vars.spacing.lg,
	marginBottom: vars.spacing.md,
	listStyle: 'disc',
})
