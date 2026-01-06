import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

const fadeIn = keyframes({
  "0%": {
    opacity: 0,
    transform: "translateY(20px)",
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0)",
  },
});

const scaleIn = keyframes({
  "0%": {
    opacity: 0,
    transform: "scale(0.8)",
  },
  "50%": {
    transform: "scale(1.05)",
  },
  "100%": {
    opacity: 1,
    transform: "scale(1)",
  },
});

export const page = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100%",
  padding: vars.spacing.md,
  backgroundColor: vars.color.bg.secondary,
  animation: `${fadeIn} 0.5s ease-out`,
});

export const container = style({
  width: "100%",
  maxWidth: "500px",
  backgroundColor: vars.color.bg.primary,
  borderRadius: vars.borderRadius.lg,
  boxShadow: vars.shadow.md,
});

export const content = style({
  display: "flex",
  flexDirection: "column",
  padding: vars.spacing.xl,
  "@media": {
    "(max-width: 640px)": {
      padding: vars.spacing.lg,
    },
  },
});

export const iconWrapper = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "64px",
  height: "64px",
  margin: "0 auto",
  marginBottom: vars.spacing.lg,
  borderRadius: vars.borderRadius.full,
  backgroundColor: "#dcfce7",
  animation: `${scaleIn} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)`,
});

export const icon = style({
  color: "#15803d",
  width: "36px",
  height: "36px",
});

export const header = style({
  textAlign: "center",
  marginBottom: vars.spacing.lg,
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  marginBottom: vars.spacing.sm,
  lineHeight: vars.lineHeight.tight,
  "@media": {
    "(max-width: 640px)": {
      fontSize: vars.fontSize.lg,
    },
  },
});

export const subtitle = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.normal,
  "@media": {
    "(max-width: 640px)": {
      fontSize: vars.fontSize.sm,
    },
  },
});

export const divider = style({
  height: "1px",
  backgroundColor: vars.color.border.primary,
  margin: `${vars.spacing.md} 0`,
});

export const stepsSection = style({
  marginBottom: vars.spacing.lg,
});

export const stepsTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  marginBottom: vars.spacing.md,
  textAlign: "left",
});

export const stepsList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
});

export const stepCard = style({
  display: "flex",
  gap: vars.spacing.sm,
  padding: vars.spacing.md,
  backgroundColor: vars.color.bg.secondary,
  borderRadius: vars.borderRadius.md,
  border: `1px solid ${vars.color.border.secondary}`,
  transition: "all 0.2s ease",
  ":hover": {
    borderColor: "#15803d",
    transform: "translateY(-1px)",
    boxShadow: vars.shadow.sm,
  },
});

export const stepIconWrapper = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  minWidth: "40px",
  backgroundColor: "#f0fdf4",
  borderRadius: vars.borderRadius.md,
  flexShrink: 0,
});

export const stepIcon = style({
  width: "20px",
  height: "20px",
  color: "#166534",
});

export const stepContent = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const stepTitle = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.tight,
});

export const stepDescription = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.normal,
});

export const actions = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
});
