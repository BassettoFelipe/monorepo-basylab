import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const filtersContainer = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: vars.spacing.md,
  marginBottom: vars.spacing.lg,
  flexWrap: "wrap",
});

export const filters = style({
  display: "flex",
  gap: vars.spacing.md,
  flexWrap: "wrap",
  flex: 1,
});

export const filterGroup = style({
  display: "flex",
  gap: vars.spacing.sm,
  alignItems: "center",
});

export const tableWrapper = style({
  width: "100%",
  overflowX: "auto",
  borderRadius: vars.borderRadius.lg,
  boxShadow: vars.shadow.sm,
  backgroundColor: vars.color.bg.primary,
});

export const table = style({
  width: "100%",
  minWidth: "700px",
  backgroundColor: vars.color.bg.primary,
  borderCollapse: "collapse",
});

export const tableHeader = style({
  backgroundColor: vars.color.bg.secondary,
  borderBottom: `2px solid ${vars.color.border.primary}`,
});

export const tableHeaderCell = style({
  padding: vars.spacing.md,
  textAlign: "left",
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

export const tableRow = style({
  borderBottom: `1px solid ${vars.color.border.primary}`,
});

export const tableCell = style({
  padding: vars.spacing.md,
  fontSize: vars.fontSize.base,
  color: vars.color.text.primary,
});

export const userInfo = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const userName = style({
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
});

export const userEmail = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.secondary,
});

export const badge = style({
  display: "inline-flex",
  alignItems: "center",
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: vars.borderRadius.full,
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.medium,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

export const badgeActive = style({
  backgroundColor: vars.color.success.light,
  color: vars.color.success.dark,
});

export const badgeInactive = style({
  backgroundColor: vars.color.error.light,
  color: vars.color.error.dark,
});

export const roleOwner = style({
  backgroundColor: "#FEF3C7",
  color: "#92400E",
});

export const roleBroker = style({
  backgroundColor: "#DBEAFE",
  color: "#1E40AF",
});

export const roleManager = style({
  backgroundColor: "#E0E7FF",
  color: "#4338CA",
});

export const roleAnalyst = style({
  backgroundColor: "#F3E8FF",
  color: "#6B21A8",
});

export const actions = style({
  display: "flex",
  gap: vars.spacing.sm,
  alignItems: "center",
  justifyContent: "center",
});

export const switchWrapper = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: `6px ${vars.spacing.sm}`,
  borderRadius: vars.borderRadius.md,
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  border: "1px solid transparent",
});

export const switchLabel = style({
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.bold,
  minWidth: "52px",
  textAlign: "center",
  padding: `4px ${vars.spacing.sm}`,
  borderRadius: vars.borderRadius.sm,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  transition: `all ${vars.transitionDuration.base}`,
  selectors: {
    "&[data-active='true']": {
      color: "#047857",
      backgroundColor: "#D1FAE5",
    },
    "&[data-active='false']": {
      color: "#DC2626",
      backgroundColor: "#FEE2E2",
    },
  },
});

export const iconButton = style({
  border: "1px solid rgba(0, 0, 0, 0.08)",
  padding: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.borderRadius.lg,
  transition: `all ${vars.transitionDuration.base}`,
  position: "relative",
  backgroundColor: "#F9FAFB",
  color: "#6B7280",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  ":hover": {
    borderColor: "#D1D5DB",
    color: "#374151",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
  },
  ":active": {
    transform: "translateY(0)",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

export const iconButtonDanger = style({
  backgroundColor: "#FEF2F2",
  color: "#EF4444",
  borderColor: "#FEE2E2",
  ":hover": {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    color: "#DC2626",
    boxShadow: "0 4px 6px rgba(239, 68, 68, 0.15)",
  },
});

export const iconButtonSuccess = style({
  backgroundColor: "#D1FAE5",
  color: "#059669",
  ":hover": {
    backgroundColor: "#A7F3D0",
    borderColor: "#6EE7B7",
    color: "#047857",
  },
});

export const pagination = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: vars.spacing.lg,
  padding: vars.spacing.md,
  backgroundColor: vars.color.bg.primary,
  borderRadius: vars.borderRadius.lg,
  boxShadow: vars.shadow.sm,
});

export const paginationInfo = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.secondary,
});

export const paginationButtons = style({
  display: "flex",
  gap: vars.spacing.sm,
});

export const emptyState = style({
  padding: vars.spacing.xl,
  textAlign: "center",
});

export const pageTitle = style({
  fontSize: "28px",
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  margin: 0,
  marginBottom: vars.spacing.xs,
});

export const pageDescription = style({
  fontSize: vars.fontSize.base,
  color: vars.color.text.secondary,
  margin: 0,
  marginBottom: vars.spacing.xl,
});

export const tabCards = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: vars.spacing.lg,
  marginBottom: vars.spacing.xl,
});

export const tabCard = style({
  backgroundColor: vars.color.bg.primary,
  border: `2px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.lg,
  padding: vars.spacing.lg,
  cursor: "pointer",
  transition: `all ${vars.transitionDuration.base}`,
  position: "relative",
  overflow: "hidden",

  ":hover": {
    borderColor: vars.color.primary.main,
    boxShadow: vars.shadow.md,
  },
});

export const tabCardActive = style({
  borderColor: vars.color.primary.main,
  boxShadow: `0 0 0 1px ${vars.color.primary.main}`,

  ":hover": {
    borderColor: vars.color.primary.main,
  },
});

export const tabCardHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: vars.spacing.md,
});

export const tabCardIcon = style({
  width: "48px",
  height: "48px",
  borderRadius: vars.borderRadius.lg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: vars.color.bg.secondary,
  color: vars.color.text.secondary,
  transition: `all ${vars.transitionDuration.base}`,
});

export const tabCardIconActive = style({
  backgroundColor: vars.color.primary.main,
  color: vars.color.primary.dark,
});

export const tabCardBadge = style({
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.bold,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderRadius: vars.borderRadius.full,
  backgroundColor: vars.color.bg.secondary,
  color: vars.color.text.secondary,
});

export const tabCardBadgeActive = style({
  backgroundColor: vars.color.primary.main,
  color: vars.color.primary.dark,
});

export const tabCardTitle = style({
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  margin: 0,
  marginBottom: vars.spacing.xs,
});

export const tabCardDescription = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.secondary,
  margin: 0,
  lineHeight: "1.5",
});

export const tabCardIndicator = style({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: "3px",
  backgroundColor: "transparent",
  transition: `all ${vars.transitionDuration.base}`,
});

export const tabCardIndicatorActive = style({
  backgroundColor: vars.color.primary.main,
});

export const tabs = style({
  display: "flex",
  gap: vars.spacing.xs,
  marginBottom: vars.spacing.lg,
  borderBottom: `2px solid ${vars.color.border.primary}`,
});

export const tab = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: `${vars.spacing.md} ${vars.spacing.lg}`,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.secondary,
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "2px solid transparent",
  marginBottom: "-2px",
  cursor: "pointer",
  transition: `all ${vars.transitionDuration.base}`,

  ":hover": {
    color: vars.color.text.primary,
    backgroundColor: vars.color.bg.secondary,
  },
});

export const tabActive = style({
  color: vars.color.primary.dark,
  borderBottomColor: vars.color.primary.main,

  ":hover": {
    color: vars.color.primary.dark,
    backgroundColor: "transparent",
  },
});

export const contentCard = style({
  backgroundColor: vars.color.bg.primary,
  borderRadius: vars.borderRadius.lg,
  border: `1px solid ${vars.color.border.primary}`,
  padding: vars.spacing.lg,
  boxShadow: vars.shadow.sm,
});

// Tabs Compactas
export const tabsCompact = style({
  display: "flex",
  gap: vars.spacing.xs,
  marginBottom: vars.spacing.xl,
  backgroundColor: vars.color.bg.secondary,
  padding: vars.spacing.xs,
  borderRadius: vars.borderRadius.lg,
  width: "fit-content",
});

export const tabCompact = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: `${vars.spacing.sm} ${vars.spacing.lg}`,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.secondary,
  backgroundColor: "transparent",
  border: "none",
  borderRadius: vars.borderRadius.md,
  cursor: "pointer",
  transition: `color ${vars.transitionDuration.base}, background-color ${vars.transitionDuration.base}, box-shadow ${vars.transitionDuration.base}`,

  ":hover": {
    color: vars.color.text.primary,
  },
});

export const tabCompactActive = style({
  color: vars.color.text.primary,
  backgroundColor: vars.color.bg.primary,
  boxShadow: vars.shadow.sm,

  ":hover": {
    color: vars.color.text.primary,
  },
});

export const tabCompactLabel = style({
  "@media": {
    "(max-width: 480px)": {
      display: "none",
    },
  },
});

export const tabCompactBadge = style({
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.bold,
  padding: "2px 8px",
  borderRadius: vars.borderRadius.full,
  backgroundColor: "rgba(0, 0, 0, 0.08)",
  color: vars.color.text.secondary,
});

export const tabCompactBadgeActive = style({
  backgroundColor: vars.color.primary.main,
  color: vars.color.primary.dark,
});

export const badgeRequired = style({
  backgroundColor: "#D1FAE5",
  color: "#047857",
});

export const badgeOptional = style({
  backgroundColor: "#FEE2E2",
  color: "#DC2626",
});

// Section Header Styles
export const sectionHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: vars.spacing.lg,
  gap: vars.spacing.md,
  flexWrap: "wrap",
});

export const sectionTitle = style({
  fontSize: "24px",
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  margin: 0,
  marginBottom: vars.spacing.xs,
});

export const sectionDescription = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.secondary,
  margin: 0,
});

export const sectionTitleWrapper = style({
  flex: 1,
});

export const filtersCard = style({
  backgroundColor: vars.color.bg.primary,
  border: `1px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.lg,
  padding: vars.spacing.lg,
  marginBottom: vars.spacing.lg,
  boxShadow: vars.shadow.sm,
});

export const filterRow = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: vars.spacing.md,
});

export const filterItem = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
});

export const filterLabel = style({
  fontSize: vars.fontSize.xs,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

export const badgePending = style({
  backgroundColor: "#FEF3C7",
  color: "#92400E",
});

export const badgeFilled = style({
  backgroundColor: "#D1FAE5",
  color: "#047857",
});

export const statusContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});
