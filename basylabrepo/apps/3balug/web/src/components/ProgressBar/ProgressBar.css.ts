/**
 * ProgressBar Component Styles - 3Balug Brand
 * Minimalista com detalhes sutis
 */

import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const header = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'baseline',
})

export const info = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const title = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const subtitle = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
})

export const percentage = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
})

export const barContainer = style({
	width: '100%',
	height: '8px',
	backgroundColor: vars.color.border.primary,
	borderRadius: vars.borderRadius.full,
	overflow: 'hidden',
})

export const barFill = style({
	height: '100%',
	backgroundColor: vars.color.primary.main,
	borderRadius: vars.borderRadius.full,
	transition: `width ${vars.transitionDuration.base} ${vars.transitionTiming.easeOut}`,
})

// Não utilizados
export const milestones = style({ display: 'none' })
export const milestone = style({})
export const milestoneDot = style({})
export const milestoneDotActive = style({})
export const milestoneDotComplete = style({})
export const milestoneLabel = style({})
export const steps = style({ display: 'none' })
export const step = style({})
export const stepNumber = style({})
export const stepPending = style({})
export const stepNumberPending = style({})
export const stepActive = style({})
export const stepNumberActive = style({})
export const stepCompleted = style({})
export const stepIconCompleted = style({})
