import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const container = style({
	maxWidth: '1200px',
	margin: '0 auto',
})

export const backLink = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
	textDecoration: 'none',
	marginBottom: vars.spacing.lg,
	transition: `color ${vars.transitionDuration.base}`,

	':hover': {
		color: vars.color.text.primary,
	},
})

export const header = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'flex-start',
	marginBottom: vars.spacing.xl,
	gap: vars.spacing.lg,
	flexWrap: 'wrap',
})

export const headerInfo = style({
	flex: 1,
})

export const title = style({
	fontSize: '28px',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	marginBottom: vars.spacing.sm,
})

export const subtitle = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	margin: 0,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const headerActions = style({
	display: 'flex',
	gap: vars.spacing.sm,
})

export const badgesRow = style({
	display: 'flex',
	gap: vars.spacing.sm,
	marginTop: vars.spacing.md,
	flexWrap: 'wrap',
})

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const badgeHouse = style({ backgroundColor: '#DBEAFE', color: '#1E40AF' })
export const badgeApartment = style({ backgroundColor: '#E0E7FF', color: '#4338CA' })
export const badgeLand = style({ backgroundColor: '#FEF3C7', color: '#92400E' })
export const badgeCommercial = style({ backgroundColor: '#D1FAE5', color: '#065F46' })
export const badgeRural = style({ backgroundColor: '#ECFCCB', color: '#3F6212' })

export const badgeRent = style({ backgroundColor: '#DBEAFE', color: '#1E40AF' })
export const badgeSale = style({ backgroundColor: '#D1FAE5', color: '#065F46' })
export const badgeBoth = style({ backgroundColor: '#E0E7FF', color: '#4338CA' })

export const badgeAvailable = style({ backgroundColor: '#D1FAE5', color: '#065F46' })
export const badgeRented = style({ backgroundColor: '#DBEAFE', color: '#1E40AF' })
export const badgeSold = style({ backgroundColor: '#FEE2E2', color: '#991B1B' })
export const badgeMaintenance = style({ backgroundColor: '#FEF3C7', color: '#92400E' })
export const badgeUnavailable = style({ backgroundColor: '#F3F4F6', color: '#6B7280' })

export const content = style({
	display: 'grid',
	gridTemplateColumns: '2fr 1fr',
	gap: vars.spacing.xl,

	'@media': {
		'(max-width: 968px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const mainColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xl,
})

export const sideColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
})

export const card = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.lg,
	border: `1px solid ${vars.color.border.primary}`,
	padding: vars.spacing.lg,
	boxShadow: vars.shadow.sm,
})

export const cardTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	marginBottom: vars.spacing.md,
	paddingBottom: vars.spacing.sm,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const galleryContainer = style({
	position: 'relative',
})

export const mainImage = style({
	width: '100%',
	aspectRatio: '16/9',
	objectFit: 'cover',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.secondary,
})

export const thumbnailsRow = style({
	display: 'flex',
	gap: vars.spacing.sm,
	marginTop: vars.spacing.md,
	overflowX: 'auto',
	paddingBottom: vars.spacing.xs,
})

export const thumbnailButton = style({
	padding: 0,
	margin: 0,
	background: 'none',
	border: '2px solid transparent',
	borderRadius: vars.borderRadius.md,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	flexShrink: 0,
	overflow: 'hidden',

	':hover': {
		borderColor: vars.color.primary.main,
	},
})

export const thumbnail = style({
	width: '80px',
	height: '60px',
	objectFit: 'cover',
	display: 'block',
})

export const thumbnailActive = style({
	borderColor: vars.color.primary.main,
})

export const noPhotos = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	aspectRatio: '16/9',
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	color: vars.color.text.secondary,
	gap: vars.spacing.sm,
})

export const description = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
	lineHeight: 1.6,
	whiteSpace: 'pre-wrap',
})

export const noDescription = style({
	color: vars.color.text.secondary,
	fontStyle: 'italic',
})

export const infoGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.md,
})

export const infoItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const infoLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const infoValue = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const priceCard = style({
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	padding: vars.spacing.lg,
})

export const priceLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	marginBottom: vars.spacing.xs,
})

export const priceValue = style({
	fontSize: '24px',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const pricePerMonth = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	fontWeight: vars.fontWeight.regular,
})

export const featuresList = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing.sm,
})

export const featureTag = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: vars.color.success.light,
	color: vars.color.success.dark,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
})

export const ownerCard = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
})

export const ownerAvatar = style({
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
})

export const ownerInfo = style({
	flex: 1,
})

export const ownerName = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const ownerRole = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
})

export const addressText = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
	lineHeight: 1.6,
})

export const loadingContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
})

export const errorContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
	gap: vars.spacing.md,
	color: vars.color.text.secondary,
})
