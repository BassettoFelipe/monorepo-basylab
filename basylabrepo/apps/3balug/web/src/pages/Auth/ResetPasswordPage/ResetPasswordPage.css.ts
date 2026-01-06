import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const formFooterNoBorder = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
	marginTop: vars.spacing.md,

	'@media': {
		'(max-width: 480px)': {
			gap: vars.spacing.sm,
			marginTop: vars.spacing.sm,
		},
	},
})

export const footerLink = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	textAlign: 'center',
	margin: 0,

	'@media': {
		'(max-width: 480px)': {
			fontSize: vars.fontSize.xs,
		},
	},
})

export const link = style({
	color: vars.color.secondary.main,
	fontWeight: vars.fontWeight.bold,
	textDecoration: 'none',
	transition: `color ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&:hover': {
			color: vars.color.primary.dark,
			textDecoration: 'underline',
		},
	},
})
