import { style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

export const page = style({
  minHeight: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.spacing.md,
  backgroundColor: vars.color.bg.secondary,
});

export const card = style({
  width: "100%",
  maxWidth: "560px",
  backgroundColor: vars.color.bg.primary,
  borderRadius: vars.borderRadius.lg,
  boxShadow: vars.shadow.lg,
  padding: vars.spacing.lg,
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,

  "@media": {
    [mediaQuery.md]: {
      padding: vars.spacing.xl,
    },
  },
});

export const badge = style({
  alignSelf: "flex-start",
  padding: `${vars.spacing["2xs"]} ${vars.spacing.xs}`,
  borderRadius: vars.borderRadius.full,
  backgroundColor: vars.color.secondary.light,
  color: vars.color.primary.dark,
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.medium,
  letterSpacing: vars.letterSpacing.tight,
});

export const title = style({
  fontFamily: vars.fontFamily.heading,
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  margin: 0,
});

export const subtitle = style({
  fontFamily: vars.fontFamily.body,
  fontSize: vars.fontSize.sm,
  color: vars.color.text.secondary,
  margin: 0,
  lineHeight: vars.lineHeight.relaxed,
});

export const highlights = style({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: vars.spacing.xs,

  "@media": {
    [mediaQuery.sm]: {
      gridTemplateColumns: "1fr 1fr",
    },
  },
});

export const highlightItem = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.spacing.xs,
  padding: vars.spacing.sm,
  borderRadius: vars.borderRadius.md,
  backgroundColor: vars.color.bg.secondary,
});

export const highlightIcon = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: vars.borderRadius.full,
  backgroundColor: vars.color.secondary.light,
  color: vars.color.primary.dark,
});

export const highlightText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.relaxed,
});

export const actions = style({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: vars.spacing.xs,

  "@media": {
    [mediaQuery.sm]: {
      gridTemplateColumns: "1fr 1fr",
    },
  },
});
