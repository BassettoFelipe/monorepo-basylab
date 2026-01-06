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
	padding: vars.spacing.lg,
	marginBottom: vars.spacing.lg,
	boxShadow: vars.shadow.sm,
})

export const filterRow = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
	gap: vars.spacing.md,
})

export const filterItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
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
})

export const table = style({
	width: '100%',
	minWidth: '700px',
	backgroundColor: vars.color.bg.primary,
	borderCollapse: 'collapse',
})

export const tableHeader = style({
	backgroundColor: vars.color.bg.secondary,
	borderBottom: `2px solid ${vars.color.border.primary}`,
})

export const tableHeaderCell = style({
	padding: vars.spacing.md,
	textAlign: 'left',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const tableRow = style({
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const tableCell = style({
	padding: vars.spacing.md,
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
})

export const ownerInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const ownerName = style({
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const ownerDocument = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
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

export const badgeCpf = style({
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
})

export const badgeCnpj = style({
	backgroundColor: '#E0E7FF',
	color: '#4338CA',
})

export const actions = style({
	display: 'flex',
	gap: vars.spacing.sm,
	alignItems: 'center',
	justifyContent: 'center',
})

export const iconButton = style({
	border: '1px solid rgba(0, 0, 0, 0.08)',
	padding: '8px',
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: vars.borderRadius.lg,
	transition: `all ${vars.transitionDuration.base}`,
	position: 'relative',
	backgroundColor: '#F9FAFB',
	color: '#6B7280',
	boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
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
	marginTop: vars.spacing.lg,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.lg,
	boxShadow: vars.shadow.sm,
})

export const paginationInfo = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
})

export const paginationButtons = style({
	display: 'flex',
	gap: vars.spacing.sm,
})
