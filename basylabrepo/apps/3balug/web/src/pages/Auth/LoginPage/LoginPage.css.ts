import { style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

export const page = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100%",
  backgroundColor: vars.color.bg.secondary,
  padding: vars.spacing.sm,
  overflowX: "hidden",

  "@media": {
    "(max-width: 480px)": {
      padding: vars.spacing.xs,
      minHeight: "100%",
    },
  },
});

export const container = style({
  display: "grid",
  gridTemplateColumns: "1fr",
  width: "100%",
  maxWidth: "1100px",
  minHeight: "600px",
  backgroundColor: vars.color.bg.primary,
  borderRadius: vars.borderRadius.xl,
  boxShadow: vars.shadow.xl,
  overflow: "hidden",

  "@media": {
    [mediaQuery.lg]: {
      gridTemplateColumns: "1fr 1fr",
    },
    "(max-width: 480px)": {
      minHeight: "auto",
      borderRadius: vars.borderRadius.lg,
    },
  },
});

export const formSection = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: vars.spacing["2xl"],

  "@media": {
    [mediaQuery.lg]: {
      padding: vars.spacing["3xl"],
    },
    "(max-width: 480px)": {
      padding: vars.spacing.lg,
    },
  },
});

export const header = style({
  marginBottom: vars.spacing.xl,

  "@media": {
    "(max-width: 480px)": {
      marginBottom: vars.spacing.md,
    },
  },
});

export const title = style({
  fontSize: vars.fontSize["3xl"],
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  marginBottom: vars.spacing.xs,
  lineHeight: vars.lineHeight.tight,

  "@media": {
    "(max-width: 480px)": {
      fontSize: vars.fontSize["2xl"],
    },
  },
});

export const subtitle = style({
  fontSize: vars.fontSize.base,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  lineHeight: vars.lineHeight.normal,

  "@media": {
    "(max-width: 480px)": {
      fontSize: vars.fontSize.sm,
    },
  },
});

export const form = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.lg,
  marginBottom: vars.spacing.md,

  "@media": {
    "(max-width: 480px)": {
      gap: vars.spacing.md,
    },
  },
});

export const footer = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  textAlign: "center",
  marginBottom: vars.spacing.md,

  "@media": {
    "(max-width: 480px)": {
      fontSize: vars.fontSize.xs,
      marginBottom: vars.spacing.sm,
    },
  },
});

export const link = style({
  color: vars.color.secondary.main,
  fontWeight: vars.fontWeight.bold,
  textDecoration: "none",
  transition: `color ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,

  selectors: {
    "&:hover": {
      color: vars.color.primary.dark,
      textDecoration: "underline",
    },
  },
});

export const plansLink = style({
  display: "inline-block",
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.secondary.main,
  fontWeight: vars.fontWeight.bold,
  textDecoration: "none",
  width: "fit-content",
  margin: "0 auto",
  transition: `color ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,

  selectors: {
    "&:hover": {
      color: vars.color.primary.dark,
      textDecoration: "underline",
    },
  },
});
