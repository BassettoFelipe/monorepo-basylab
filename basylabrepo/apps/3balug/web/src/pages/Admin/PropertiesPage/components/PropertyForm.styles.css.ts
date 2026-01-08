import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const spin = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

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

export const row4Cols = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr 1fr 1fr',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 768px)': {
			gridTemplateColumns: '1fr 1fr',
		},
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const rowAddress = style({
	display: 'grid',
	gridTemplateColumns: '120px 2fr 80px',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const cepWrapper = style({
	position: 'relative',
})

export const cepHint = style({
	position: 'absolute',
	bottom: '-18px',
	left: 0,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const cepAlert = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	backgroundColor: '#FEF3C7',
	border: '1px solid #F59E0B',
	borderRadius: vars.borderRadius.md,
	gridColumn: '1 / -1',
})

export const cepAlertIcon = style({
	color: '#D97706',
	flexShrink: 0,
	marginTop: '2px',
})

export const cepAlertContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const cepAlertTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: '#92400E',
	margin: 0,
})

export const cepAlertText = style({
	fontSize: vars.fontSize.xs,
	color: '#A16207',
	margin: 0,
})

export const spinner = style({
	animation: `${spin} 1s linear infinite`,
	color: vars.color.primary.main,
})

export const featuresGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
	gap: vars.spacing.md,
})

export const featureCheckbox = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	cursor: 'pointer',
})

export const checkbox = style({
	width: '18px',
	height: '18px',
	cursor: 'pointer',
})

export const featureLabel = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	cursor: 'pointer',
})

export const infoBox = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	backgroundColor: '#EFF6FF',
	border: '1px solid #3B82F6',
	borderRadius: vars.borderRadius.md,
})

export const infoBoxIcon = style({
	color: '#2563EB',
	flexShrink: 0,
	marginTop: '2px',
})

export const infoBoxContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const infoBoxTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: '#1E40AF',
	margin: 0,
})

export const infoBoxText = style({
	fontSize: vars.fontSize.sm,
	color: '#1E40AF',
	margin: 0,
	lineHeight: 1.5,
})

export const row2ColsInner = style({
	display: 'grid',
	gridTemplateColumns: '100px 1fr',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr 1fr',
		},
	},
})

// Marketplace card
export const marketplaceCard = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.secondary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	gap: vars.spacing.lg,
})

export const marketplaceHeader = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
})

export const marketplaceIcon = style({
	color: vars.color.primary.main,
	flexShrink: 0,
})

export const marketplaceInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const marketplaceTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const marketplaceDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
	lineHeight: 1.5,
})

export const marketplaceToggle = style({
	position: 'relative',
	display: 'inline-block',
	width: '52px',
	height: '28px',
	flexShrink: 0,
})

export const toggleInput = style({
	opacity: 0,
	width: 0,
	height: 0,
})

export const toggleSlider = style({
	position: 'absolute',
	cursor: 'pointer',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundColor: vars.color.border.primary,
	transition: `all ${vars.transitionDuration.base}`,
	borderRadius: '28px',
	'::before': {
		position: 'absolute',
		content: '""',
		height: '22px',
		width: '22px',
		left: '3px',
		bottom: '3px',
		backgroundColor: '#FFFFFF',
		transition: `all ${vars.transitionDuration.base}`,
		borderRadius: '50%',
		boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
	},
})

// Global styles for toggle input states
globalStyle(`${toggleInput}:checked + ${toggleSlider}`, {
	backgroundColor: vars.color.primary.main,
})

globalStyle(`${toggleInput}:checked + ${toggleSlider}::before`, {
	transform: 'translateX(24px)',
})

globalStyle(`${toggleInput}:focus + ${toggleSlider}`, {
	boxShadow: '0 0 0 3px rgba(154, 169, 51, 0.3)',
})

globalStyle(`${toggleInput}:disabled + ${toggleSlider}`, {
	opacity: 0.5,
	cursor: 'not-allowed',
})
