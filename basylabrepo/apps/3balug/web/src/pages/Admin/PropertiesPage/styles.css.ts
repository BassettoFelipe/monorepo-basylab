import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const sectionHeader = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'flex-start',
	marginBottom: vars.spacing.lg,
	gap: vars.spacing.md,
	flexWrap: 'wrap',
})

export const sectionTitleWrapper = style({
	flex: 1,
})

export const sectionTitle = style({
	fontSize: '24px',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	marginBottom: vars.spacing.xs,
})

export const sectionDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
})

export const filtersCard = style({
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	padding: vars.spacing.md,
	marginBottom: vars.spacing.lg,
	boxShadow: vars.shadow.sm,
})

export const filterRow = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing.md,
	rowGap: vars.spacing.lg,
	alignItems: 'flex-end',
})

export const filterActions = style({
	display: 'flex',
	gap: vars.spacing.sm,
	alignItems: 'flex-end',
	marginLeft: 'auto',
})

export const filterBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	minWidth: '18px',
	height: '18px',
	padding: '0 6px',
	fontSize: '11px',
	fontWeight: vars.fontWeight.bold,
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
	transition: `all ${vars.transitionDuration.base}`,
	selectors: {
		'button:hover &': {
			backgroundColor: vars.color.primary.main,
			color: vars.color.primary.dark,
		},
	},
})

export const filterDivider = style({
	height: '1px',
	backgroundColor: vars.color.border.primary,
	margin: `${vars.spacing.lg} 0`,
})

export const filterItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	flex: 1,
	minWidth: '150px',
	maxWidth: '250px',
})

export const filterLabel = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const tableWrapper = style({
	width: '100%',
	overflowX: 'auto',
	borderRadius: vars.borderRadius.lg,
	boxShadow: vars.shadow.sm,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	WebkitOverflowScrolling: 'touch',
})

export const table = style({
	width: '100%',
	minWidth: '900px',
	backgroundColor: vars.color.bg.primary,
	borderCollapse: 'collapse',
	tableLayout: 'fixed',
})

export const tableHeader = style({
	backgroundColor: vars.color.bg.secondary,
	borderBottom: `2px solid ${vars.color.border.primary}`,
})

export const tableHeaderCell = style({
	padding: '12px 16px',
	textAlign: 'left',
	fontSize: '11px',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

// Colunas com larguras fixas
export const colProperty = style({
	width: '22%',
	minWidth: '180px',
})

export const colType = style({
	width: '12%',
	minWidth: '100px',
})

export const colListingType = style({
	width: '12%',
	minWidth: '100px',
})

export const colStatus = style({
	width: '12%',
	minWidth: '100px',
})

export const colPrices = style({
	width: '15%',
	minWidth: '130px',
})

export const colFeatures = style({
	width: '10%',
	minWidth: '80px',
})

export const colActions = style({
	width: '110px',
	minWidth: '110px',
	maxWidth: '110px',
})

export const sortableHeader = style({
	cursor: 'pointer',
	userSelect: 'none',
	transition: `color ${vars.transitionDuration.base}`,
	':hover': {
		color: vars.color.text.primary,
	},
})

export const sortableHeaderContent = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: '4px',
})

export const sortIcon = style({
	opacity: 0.3,
	transition: `opacity ${vars.transitionDuration.base}`,
	flexShrink: 0,
	selectors: {
		'th:hover &': {
			opacity: 0.6,
		},
	},
})

export const sortIconActive = style({
	opacity: 1,
	color: vars.color.primary.dark,
	flexShrink: 0,
})

export const tableRow = style({
	borderBottom: `1px solid ${vars.color.border.primary}`,
	transition: `background-color ${vars.transitionDuration.base}`,
	':hover': {
		backgroundColor: 'rgba(0, 0, 0, 0.02)',
	},
})

export const tableCell = style({
	padding: '12px 16px',
	fontSize: '13px',
	color: vars.color.text.primary,
	verticalAlign: 'middle',
})

export const propertyMainInfo = style({
	display: 'flex',
	alignItems: 'center',
	gap: '12px',
	minWidth: '180px',
})

export const propertyThumbnail = style({
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.md,
	objectFit: 'cover',
	flexShrink: 0,
	border: '2px solid rgba(0, 0, 0, 0.05)',
})

export const propertyThumbnailFallback = style({
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.md,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
	backgroundColor: '#F3F4F6',
	color: '#9CA3AF',
	border: '2px solid rgba(0, 0, 0, 0.05)',
})

export const propertyInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
	minWidth: 0,
})

export const propertyTitle = style({
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	fontSize: '14px',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

export const propertyMeta = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	gap: '2px',
})

export const propertyAddress = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: '2px',
	fontSize: '12px',
	color: vars.color.text.secondary,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

export const propertyCode = style({
	fontSize: '11px',
	color: vars.color.text.secondary,
	fontFamily: 'monospace',
	backgroundColor: '#F3F4F6',
	padding: '1px 4px',
	borderRadius: vars.borderRadius.sm,
})

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: '2px 6px',
	borderRadius: vars.borderRadius.full,
	fontSize: '10px',
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: '0.3px',
})

export const badgeHouse = style({
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
})

export const badgeApartment = style({
	backgroundColor: '#E0E7FF',
	color: '#4338CA',
})

export const badgeLand = style({
	backgroundColor: '#FEF3C7',
	color: '#92400E',
})

export const badgeCommercial = style({
	backgroundColor: '#D1FAE5',
	color: '#065F46',
})

export const badgeRural = style({
	backgroundColor: '#ECFCCB',
	color: '#3F6212',
})

export const badgeRent = style({
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
})

export const badgeSale = style({
	backgroundColor: '#D1FAE5',
	color: '#065F46',
})

export const badgeBoth = style({
	backgroundColor: '#E0E7FF',
	color: '#4338CA',
})

export const badgeAvailable = style({
	backgroundColor: '#D1FAE5',
	color: '#065F46',
})

export const badgeRented = style({
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
})

export const badgeSold = style({
	backgroundColor: '#FEE2E2',
	color: '#991B1B',
})

export const badgeMaintenance = style({
	backgroundColor: '#FEF3C7',
	color: '#92400E',
})

export const badgeUnavailable = style({
	backgroundColor: '#F3F4F6',
	color: '#6B7280',
})

export const priceInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
})

export const priceRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: '6px',
})

export const priceIcon = style({
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const priceIconMuted = style({
	color: '#D1D5DB',
	flexShrink: 0,
})

export const priceLabel = style({
	fontSize: '11px',
	color: vars.color.text.secondary,
})

export const priceValue = style({
	fontSize: '13px',
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const priceValueMuted = style({
	fontSize: '13px',
	color: '#D1D5DB',
})

export const featuresInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
})

export const featureRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: '6px',
})

export const featureIcon = style({
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const featureIconMuted = style({
	color: '#D1D5DB',
	flexShrink: 0,
})

export const featureText = style({
	fontSize: '13px',
	color: vars.color.text.primary,
})

export const featureTextMuted = style({
	fontSize: '13px',
	color: '#D1D5DB',
})

export const actions = style({
	display: 'flex',
	gap: '6px',
	alignItems: 'center',
	justifyContent: 'flex-start',
	flexShrink: 0,
})

export const iconButton = style({
	border: '1px solid rgba(0, 0, 0, 0.08)',
	width: '30px',
	height: '30px',
	padding: 0,
	cursor: 'pointer',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: vars.borderRadius.md,
	transition: `all ${vars.transitionDuration.base}`,
	position: 'relative',
	backgroundColor: '#F9FAFB',
	color: '#6B7280',
	boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
	flexShrink: 0,
	':hover': {
		borderColor: '#D1D5DB',
		color: '#374151',
		transform: 'translateY(-1px)',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
	},
	':active': {
		transform: 'translateY(0)',
		boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
	},
	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
	},
})

export const iconButtonDanger = style({
	backgroundColor: '#FEF2F2',
	color: '#EF4444',
	borderColor: '#FEE2E2',
	':hover': {
		backgroundColor: '#FEE2E2',
		borderColor: '#FECACA',
		color: '#DC2626',
		boxShadow: '0 4px 6px rgba(239, 68, 68, 0.15)',
	},
})

export const pagination = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginTop: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.lg,
	boxShadow: vars.shadow.sm,
	border: `1px solid ${vars.color.border.primary}`,
	flexWrap: 'wrap',
	gap: vars.spacing.sm,
})

export const paginationInfo = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
})

export const paginationButtons = style({
	display: 'flex',
	gap: vars.spacing.xs,
	alignItems: 'center',
})

export const paginationButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minWidth: '36px',
	height: '36px',
	padding: '0 12px',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		backgroundColor: vars.color.bg.secondary,
		borderColor: vars.color.primary.dark,
	},
	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
		backgroundColor: vars.color.bg.primary,
		borderColor: vars.color.border.primary,
	},
})

export const paginationButtonActive = style({
	backgroundColor: vars.color.primary.dark,
	borderColor: vars.color.primary.dark,
	color: vars.color.primary.main,
	fontWeight: vars.fontWeight.bold,
	':hover': {
		backgroundColor: vars.color.primary.dark,
		borderColor: vars.color.primary.dark,
	},
})

export const paginationEllipsis = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minWidth: '36px',
	height: '36px',
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	userSelect: 'none',
})
