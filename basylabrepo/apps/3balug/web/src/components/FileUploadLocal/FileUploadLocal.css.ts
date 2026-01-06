import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const container = style({
  width: "100%",
});

export const dropZone = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.spacing.sm,
  padding: vars.spacing.xl,
  border: `2px dashed ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.md,
  backgroundColor: vars.color.bg.primary,
  color: vars.color.text.secondary,
  cursor: "pointer",
  transition: `all ${vars.transitionDuration.base}`,

  ":hover": {
    borderColor: vars.color.primary.dark,
    backgroundColor: "#fafff0",
  },
});

export const dropZoneDragging = style({
  borderColor: vars.color.primary.dark,
  backgroundColor: "#fafff0",
  transform: "scale(1.01)",
});

export const dropZoneDisabled = style({
  opacity: 0.6,
  cursor: "not-allowed",

  ":hover": {
    borderColor: vars.color.border.primary,
    backgroundColor: vars.color.bg.primary,
  },
});

export const dropZoneError = style({
  borderColor: vars.color.error.main,
});

export const icon = style({
  color: vars.color.text.secondary,
});

export const dropText = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  textAlign: "center",
});

export const dropHint = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.text.secondary,
  textAlign: "center",
});

export const dropTypes = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.text.tertiary,
  textAlign: "center",
  marginTop: vars.spacing.xs,
});

export const hiddenInput = style({
  display: "none",
});

export const fileList = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.spacing.md,
  marginTop: vars.spacing.sm,
  padding: vars.spacing.xs,
});

export const fileItem = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: vars.spacing.sm,
  backgroundColor: vars.color.bg.secondary,
  borderRadius: vars.borderRadius.md,
  border: `1px solid ${vars.color.border.primary}`,
});

export const fileIcon = style({
  flexShrink: 0,
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: vars.color.bg.tertiary,
  borderRadius: vars.borderRadius.sm,
  color: vars.color.text.secondary,
  overflow: "hidden",
});

export const filePreviewImage = style({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export const fileInfo = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
  paddingRight: vars.spacing.md,
});

export const fileName = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "180px",
});

export const fileSize = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.text.tertiary,
});

export const fileActions = style({
  display: "flex",
  alignItems: "center",
  marginLeft: vars.spacing.xs,
});

export const pendingBadge = style({
  display: "none",
});

export const removeButton = style({
  position: "absolute",
  top: "-8px",
  right: "-8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  padding: 0,
  border: `2px solid ${vars.color.bg.primary}`,
  borderRadius: vars.borderRadius.full,
  backgroundColor: vars.color.text.primary,
  color: vars.color.bg.primary,
  cursor: "pointer",
  transition: `all ${vars.transitionDuration.base}`,

  ":hover": {
    backgroundColor: vars.color.error.main,
    color: vars.color.neutral.white,
  },

  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

export const errorMessage = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.error.main,
  marginTop: vars.spacing.xs,
});

export const label = style({
  display: "block",
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  marginBottom: vars.spacing.sm,
});

export const required = style({
  color: vars.color.error.main,
  marginLeft: vars.spacing.xs,
});
