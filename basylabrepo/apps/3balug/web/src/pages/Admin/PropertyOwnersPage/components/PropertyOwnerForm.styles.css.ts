import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

export const form = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xl,
});

export const section = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.md,
});

export const sectionTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  margin: 0,
  paddingBottom: vars.spacing.sm,
  borderBottom: `1px solid ${vars.color.border.primary}`,
});

export const row2Cols = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.spacing.md,

  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const row3Cols = style({
  display: "grid",
  gridTemplateColumns: "1fr 2fr 80px",
  gap: vars.spacing.md,

  "@media": {
    "(max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

export const cepWrapper = style({
  position: "relative",
});

export const cepHint = style({
  position: "absolute",
  bottom: "-18px",
  left: 0,
  fontSize: vars.fontSize.xs,
  color: vars.color.text.secondary,
});

export const cepAlert = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.spacing.sm,
  padding: vars.spacing.md,
  backgroundColor: "#FEF3C7",
  border: "1px solid #F59E0B",
  borderRadius: vars.borderRadius.md,
  gridColumn: "1 / -1",
});

export const cepAlertIcon = style({
  color: "#D97706",
  flexShrink: 0,
  marginTop: "2px",
});

export const cepAlertContent = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const cepAlertTitle = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: "#92400E",
  margin: 0,
});

export const cepAlertText = style({
  fontSize: vars.fontSize.xs,
  color: "#A16207",
  margin: 0,
});

export const spinner = style({
  animation: `${spin} 1s linear infinite`,
  color: vars.color.primary.main,
});

export const infoBox = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.spacing.sm,
  padding: vars.spacing.md,
  backgroundColor: "#EFF6FF",
  border: "1px solid #3B82F6",
  borderRadius: vars.borderRadius.md,
});

export const infoBoxIcon = style({
  color: "#2563EB",
  flexShrink: 0,
  marginTop: "2px",
});

export const infoBoxContent = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const infoBoxTitle = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: "#1E40AF",
  margin: 0,
});

export const infoBoxText = style({
  fontSize: vars.fontSize.xs,
  color: "#1D4ED8",
  margin: 0,
});
