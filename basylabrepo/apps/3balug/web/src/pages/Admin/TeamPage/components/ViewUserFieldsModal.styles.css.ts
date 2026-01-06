import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
	maxHeight: '75vh',
	overflowY: 'auto',
	paddingRight: vars.spacing.xs,
	selectors: {
		'&::-webkit-scrollbar': {
			width: '4px',
		},
		'&::-webkit-scrollbar-track': {
			background: 'transparent',
		},
		'&::-webkit-scrollbar-thumb': {
			background: vars.color.border.primary,
			borderRadius: vars.borderRadius.full,
		},
	},
})

export const loadingContainer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const errorContainer = style({
	padding: vars.spacing.xl,
	textAlign: 'center',
	color: vars.color.error.main,
})

export const emptyContainer = style({
	padding: vars.spacing.xl,
	textAlign: 'center',
	color: vars.color.text.secondary,
})

export const summary = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
})

export const summaryHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const summaryIcon = style({
	color: vars.color.primary.dark,
	flexShrink: 0,
})

export const summaryInfo = style({
	display: 'flex',
	flexDirection: 'column',
})

export const summaryTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const summaryText = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const progressWrapper = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	minWidth: '220px',
})

export const progressBar = style({
	flex: 1,
	height: '6px',
	backgroundColor: vars.color.border.primary,
	borderRadius: vars.borderRadius.full,
	overflow: 'hidden',
	minWidth: '100px',
})

export const progressFill = style({
	height: '100%',
	backgroundColor: vars.color.primary.dark,
	borderRadius: vars.borderRadius.full,
	transition: `width ${vars.transitionDuration.base}`,
})

export const progressLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	whiteSpace: 'nowrap',
})

export const progressPercent = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	minWidth: '32px',
	textAlign: 'right',
})

export const fieldsContainer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const fieldCard = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
	transition: `all ${vars.transitionDuration.base}`,
	minHeight: '48px',
})

export const fieldCardEmpty = style({
	backgroundColor: vars.color.bg.secondary,
	borderStyle: 'dashed',
	opacity: 0.7,
})

export const fieldCardFilled = style({
	borderLeft: `3px solid ${vars.color.primary.dark}`,
})

export const fieldHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	width: '220px',
	flexShrink: 0,
})

export const fieldLabelGroup = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	flex: 1,
	minWidth: 0,
})

export const fieldTypeIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.sm,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const fieldLabelInfo = style({
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
	flex: 1,
})

export const fieldLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const fieldType = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.tertiary,
})

export const required = style({
	color: vars.color.error.main,
	marginLeft: '2px',
})

export const inactiveBadge = style({
	fontSize: '10px',
	color: vars.color.warning.dark,
	backgroundColor: vars.color.warning.light,
	padding: `1px ${vars.spacing.xs}`,
	borderRadius: vars.borderRadius.full,
	fontWeight: vars.fontWeight.medium,
	flexShrink: 0,
})

export const fieldValueContainer = style({
	flex: 1,
	display: 'flex',
	alignItems: 'center',
	flexWrap: 'wrap',
	gap: vars.spacing.sm,
})

export const fieldValue = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	lineHeight: '1.5',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
})

export const emptyValue = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.tertiary,
	fontStyle: 'italic',
})

export const checkboxValue = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	padding: `2px ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
})

export const checkboxChecked = style({
	color: vars.color.success.main,
	backgroundColor: vars.color.bg.secondary,
})

export const checkboxUnchecked = style({
	color: vars.color.text.tertiary,
	backgroundColor: vars.color.bg.secondary,
})

// File styles
export const filesContainer = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing.sm,
	width: '100%',
})

export const fileItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.xs,
	paddingRight: vars.spacing.sm,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
	textDecoration: 'none',
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		backgroundColor: vars.color.bg.primary,
		borderColor: vars.color.primary.dark,
	},
})

export const filePreview = style({
	width: '36px',
	height: '36px',
	borderRadius: vars.borderRadius.sm,
	objectFit: 'cover',
	flexShrink: 0,
})

export const fileIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.sm,
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const fileDetails = style({
	display: 'flex',
	flexDirection: 'column',
})

export const fileName = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	maxWidth: '120px',
})

export const fileSize = style({
	fontSize: '10px',
	color: vars.color.text.tertiary,
})

export const downloadIcon = style({
	color: vars.color.text.tertiary,
	flexShrink: 0,
	transition: `color ${vars.transitionDuration.base}`,
	selectors: {
		[`${fileItem}:hover &`]: {
			color: vars.color.primary.dark,
		},
	},
})

// Multiple selection styles
export const multipleValues = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing.xs,
})

export const multipleValueTag = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `2px ${vars.spacing.sm}`,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.primary.dark,
	backgroundColor: vars.color.primary.main,
	borderRadius: vars.borderRadius.full,
})
