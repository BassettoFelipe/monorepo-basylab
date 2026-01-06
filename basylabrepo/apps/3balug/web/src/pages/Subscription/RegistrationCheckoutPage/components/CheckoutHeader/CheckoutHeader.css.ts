import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const checkoutHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  marginBottom: vars.spacing.sm,
  flex: 1,
});

export const checkoutIconWrapper = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  minWidth: "36px",
  borderRadius: vars.borderRadius.md,
  backgroundColor: vars.color.primary.main,
  boxShadow: vars.shadow.primary,
});

export const checkoutIcon = style({
  width: "18px",
  height: "18px",
  color: vars.color.primary.dark,
});

export const checkoutHeaderContent = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
});

export const checkoutHeaderTitle = style({
  fontSize: vars.fontSize.lg,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.tight,
  letterSpacing: vars.letterSpacing.tight,
});

export const checkoutHeaderText = style({
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  marginTop: "1px",
});
