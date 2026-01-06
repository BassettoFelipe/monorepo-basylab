import { style, styleVariants } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
});

export const rootVariant = styleVariants({
  default: {
    gap: vars.spacing.md,
  },
  compact: {
    gap: vars.spacing.sm,
  },
  separated: {
    gap: vars.spacing.lg,
  },
  flush: {
    gap: "0",
  },
});

export const item = style({
  overflow: "hidden",
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
});

export const itemVariant = styleVariants({
  default: {
    backgroundColor: vars.color.bg.primary,
    borderRadius: vars.borderRadius.xl,
    border: `1px solid ${vars.color.border.primary}`,

    selectors: {
      "&:hover": {
        borderColor: vars.color.primary.dark,
      },
      '&[data-state="open"]': {
        borderColor: vars.color.primary.dark,
        boxShadow: vars.shadow.sm,
      },
    },
  },
  card: {
    backgroundColor: vars.color.bg.primary,
    borderRadius: vars.borderRadius.xl,
    border: `1px solid ${vars.color.border.primary}`,

    selectors: {
      "&:hover": {
        borderColor: vars.color.primary.main,
      },
      '&[data-state="open"]': {
        borderColor: vars.color.primary.main,
        boxShadow: vars.shadow.primary,
      },
    },
  },
  bordered: {
    backgroundColor: vars.color.bg.primary,
    borderRadius: vars.borderRadius.lg,
    border: `1px solid ${vars.color.border.primary}`,

    selectors: {
      "&:hover": {
        borderColor: vars.color.primary.dark,
      },
      '&[data-state="open"]': {
        borderColor: vars.color.primary.dark,
      },
    },
  },
  ghost: {
    backgroundColor: "transparent",
    borderRadius: vars.borderRadius.lg,
    border: "1px solid transparent",

    selectors: {
      "&:hover": {
        backgroundColor: vars.color.bg.primary,
        borderColor: vars.color.border.primary,
      },
      '&[data-state="open"]': {
        backgroundColor: vars.color.bg.primary,
        borderColor: vars.color.primary.dark,
      },
    },
  },
});

export const trigger = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: `${vars.spacing.lg} ${vars.spacing.xl}`,
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  gap: vars.spacing.lg,

  selectors: {
    "&:focus-visible": {
      outline: `2px solid ${vars.color.primary.main}`,
      outlineOffset: "-2px",
      borderRadius: vars.borderRadius.lg,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: vars.opacity[50],
    },
  },

  "@media": {
    [mediaQuery.md]: {
      padding: `${vars.spacing.md} ${vars.spacing.lg}`,
    },
  },
});

export const triggerContent = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  flex: 1,
  minWidth: 0,
});

export const triggerTitle = style({
  fontSize: vars.fontSize.base,
  fontFamily: vars.fontFamily.body,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.normal,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize.sm,
    },
  },
});

export const triggerSubtitle = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  lineHeight: vars.lineHeight.normal,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize.xs,
    },
  },
});

export const triggerIcon = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: vars.color.text.secondary,
  transition: `transform ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

  selectors: {
    '&[data-state="open"]': {
      transform: "rotate(180deg)",
    },
  },
});

export const content = style({
  overflow: "hidden",
});

export const contentInner = style({
  padding: `${vars.spacing.sm} ${vars.spacing.xl} ${vars.spacing.xl}`,
  fontSize: vars.fontSize.base,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  lineHeight: vars.lineHeight.relaxed,

  "@media": {
    [mediaQuery.md]: {
      padding: `${vars.spacing.xs} ${vars.spacing.lg} ${vars.spacing.lg}`,
      fontSize: vars.fontSize.sm,
    },
  },
});
