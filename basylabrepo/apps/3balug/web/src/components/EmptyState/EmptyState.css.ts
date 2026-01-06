import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const emptyState = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: `${vars.spacing["3xl"]} ${vars.spacing.xl}`,
  textAlign: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: vars.borderRadius.lg,
  border: "2px dashed #E7E5E4",
  minHeight: "400px",

  "@media": {
    "(max-width: 768px)": {
      minHeight: "300px",
      padding: `${vars.spacing["2xl"]} ${vars.spacing.lg}`,
    },
    "(max-width: 640px)": {
      minHeight: "250px",
      padding: `${vars.spacing.xl} ${vars.spacing.md}`,
    },
  },
});

export const emptyStateIcon = style({
  width: "96px",
  height: "96px",
  borderRadius: vars.borderRadius.full,
  backgroundColor: "#F7FCE8",
  color: "#78716C",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: vars.spacing.xl,
  flexShrink: 0,

  "@media": {
    "(max-width: 640px)": {
      width: "72px",
      height: "72px",
      marginBottom: vars.spacing.lg,
    },
  },
});

export const emptyStateTitle = style({
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  color: "#292524",
  marginBottom: vars.spacing.sm,

  "@media": {
    "(max-width: 640px)": {
      fontSize: vars.fontSize.lg,
    },
  },
});

export const emptyStateDescription = style({
  fontSize: vars.fontSize.base,
  color: "#78716C",
  maxWidth: "500px",
  marginBottom: vars.spacing.xl,
  lineHeight: vars.lineHeight.relaxed,

  "@media": {
    "(max-width: 640px)": {
      fontSize: vars.fontSize.sm,
      marginBottom: vars.spacing.lg,
    },
  },
});
