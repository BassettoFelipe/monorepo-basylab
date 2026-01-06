import { forwardRef, type TextareaHTMLAttributes } from "react";
import * as styles from "./Textarea.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = "",
      id,
      showCharCount = false,
      maxLength,
      value,
      ...props
    },
    ref,
  ) => {
    const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s/g, "-")}`;

    const wrapperClasses = [styles.textareaWrapper, fullWidth && styles.fullWidth]
      .filter(Boolean)
      .join(" ");

    const textareaClasses = [styles.textarea, error && styles.textareaError, className]
      .filter(Boolean)
      .join(" ");

    const currentLength = typeof value === "string" ? value.length : 0;
    const isNearLimit = maxLength && currentLength >= maxLength * 0.9;
    const isAtLimit = maxLength && currentLength >= maxLength;

    const charCountClasses = [
      styles.charCount,
      isAtLimit && styles.charCountError,
      isNearLimit && !isAtLimit && styles.charCountWarning,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          aria-invalid={!!error}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        {showCharCount && maxLength && (
          <span className={charCountClasses}>
            {currentLength}/{maxLength}
          </span>
        )}
        {error && (
          <span className={styles.errorMessage} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
