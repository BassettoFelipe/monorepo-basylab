import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const passwordRequirements = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: '6px',
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	minHeight: '60px',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
})

export const passwordRequirement = style({
	display: 'flex',
	alignItems: 'center',
	gap: '7px',
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
	padding: '4px 6px',
	borderRadius: vars.borderRadius.sm,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	backgroundColor: 'transparent',
})

export const passwordRequirementMet = style({
	color: vars.color.success.dark,
	fontWeight: vars.fontWeight.medium,
	backgroundColor: 'rgba(34, 197, 94, 0.12)',
})

export const passwordRequirementIcon = style({
	width: '14px',
	height: '14px',
	flexShrink: 0,
	color: vars.color.neutral.grayDark,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	opacity: vars.opacity[50],
	selectors: {
		[`${passwordRequirementMet} &`]: {
			color: vars.color.success.dark,
			opacity: 1,
			filter: `drop-shadow(0 0 3px ${vars.color.success.main}50)`,
		},
	},
})
