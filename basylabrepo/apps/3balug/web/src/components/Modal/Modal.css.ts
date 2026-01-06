import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const slideUp = keyframes({
  from: {
    opacity: 0,
    transform: "translateY(20px)",
  },
  to: {
    opacity: 1,
    transform: "translateY(0)",
  },
});

export const overlay = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: vars.spacing.md,
  animation: `${fadeIn} 0.2s ease-in-out`,
});

export const modal = style({
  backgroundColor: vars.color.bg.primary,
  borderRadius: vars.borderRadius.lg,
  boxShadow: vars.shadow.xl,
  width: "100%",
  maxHeight: "90vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  animation: `${slideUp} 0.3s ease-out`,
});

export const modalSm = style({
  maxWidth: "400px",
});

export const modalMd = style({
  maxWidth: "500px",
});

export const modalLg = style({
  maxWidth: "800px",
});

export const modalXl = style({
  maxWidth: "1200px",
});

export const header = style({
  padding: vars.spacing.lg,
  borderBottom: `1px solid ${vars.color.border.primary}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  margin: 0,
});

export const closeButton = style({
  background: "none",
  border: "none",
  padding: vars.spacing.xs,
  cursor: "pointer",
  color: vars.color.text.secondary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.borderRadius.md,
  transition: `all ${vars.transitionDuration.base}`,
  ":hover": {
    backgroundColor: vars.color.bg.secondary,
    color: vars.color.text.primary,
  },
});

export const body = style({
  padding: vars.spacing.lg,
  overflowY: "auto",
  flex: 1,
});

export const footer = style({
  padding: vars.spacing.lg,
  borderTop: `1px solid ${vars.color.border.primary}`,
  display: "flex",
  gap: vars.spacing.md,
  justifyContent: "flex-end",
});
