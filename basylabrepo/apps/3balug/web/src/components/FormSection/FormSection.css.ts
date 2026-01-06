/**
 * FormSection Component Styles - 3Balug Brand
 * Accordion com animação suave
 */

import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const slideDown = keyframes({
	'0%': {
		opacity: 0,
		maxHeight: 0,
	},
	'100%': {
		opacity: 1,
		maxHeight: '2000px',
	},
})

const slideUp = keyframes({
	'0%': {
		opacity: 1,
		maxHeight: '2000px',
	},
	'100%': {
		opacity: 0,
		maxHeight: 0,
	},
})

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	borderRadius: vars.borderRadius.lg,
	border: `1px solid ${vars.color.border.primary}`,
	overflow: 'hidden',
})

export const header = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.md,
	padding: vars.spacing.lg,
	background: vars.color.bg.secondary,
	border: 'none',
	cursor: 'pointer',
	textAlign: 'left',
	width: '100%',

	'@media': {
		'(max-width: 480px)': {
			padding: vars.spacing.md,
		},
	},
})

export const headerNotCollapsible = style({
	cursor: 'default',
})

export const headerStatic = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.md,
	padding: vars.spacing.lg,
	background: vars.color.bg.secondary,
	width: '100%',

	'@media': {
		'(max-width: 480px)': {
			padding: vars.spacing.md,
		},
	},
})

export const headerLeft = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	flex: 1,
})

export const icon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	minWidth: '36px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.primary.main,
	color: vars.color.neutral.black,

	'@media': {
		'(max-width: 480px)': {
			width: '32px',
			height: '32px',
			minWidth: '32px',
		},
	},
})

export const headerContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	flex: 1,
})

export const titleRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const title = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.neutral.black,
	margin: 0,

	'@media': {
		'(max-width: 480px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const description = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
	margin: 0,
})

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `2px ${vars.spacing.xs}`,
	borderRadius: vars.borderRadius.sm,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
})

export const badgePending = style({
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.primary,
	border: `1px solid ${vars.color.border.primary}`,
})

export const badgeInProgress = style({
	backgroundColor: vars.color.warning.light,
	color: vars.color.warning.dark,
})

export const badgeComplete = style({
	backgroundColor: vars.color.success.light,
	color: vars.color.success.dark,
})

export const totalBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `2px ${vars.spacing.xs}`,
	borderRadius: vars.borderRadius.sm,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.secondary,
	border: `1px solid ${vars.color.border.primary}`,
})

export const chevron = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: vars.color.text.primary,
	transition: `transform ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
})

export const chevronRotated = style({
	transform: 'rotate(180deg)',
})

export const contentWrapper = style({
	overflow: 'hidden',
})

export const contentExpanded = style({
	animation: `${slideDown} ${vars.transitionDuration.base} ${vars.transitionTiming.easeOut} forwards`,
})

export const contentCollapsed = style({
	animation: `${slideUp} ${vars.transitionDuration.fast} ${vars.transitionTiming.easeIn} forwards`,
})

export const content = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing.md,
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.primary,

	'@media': {
		'(min-width: 640px)': {
			gridTemplateColumns: '1fr 1fr',
		},
		'(max-width: 480px)': {
			padding: vars.spacing.md,
		},
	},
})

export const fullWidth = style({
	gridColumn: '1 / -1',
})
