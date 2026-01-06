import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const form = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xl,
})

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const sectionTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
	paddingBottom: vars.spacing.sm,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const row2Cols = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const row3Cols = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr 1fr',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const infoCard = style({
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	padding: vars.spacing.md,
	border: `1px solid ${vars.color.border.primary}`,
})

export const infoLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.xs,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const infoValue = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const terminateWarning = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	backgroundColor: '#FEF3C7',
	border: '1px solid #F59E0B',
	borderRadius: vars.borderRadius.md,
})

export const terminateWarningIcon = style({
	color: '#D97706',
	flexShrink: 0,
	marginTop: '2px',
})

export const terminateWarningContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const terminateWarningTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: '#92400E',
	margin: 0,
})

export const terminateWarningText = style({
	fontSize: vars.fontSize.xs,
	color: '#A16207',
	margin: 0,
})
