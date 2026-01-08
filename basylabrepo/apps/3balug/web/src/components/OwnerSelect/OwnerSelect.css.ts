import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

// Container
export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const fullWidth = style({
	width: '100%',
})

export const label = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.xs,
})

export const required = style({
	color: vars.color.error.main,
	marginLeft: '2px',
})

// Select trigger
export const selectTrigger = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	minHeight: '56px',
	':hover': {
		borderColor: vars.color.border.secondary,
	},
	':focus': {
		outline: 'none',
		borderColor: vars.color.primary.dark,
		boxShadow: '0 0 0 2px rgba(67, 77, 0, 0.15)',
	},
})

export const selectTriggerError = style({
	borderColor: vars.color.error.main,
	':hover': {
		borderColor: vars.color.error.main,
	},
	':focus': {
		borderColor: vars.color.error.main,
		boxShadow: `0 0 0 2px ${vars.color.error.light}`,
	},
})

export const selectTriggerDisabled = style({
	opacity: 0.6,
	cursor: 'not-allowed',
	':hover': {
		borderColor: vars.color.border.primary,
	},
})

export const selectTriggerOpen = style({
	borderColor: vars.color.primary.dark,
	boxShadow: '0 0 0 2px rgba(67, 77, 0, 0.15)',
})

export const placeholder = style({
	color: vars.color.text.tertiary,
	fontSize: vars.fontSize.base,
})

export const selectedOwnerTrigger = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	flex: 1,
	minWidth: 0,
})

export const selectedOwnerInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	flex: 1,
	minWidth: 0,
})

export const selectedOwnerName = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const selectedOwnerDocument = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const chevronIcon = style({
	color: vars.color.text.tertiary,
	flexShrink: 0,
	transition: `transform ${vars.transitionDuration.base}`,
})

export const chevronIconOpen = style({
	transform: 'rotate(180deg)',
})

// Dropdown
export const dropdown = style({
	position: 'absolute',
	top: '100%',
	left: 0,
	right: 0,
	zIndex: 50,
	marginTop: vars.spacing.xs,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
	maxHeight: '320px',
	overflow: 'hidden',
	display: 'flex',
	flexDirection: 'column',
})

export const dropdownWrapper = style({
	position: 'relative',
})

// Search
export const searchContainer = style({
	padding: vars.spacing.sm,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const searchInput = style({
	width: '100%',
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	paddingLeft: '36px',
	fontSize: vars.fontSize.sm,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.primary,
	transition: `all ${vars.transitionDuration.base}`,
	':focus': {
		outline: 'none',
		borderColor: vars.color.primary.dark,
		backgroundColor: vars.color.bg.primary,
	},
	'::placeholder': {
		color: vars.color.text.tertiary,
	},
})

export const searchWrapper = style({
	position: 'relative',
})

export const searchIcon = style({
	position: 'absolute',
	left: vars.spacing.sm,
	top: '50%',
	transform: 'translateY(-50%)',
	color: vars.color.text.tertiary,
	pointerEvents: 'none',
})

// Options list
export const optionsList = style({
	overflowY: 'auto',
	flex: 1,
	maxHeight: '260px',
})

export const optionItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	cursor: 'pointer',
	transition: `background-color ${vars.transitionDuration.base}`,
	borderBottom: `1px solid ${vars.color.border.primary}`,
	':hover': {
		backgroundColor: vars.color.bg.secondary,
	},
	':last-child': {
		borderBottom: 'none',
	},
})

export const optionItemSelected = style({
	backgroundColor: vars.color.bg.secondary,
	':hover': {
		backgroundColor: vars.color.bg.secondary,
	},
})

export const optionInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	flex: 1,
	minWidth: 0,
})

export const optionName = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const optionMeta = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const optionMetaItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: '4px',
})

export const checkIcon = style({
	color: vars.color.primary.dark,
	flexShrink: 0,
})

export const noResults = style({
	padding: vars.spacing.lg,
	textAlign: 'center',
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
})

// Preview card - Compact inline design
export const previewCard = style({
	marginTop: vars.spacing.xs,
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	display: 'flex',
	alignItems: 'center',
	flexWrap: 'wrap',
	gap: vars.spacing.md,
})

export const previewHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	flex: 1,
	minWidth: 0,
})

export const previewAvatarWrapper = style({
	flexShrink: 0,
})

export const previewInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	flex: 1,
	minWidth: 0,
})

export const previewName = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const previewDocument = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

export const documentBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `1px ${vars.spacing.xs}`,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	fontSize: '10px',
	fontWeight: vars.fontWeight.medium,
	borderRadius: vars.borderRadius.sm,
	textTransform: 'uppercase',
})

export const previewMeta = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	flexShrink: 0,

	'@media': {
		'(max-width: 600px)': {
			display: 'none',
		},
	},
})

export const previewMetaItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const previewMetaIcon = style({
	color: vars.color.primary.dark,
	flexShrink: 0,
})

export const previewGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 480px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const previewItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const previewLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.tertiary,
	textTransform: 'uppercase',
	fontWeight: vars.fontWeight.medium,
	letterSpacing: '0.5px',
})

export const previewValue = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	fontWeight: vars.fontWeight.medium,
})

export const previewValueEmpty = style({
	color: vars.color.text.tertiary,
	fontStyle: 'italic',
})

export const previewTitle = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	marginBottom: vars.spacing.sm,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

export const previewCheckBadge = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '20px',
	height: '20px',
	backgroundColor: vars.color.success.main,
	color: vars.color.neutral.white,
	borderRadius: vars.borderRadius.full,
	flexShrink: 0,
})

// Error message
export const errorMessage = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.error.main,
	marginTop: vars.spacing.xs,
})

// Loading state
const spin = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

export const loadingSpinner = style({
	animation: `${spin} 1s linear infinite`,
	color: vars.color.text.tertiary,
})

export const loadingContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.lg,
	gap: vars.spacing.sm,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
})
