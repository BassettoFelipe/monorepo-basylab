import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const checkoutError = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.xs,
	backgroundColor: vars.color.error.light,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.md,
	color: vars.color.error.dark,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
})

export const errorIcon = style({
	width: '14px',
	height: '14px',
	flexShrink: 0,
	color: vars.color.error.main,
})
