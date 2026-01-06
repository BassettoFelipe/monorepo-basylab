import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const errorBox = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	backgroundColor: vars.color.error.light,
	border: `2px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.md,
	color: vars.color.error.dark,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
})

export const errorIcon = style({
	width: '20px',
	height: '20px',
	flexShrink: 0,
	color: vars.color.error.main,
})
