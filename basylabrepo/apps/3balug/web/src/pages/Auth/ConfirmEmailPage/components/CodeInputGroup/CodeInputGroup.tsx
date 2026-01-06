import { type ClipboardEvent, type KeyboardEvent, useEffect, useMemo } from "react";
import * as styles from "./CodeInputGroup.css";

interface CodeInputGroupProps {
  length: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CodeInputGroup({
  length,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: CodeInputGroupProps) {
  const pinInputIds = useMemo(() => Array.from({ length }, (_, i) => `code-input-${i}`), [length]);

  useEffect(() => {
    if (!autoFocus) return;

    const firstInput = document.getElementById(pinInputIds[0]) as HTMLInputElement | null;
    firstInput?.focus();
  }, [autoFocus, pinInputIds]);

  const handleChange = (index: number, newValue: string) => {
    if (newValue && !/^\d$/.test(newValue)) return;

    const newCode = [...value];
    newCode[index] = newValue;
    onChange(newCode);

    if (newValue && index < length - 1) {
      const nextInput = document.getElementById(pinInputIds[index + 1]) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      const prevInput = document.getElementById(pinInputIds[index - 1]) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length);
    const newCode = pastedData.split("").filter((char) => /^\d$/.test(char));

    if (newCode.length > 0) {
      const updatedCode = [...value];
      newCode.forEach((digit, i) => {
        if (i < length) updatedCode[i] = digit;
      });

      onChange(updatedCode);

      const nextEmptyIndex = updatedCode.findIndex((c) => !c);
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      const input = document.getElementById(pinInputIds[focusIndex]) as HTMLInputElement;
      if (input) input.focus();
    }
  };

  return (
    <fieldset className={styles.codeInputContainer} aria-label="Código de verificação de email">
      {value.map((digit, index) => (
        <input
          key={pinInputIds[index]}
          id={pinInputIds[index]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={styles.codeInput}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} de ${length}`}
          aria-required="true"
          autoComplete="off"
          pattern="[0-9]"
        />
      ))}
    </fieldset>
  );
}
