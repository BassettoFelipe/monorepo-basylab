import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const modalContent = style({
	display: 'grid',
	gridTemplateColumns: '1.2fr 1fr',
	gap: '32px',
	height: '500px',
	maxHeight: 'calc(90vh - 180px)', // Desconta header e footer do modal
	'@media': {
		'(max-width: 968px)': {
			gridTemplateColumns: '1fr',
			height: 'auto',
			maxHeight: 'none',
		},
	},
})

export const formSection = style({
	display: 'flex',
	flexDirection: 'column',
	overflowY: 'auto',
	paddingRight: vars.spacing.md,
	// Estilização da scrollbar
	'::-webkit-scrollbar': {
		width: '10px',
	},
	'::-webkit-scrollbar-track': {
		background: vars.color.bg.secondary,
		borderRadius: vars.borderRadius.full,
	},
	'::-webkit-scrollbar-thumb': {
		background: vars.color.border.primary,
		borderRadius: vars.borderRadius.full,
	},
	selectors: {
		'&::-webkit-scrollbar-thumb:hover': {
			background: vars.color.text.tertiary,
		},
	},
})

export const previewSection = style({
	display: 'flex',
	flexDirection: 'column',
	overflowY: 'hidden',
	'@media': {
		'(max-width: 968px)': {
			marginTop: vars.spacing.lg,
		},
	},
})

export const fieldDescription = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	marginTop: vars.spacing.xs,
	lineHeight: '1.4',
})

export const switchLabel = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	fontSize: '14px',
	fontWeight: 500,
})

export const optionsSection = style({
	marginTop: '24px',
	paddingTop: '16px',
	borderTop: `1px solid ${vars.color.border.primary}`,
})

export const optionsTitle = style({
	fontSize: '14px',
	fontWeight: 600,
	marginBottom: '4px',
	color: vars.color.text.primary,
})

export const optionItem = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: '8px 12px',
	background: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
})

export const removeOptionButton = style({
	background: 'transparent',
	border: 'none',
	color: vars.color.error.main,
	cursor: 'pointer',
	fontSize: '12px',
	padding: '4px 8px',
	borderRadius: vars.borderRadius.sm,
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		backgroundColor: vars.color.error.light,
		color: vars.color.error.dark,
	},
})

// Preview Styles
export const previewContainer = style({
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	padding: vars.spacing.lg,
	height: 'fit-content',
	position: 'sticky',
	top: 0,
	border: `1px solid ${vars.color.border.primary}`,
})

export const previewHeader = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	marginBottom: vars.spacing.lg,
})

export const previewTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const previewSubtitle = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	lineHeight: '1.5',
})

export const previewField = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
	backgroundColor: '#ffffff',
	padding: vars.spacing.lg,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
})

export const previewLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	minHeight: '20px',
})

export const previewRequired = style({
	color: vars.color.error.main,
	fontSize: vars.fontSize.sm,
	lineHeight: '1',
})

export const previewInput = style({
	width: '100%',
	padding: vars.spacing.md,
	fontSize: vars.fontSize.sm,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: '#ffffff',
	color: vars.color.text.primary,
	outline: 'none',
	transition: `border-color ${vars.transitionDuration.base}`,
	':focus': {
		borderColor: vars.color.primary.main,
	},
	'::placeholder': {
		color: vars.color.text.secondary,
	},
})

export const previewTextarea = style({
	width: '100%',
	padding: vars.spacing.md,
	fontSize: vars.fontSize.sm,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: '#ffffff',
	color: vars.color.text.primary,
	outline: 'none',
	resize: 'vertical',
	fontFamily: 'inherit',
	transition: `border-color ${vars.transitionDuration.base}`,
	':focus': {
		borderColor: vars.color.primary.main,
	},
	'::placeholder': {
		color: vars.color.text.secondary,
	},
})

export const previewSelect = style({
	width: '100%',
	padding: vars.spacing.md,
	fontSize: vars.fontSize.sm,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: '#ffffff',
	color: vars.color.text.primary,
	outline: 'none',
	cursor: 'pointer',
	transition: `border-color ${vars.transitionDuration.base}`,
	':focus': {
		borderColor: vars.color.primary.main,
	},
})

export const previewCheckboxContainer = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.sm,
})

export const previewCheckbox = style({
	width: '18px',
	height: '18px',
	cursor: 'pointer',
	accentColor: vars.color.primary.main,
})

export const previewCheckboxLabel = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
})

export const previewHelpText = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	lineHeight: '1.4',
})

// Field Type Display (for edit modal)
export const fieldTypeDisplay = style({
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
})

export const fieldTypeLabel = style({
	display: 'block',
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.xs,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const fieldTypeValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: 500,
	color: vars.color.text.primary,
})

// File Upload Preview Styles
export const filePreviewContainer = style({
	width: '100%',
})

export const fileDropZone = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.xl,
	border: `2px dashed ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		borderColor: vars.color.primary.dark,
		backgroundColor: '#fafff0', // verde bem clarinho
	},
})

export const fileDropZoneDragging = style({
	borderColor: vars.color.primary.dark,
	backgroundColor: '#fafff0',
	transform: 'scale(1.01)',
})

export const fileDropIcon = style({
	color: vars.color.text.tertiary,
	transition: `color ${vars.transitionDuration.base}`,
	selectors: {
		[`${fileDropZone}:hover &`]: {
			color: vars.color.primary.dark,
		},
	},
})

export const fileItemsContainer = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing.xs,
	marginTop: vars.spacing.sm,
})

export const fileItemPreview = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.full,
	border: `1px solid ${vars.color.border.primary}`,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.primary,
	maxWidth: '150px',
})

export const fileItemImagePreview = style({
	flexShrink: 0,
	width: '20px',
	height: '20px',
	borderRadius: vars.borderRadius.sm,
	objectFit: 'cover',
})

export const fileItemIcon = style({
	flexShrink: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: vars.color.text.secondary,
})

export const fileItemName = style({
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	flex: 1,
	minWidth: 0,
})

export const fileItemRemove = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '16px',
	height: '16px',
	padding: 0,
	border: 'none',
	borderRadius: vars.borderRadius.full,
	backgroundColor: 'transparent',
	color: vars.color.text.tertiary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	flexShrink: 0,
	':hover': {
		backgroundColor: vars.color.error.main,
		color: vars.color.neutral.white,
	},
})

export const fileDropText = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	textAlign: 'center',
})

export const fileDropHint = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textAlign: 'center',
})

export const fileDropTypes = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.tertiary,
	textAlign: 'center',
	marginTop: vars.spacing.xs,
})

export const checkboxGroup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const checkboxLabel = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	cursor: 'pointer',
	padding: `${vars.spacing.xs} 0`,
	transition: `color ${vars.transitionDuration.base}`,
	':hover': {
		color: vars.color.text.secondary,
	},
})

export const checkboxLabelDisabled = style({
	opacity: 0.6,
	cursor: 'not-allowed',
	':hover': {
		color: vars.color.text.primary,
	},
})

export const checkbox = style({
	appearance: 'none',
	width: '18px',
	height: '18px',
	border: `2px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.sm,
	backgroundColor: vars.color.bg.primary,
	cursor: 'pointer',
	position: 'relative',
	flexShrink: 0,
	transition: `all ${vars.transitionDuration.base}`,
	':checked': {
		backgroundColor: vars.color.primary.main,
		borderColor: vars.color.primary.main,
	},
	':hover': {
		borderColor: vars.color.primary.main,
	},
	':disabled': {
		opacity: 0.6,
		cursor: 'not-allowed',
	},
	selectors: {
		'&:checked::after': {
			content: '""',
			position: 'absolute',
			left: '5px',
			top: '2px',
			width: '5px',
			height: '9px',
			border: `solid ${vars.color.primary.dark}`,
			borderWidth: '0 2px 2px 0',
			transform: 'rotate(45deg)',
		},
	},
})

export const errorText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.error.main,
	marginTop: vars.spacing.sm,
	fontWeight: vars.fontWeight.medium,
})

export const labelError = style({
	color: vars.color.error.main,
})

export const checkboxGroupError = style({
	padding: vars.spacing.md,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: '#fef2f2', // vermelho muito claro para bom contraste
})
