import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const layoutContainer = style({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: "#FAFAF9",
});

export const mainContent = style({
  flex: 1,
  minWidth: 0,
  minHeight: "100vh",
  overflowX: "hidden",
  paddingTop: "120px",

  "@media": {
    "(max-width: 1024px)": {
      paddingTop: "108px",
    },
    "(max-width: 768px)": {
      paddingTop: "104px",
    },
  },
});

export const mainContentWithSidebar = style({
  marginLeft: "72px",

  "@media": {
    "(max-width: 1024px)": {
      marginLeft: 0,
    },
  },
});

export const contentWrapper = style({
  padding: vars.spacing["2xl"],
  maxWidth: "1600px",
  margin: "0 auto",
  minWidth: 0,

  "@media": {
    "(max-width: 768px)": {
      padding: vars.spacing.lg,
    },
    "(max-width: 640px)": {
      padding: vars.spacing.md,
    },
    "(max-width: 400px)": {
      padding: vars.spacing.sm,
    },
  },
});
