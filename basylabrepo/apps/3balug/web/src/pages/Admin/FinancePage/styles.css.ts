import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const pageLayout = style({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: "#FAFAF9",
});

export const pageMain = style({
  marginLeft: "72px",
  flex: 1,
  minHeight: "100vh",

  "@media": {
    "(max-width: 1024px)": {
      marginLeft: 0,
      paddingTop: "64px",
    },
  },
});

export const pageContent = style({
  padding: vars.spacing["2xl"],
  maxWidth: "1600px",
  margin: "0 auto",

  "@media": {
    "(max-width: 768px)": {
      padding: vars.spacing.lg,
    },
    "(max-width: 640px)": {
      padding: vars.spacing.md,
    },
  },
});

export const statsGrid = style({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: vars.spacing.lg,
  marginBottom: vars.spacing["2xl"],

  "@media": {
    "(min-width: 640px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "(min-width: 1024px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "(min-width: 1400px)": {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  },
});
