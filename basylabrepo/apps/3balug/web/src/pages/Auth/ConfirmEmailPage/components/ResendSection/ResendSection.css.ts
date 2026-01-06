import { style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

export const footerText = style({
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

export const remainingAttemptsText = style({
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.tertiary,
  textAlign: "center",
});

export const blockedContainer = style({
  padding: vars.spacing.lg,
  backgroundColor: vars.color.neutral.offWhite,
  borderRadius: vars.borderRadius.lg,
  border: `1px solid ${vars.color.neutral.grayLight}`,
  textAlign: "center",

  "@media": {
    [mediaQuery.md]: {
      padding: vars.spacing.md,
    },
  },
});

export const blockedTitle = style({
  fontSize: vars.fontSize.base,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.primary.dark,
  marginBottom: vars.spacing.xs,
  lineHeight: vars.lineHeight.normal,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize.sm,
    },
  },
});

export const blockedText = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  lineHeight: vars.lineHeight.relaxed,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize.xs,
    },
  },
});
