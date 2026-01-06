import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
})

export const resendContent = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.md,
})

export const resendText = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const promptText = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const attemptsText = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.warning.dark,
	margin: 0,
})

export const errorBox = style({
	backgroundColor: vars.color.error.light,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.md,
	padding: vars.spacing.md,
})

export const errorContent = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
})

export const errorIcon = style({
	width: '18px',
	height: '18px',
	color: vars.color.error.main,
	marginTop: '1px',
	flexShrink: 0,
})

export const errorTextContainer = style({
	flex: 1,
	minWidth: 0,
})

export const errorTitle = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.error.dark,
	margin: `0 0 ${vars.spacing.xs} 0`,
})

export const errorDescription = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.error.dark,
	margin: 0,
	lineHeight: vars.lineHeight.relaxed,
})

export const errorLink = style({
	color: vars.color.error.dark,
	fontWeight: vars.fontWeight.bold,
	textDecoration: 'underline',
	transition: `color ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&:hover': {
			color: vars.color.error.main,
		},
	},
})
