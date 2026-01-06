import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xl,
})

export const header = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,
	paddingBottom: vars.spacing.lg,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const avatar = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '64px',
	height: '64px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: '#fafff0',
	color: vars.color.primary.dark,
	flexShrink: 0,
})

export const headerInfo = style({
	flex: 1,
	minWidth: 0,
})

export const name = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	marginBottom: vars.spacing.xs,
})

export const badges = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	flexWrap: 'wrap',
})

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `4px ${vars.spacing.md}`,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.bold,
	borderRadius: vars.borderRadius.full,
})

export const badgeActive = style({
	backgroundColor: '#dcfce7',
	color: '#166534',
})

export const badgeTerminated = style({
	backgroundColor: '#fef3c7',
	color: '#92400e',
})

export const badgeCancelled = style({
	backgroundColor: '#fee2e2',
	color: '#dc2626',
})

export const badgeExpired = style({
	backgroundColor: '#f3f4f6',
	color: '#6b7280',
})

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const sectionTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.05em',
	margin: 0,
})

export const infoGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
	gap: vars.spacing.md,
})

export const infoItem = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
})

export const infoIcon = style({
	color: vars.color.text.secondary,
	flexShrink: 0,
	marginTop: '2px',
})

export const infoLabel = style({
	display: 'block',
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	marginBottom: '2px',
})

export const infoValue = style({
	display: 'block',
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	lineHeight: 1.5,
})

export const infoValueHighlight = style({
	display: 'block',
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	lineHeight: 1.5,
})

export const infoSubValue = style({
	display: 'block',
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	marginTop: '2px',
})

export const notes = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	lineHeight: 1.6,
	whiteSpace: 'pre-wrap',
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	margin: 0,
})

export const documentsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
	gap: vars.spacing.md,
})

export const documentCard = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	position: 'relative',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		borderColor: vars.color.primary.main,
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
	},
})

export const documentPreview = style({
	width: '100%',
	height: '100px',
	borderRadius: vars.borderRadius.sm,
	overflow: 'hidden',
	backgroundColor: vars.color.bg.secondary,
})

export const documentImage = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
})

export const documentIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	height: '100px',
	borderRadius: vars.borderRadius.sm,
	backgroundColor: '#dbeafe',
	color: '#1e40af',
})

export const documentInfo = style({
	width: '100%',
	textAlign: 'center',
})

export const documentName = style({
	display: 'block',
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	marginBottom: '2px',
})

export const documentType = style({
	display: 'block',
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const documentLink = style({
	position: 'absolute',
	top: vars.spacing.sm,
	right: vars.spacing.sm,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '28px',
	height: '28px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.secondary,
	border: `1px solid ${vars.color.border.primary}`,
	transition: `all ${vars.transitionDuration.base}`,
	textDecoration: 'none',

	':hover': {
		backgroundColor: '#fafff0',
		color: vars.color.primary.dark,
		borderColor: vars.color.primary.main,
	},
})

export const emptyText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	fontStyle: 'italic',
})

export const metadata = style({
	display: 'flex',
	gap: vars.spacing.lg,
	paddingTop: vars.spacing.lg,
	borderTop: `1px solid ${vars.color.border.primary}`,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})
