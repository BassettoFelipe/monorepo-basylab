import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const selectWrapper = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	boxSizing: 'border-box',
})

export const fullWidth = style({
	width: '100%',
	boxSizing: 'border-box',
})

export const label = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	fontFamily: vars.fontFamily.body,
})

export const required = style({
	color: vars.color.error.main,
	marginLeft: '2px',
})

export const select = style({
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	border: `2px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	minHeight: '44px',
	width: '100%',
	cursor: 'pointer',
	appearance: 'none',
	boxSizing: 'border-box',

	backgroundImage:
		"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23434D00' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
	backgroundRepeat: 'no-repeat',
	backgroundPosition: `right ${vars.spacing.md} center`,
	paddingRight: `calc(${vars.spacing.md} * 2.5)`,

	selectors: {
		'&:hover:not(:disabled):not(:focus)': {
			borderColor: vars.color.secondary.light,
		},
		'&:focus': {
			outline: 'none',
			borderColor: vars.color.secondary.main,
			boxShadow: '0 0 0 3px rgba(159, 182, 1, 0.25)',
		},
		'&:disabled': {
			backgroundColor: vars.color.bg.secondary,
			color: vars.color.text.disabled,
			cursor: 'not-allowed',
			borderColor: vars.color.neutral.grayLight,
			opacity: vars.opacity[60],
		},
	},
})

export const selectError = style({
	borderColor: vars.color.border.error,

	selectors: {
		'&:focus': {
			borderColor: vars.color.error.main,
			boxShadow: `0 0 0 3px ${vars.color.error.light}33`,
		},
		'&:hover:not(:disabled):not(:focus)': {
			borderColor: vars.color.error.main,
		},
	},
})

export const errorMessage = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.error.main,
	fontFamily: vars.fontFamily.body,
	marginTop: vars.spacing['2xs'],
})

export const helperText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	fontFamily: vars.fontFamily.body,
	marginTop: vars.spacing['2xs'],
})
