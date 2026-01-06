import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const pageHeader = style({
  marginBottom: vars.spacing.lg,

  "@media": {
    "(max-width: 768px)": {
      marginBottom: vars.spacing.md,
    },
    "(max-width: 640px)": {
      marginBottom: vars.spacing.sm,
    },
  },
});

export const pageHeaderContent = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: vars.spacing.md,
  backgroundColor: "#FFFFFF",
  padding: vars.spacing.md,
  borderRadius: vars.borderRadius.lg,
  border: "1px solid #F5F5F4",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",

  "@media": {
    "(max-width: 768px)": {
      padding: vars.spacing.md,
      gap: vars.spacing.sm,
    },
    "(max-width: 640px)": {
      padding: vars.spacing.sm,
      gap: vars.spacing.sm,
    },
  },
});

export const pageHeaderInfo = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.md,
  flex: 1,
  minWidth: 0,

  "@media": {
    "(max-width: 640px)": {
      gap: vars.spacing.sm,
      width: "100%",
    },
  },
});

export const pageHeaderTextWrapper = style({
  flex: 1,
  minWidth: 0,
});

export const pageHeaderIcon = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.borderRadius.md,
  backgroundColor: "#F7FCE8",
  color: "#5E6C02",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,

  "@media": {
    "(max-width: 640px)": {
      width: "32px",
      height: "32px",
      borderRadius: vars.borderRadius.md,
    },
  },
});

export const pageHeaderTitle = style({
  fontSize: vars.fontSize.xl,
  fontWeight: vars.fontWeight.bold,
  color: "#1C1917",
  marginBottom: "2px",

  "@media": {
    "(max-width: 768px)": {
      fontSize: vars.fontSize.lg,
    },
    "(max-width: 640px)": {
      fontSize: vars.fontSize.base,
      marginBottom: "1px",
    },
  },
});

export const pageHeaderDescription = style({
  fontSize: vars.fontSize.sm,
  color: "#78716C",

  "@media": {
    "(max-width: 640px)": {
      fontSize: vars.fontSize.xs,
    },
  },
});

export const pageHeaderIconSvg = style({
  width: "24px",
  height: "24px",

  "@media": {
    "(max-width: 640px)": {
      width: "20px",
      height: "20px",
    },
  },
});

export const actionButtonLabel = style({
  "@media": {
    "(max-width: 640px)": {
      display: "none",
    },
  },
});
