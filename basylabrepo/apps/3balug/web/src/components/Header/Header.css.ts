import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const slideDown = keyframes({
  from: { opacity: 0, transform: "translateY(-10px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

export const header = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  width: "100%",
  height: "64px",
  backgroundColor: "#fff",
  borderBottom: `1px solid ${vars.color.border.primary}`,
  zIndex: 100,
  display: "flex",
  alignItems: "center",

  "@media": {
    "(max-width: 1024px)": {
      height: "56px",
    },
  },
});

export const container = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.lg,
  width: "100%",
  maxWidth: "100%",
  padding: `0 ${vars.spacing.xl}`,
  justifyContent: "space-between",

  "@media": {
    "(max-width: 1024px)": {
      gap: vars.spacing.md,
      padding: `0 ${vars.spacing.lg}`,
    },
    "(max-width: 768px)": {
      padding: `0 ${vars.spacing.md}`,
      gap: vars.spacing.sm,
    },
  },
});

export const hamburgerButton = style({
  display: "none",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  border: "none",
  backgroundColor: "transparent",
  color: vars.color.text.primary,
  cursor: "pointer",
  borderRadius: vars.borderRadius.lg,
  transition: "all 0.2s ease",
  flexShrink: 0,

  ":hover": {
    backgroundColor: vars.color.bg.secondary,
  },

  ":focus-visible": {
    outline: "none",
  },

  "@media": {
    "(max-width: 1024px)": {
      display: "flex",
    },
  },
});

export const hamburgerHiddenOnDesktop = style({
  "@media": {
    "(min-width: 1025px)": {
      display: "none",
    },
  },
});

export const logoWrapper = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,

  "@media": {
    "(max-width: 1024px)": {
      display: "flex",
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
    },
  },
});

export const searchWrapper = style({
  position: "relative",
  flex: 1,
  maxWidth: "600px",
  transition: "all 0.3s ease",

  "@media": {
    "(max-width: 1024px)": {
      display: "none",
    },
  },
});

export const searchExpanded = style({});

export const searchInputWrapper = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
});

export const searchIcon = style({
  position: "absolute",
  left: vars.spacing.md,
  color: vars.color.text.tertiary,
  pointerEvents: "none",
  zIndex: 1,
});

export const searchInput = style({
  width: "100%",
  height: "40px",
  padding: `0 ${vars.spacing.md} 0 44px`,
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  backgroundColor: vars.color.bg.secondary,
  border: `1px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.lg,
  outline: "none",
  transition: "all 0.2s ease",

  "::placeholder": {
    color: vars.color.text.tertiary,
  },

  ":focus": {
    backgroundColor: "#fff",
    borderColor: vars.color.border.primary,
  },
});

export const searchCloseButton = style({
  position: "absolute",
  right: vars.spacing.sm,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  border: "none",
  backgroundColor: "transparent",
  color: vars.color.text.tertiary,
  cursor: "pointer",
  borderRadius: vars.borderRadius.md,
  transition: "all 0.2s ease",

  ":hover": {
    backgroundColor: vars.color.bg.secondary,
    color: vars.color.text.primary,
  },
});

export const searchIconButton = style({
  display: "none",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  border: "none",
  backgroundColor: vars.color.bg.secondary,
  color: vars.color.text.primary,
  cursor: "pointer",
  borderRadius: vars.borderRadius.lg,
  transition: "all 0.2s ease",
  flexShrink: 0,

  ":hover": {
    backgroundColor: "#E7E5E4",
  },

  ":active": {
    backgroundColor: "#D6D3D1",
  },

  "@media": {
    "(max-width: 1024px)": {
      display: "flex",
    },
  },
});

export const searchResults = style({
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  backgroundColor: "#fff",
  border: `1px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.lg,
  boxShadow: vars.shadow.lg,
  maxHeight: "300px",
  overflowY: "auto",
  zIndex: 1000,
  animation: `${slideDown} 0.2s ease`,
});

export const searchResultItem = style({
  width: "100%",
  padding: `${vars.spacing.md} ${vars.spacing.lg}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  backgroundColor: "transparent",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  transition: "background-color 0.15s ease",

  ":hover": {
    backgroundColor: vars.color.bg.secondary,
  },

  ":active": {
    backgroundColor: vars.color.bg.tertiary,
  },
});

export const noResults = style({
  padding: `${vars.spacing.md} ${vars.spacing.lg}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.text.tertiary,
  textAlign: "center",
});

export const mobileSearchOverlay = style({
  display: "none",

  "@media": {
    "(max-width: 1024px)": {
      display: "block",
      position: "fixed",
      top: "56px",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      animation: `${fadeIn} 0.2s ease`,
    },
  },
});

export const mobileSearchContainer = style({
  backgroundColor: "#fff",
  padding: vars.spacing.md,
  animation: `${slideDown} 0.3s ease`,
});

export const mobileSearchHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: vars.spacing.sm,
  backgroundColor: vars.color.bg.secondary,
  borderRadius: vars.borderRadius.lg,
  border: `1px solid ${vars.color.border.primary}`,
  outline: "none",

  ":focus-within": {
    borderColor: vars.color.border.primary,
    outline: "none",
  },
});

export const mobileSearchInput = style({
  flex: 1,
  border: "none",
  backgroundColor: "transparent",
  outline: "none",
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  boxShadow: "none",

  "::placeholder": {
    color: vars.color.text.tertiary,
  },

  ":focus": {
    outline: "none",
    border: "none",
    boxShadow: "none",
  },
});

export const mobileSearchClose = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: "none",
  backgroundColor: "transparent",
  color: vars.color.text.tertiary,
  cursor: "pointer",
  borderRadius: vars.borderRadius.md,
  flexShrink: 0,

  ":active": {
    backgroundColor: vars.color.bg.tertiary,
  },
});

export const mobileSearchResults = style({
  marginTop: vars.spacing.sm,
  backgroundColor: "#fff",
  borderRadius: vars.borderRadius.lg,
  maxHeight: "calc(100vh - 200px)",
  overflowY: "auto",
});

export const mobileSearchResultItem = style({
  width: "100%",
  padding: `${vars.spacing.md} ${vars.spacing.lg}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  backgroundColor: "transparent",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  borderRadius: vars.borderRadius.md,
  transition: "background-color 0.15s ease",

  ":active": {
    backgroundColor: vars.color.bg.secondary,
  },
});

export const profileWrapper = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  flexShrink: 0,

  "@media": {
    "(max-width: 1024px)": {
      display: "none",
    },
  },
});

export const profileButton = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: `${vars.spacing.xs} ${vars.spacing.md}`,
  backgroundColor: vars.color.bg.secondary,
  border: `1px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.xl,
  cursor: "pointer",
  transition: "all 0.15s ease",

  ":hover": {
    backgroundColor: "#E7E5E4",
    borderColor: "#D6D3D1",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
});

export const avatar = style({
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #C7E356 0%, #9FB601 100%)",
  color: "#3F480A",
  borderRadius: "50%",
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.bold,
  flexShrink: 0,
  boxShadow: "0 2px 6px rgba(159, 182, 1, 0.3)",
});

export const userInfo = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "2px",
  minWidth: 0,
});

export const userName = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  fontWeight: vars.fontWeight.medium,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
  maxWidth: "120px",
});

export const userPlan = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.text.tertiary,
  fontWeight: vars.fontWeight.medium,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
});

export const dropdownMenu = style({
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  minWidth: "200px",
  backgroundColor: "#fff",
  border: `1px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.xl,
  boxShadow: vars.shadow.lg,
  padding: vars.spacing.sm,
  zIndex: 1000,
  animation: `${slideDown} 0.2s ease`,
});

export const dropdownItem = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.md,
  padding: `12px ${vars.spacing.md}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.text.primary,
  backgroundColor: "transparent",
  border: "none",
  borderRadius: vars.borderRadius.lg,
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
  transition: "all 0.15s ease",
  fontWeight: vars.fontWeight.medium,

  ":hover": {
    backgroundColor: vars.color.bg.secondary,
  },

  ":active": {
    backgroundColor: vars.color.bg.tertiary,
  },

  ":focus-visible": {
    outline: "none",
  },
});

export const dropdownItemDanger = style({
  color: "#DC2626",

  ":hover": {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
  },
});

export const dropdownDivider = style({
  height: "1px",
  backgroundColor: vars.color.border.primary,
  margin: `${vars.spacing.xs} 0`,
});
