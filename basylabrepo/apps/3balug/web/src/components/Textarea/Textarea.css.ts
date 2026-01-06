import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const textareaWrapper = style({
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

export const textarea = style({
	padding: vars.spacing.md,
	border: `2px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	width: '100%',
	boxSizing: 'border-box',
	margin: 0,
	resize: 'vertical',
	minHeight: '100px',
	lineHeight: '1.5',

	selectors: {
		'&::placeholder': {
			color: vars.color.text.tertiary,
			opacity: vars.opacity[60],
		},
		'&:hover:not(:disabled):not(:focus)': {
			borderColor: vars.color.secondary.light,
		},
		'&:focus': {
			outline: 'none',
			borderColor: vars.color.secondary.main,
			boxShadow: 'none',
		},
		'&:disabled': {
			backgroundColor: vars.color.bg.secondary,
			color: vars.color.text.disabled,
			cursor: 'not-allowed',
			borderColor: vars.color.neutral.grayLight,
			resize: 'none',
		},
	},
})

export const textareaError = style({
	borderColor: vars.color.border.error,
	boxShadow: 'none',

	selectors: {
		'&:focus': {
			borderColor: vars.color.error.main,
			boxShadow: 'none',
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
	minHeight: '20px',
})

export const helperText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	fontFamily: vars.fontFamily.body,
	minHeight: '20px',
})

export const charCount = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.tertiary,
	textAlign: 'right',
	marginTop: vars.spacing.xs,
})

export const charCountWarning = style({
	color: vars.color.warning.main,
})

export const charCountError = style({
	color: vars.color.error.main,
})
