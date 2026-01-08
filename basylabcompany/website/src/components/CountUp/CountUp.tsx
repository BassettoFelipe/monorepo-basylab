"use client";

import { useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useMemo } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

function getDecimalPlaces(num: number): number {
  const str = num.toString();
  if (str.includes(".")) {
    const decimals = str.split(".")[1];
    if (Number.parseInt(decimals, 10) !== 0) {
      return decimals.length;
    }
  }
  return 0;
}

export const CountUp = ({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const initialValue = direction === "down" ? to : from;
  const motionValue = useMotionValue(initialValue);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const isInView = useInView(ref, { once: true, margin: "0px" });

  // Memoize formatter config - only recalculate when from/to/separator change
  const formatConfig = useMemo(() => {
    const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));
    const hasDecimals = maxDecimals > 0;

    const options: Intl.NumberFormatOptions = {
      useGrouping: !!separator,
      minimumFractionDigits: hasDecimals ? maxDecimals : 0,
      maximumFractionDigits: hasDecimals ? maxDecimals : 0,
    };

    const formatter = new Intl.NumberFormat("en-US", options);
    return { formatter, separator };
  }, [from, to, separator]);

  // Use refs for callbacks to avoid recreating effects
  const callbacksRef = useRef({ onStart, onEnd });
  callbacksRef.current = { onStart, onEnd };

  // Set initial value
  useEffect(() => {
    if (ref.current) {
      const formatted = formatConfig.formatter.format(initialValue);
      ref.current.textContent = formatConfig.separator
        ? formatted.replace(/,/g, formatConfig.separator)
        : formatted;
    }
  }, [initialValue, formatConfig]);

  // Animation trigger effect
  useEffect(() => {
    if (!isInView || !startWhen) return;

    callbacksRef.current.onStart?.();

    const targetValue = direction === "down" ? from : to;
    const timeoutId = setTimeout(() => {
      motionValue.set(targetValue);
    }, delay * 1000);

    const durationTimeoutId = setTimeout(
      () => {
        callbacksRef.current.onEnd?.();
      },
      delay * 1000 + duration * 1000,
    );

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(durationTimeoutId);
    };
  }, [isInView, startWhen, direction, from, to, delay, duration, motionValue]);

  // Subscribe to spring value changes
  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        const formatted = formatConfig.formatter.format(latest);
        ref.current.textContent = formatConfig.separator
          ? formatted.replace(/,/g, formatConfig.separator)
          : formatted;
      }
    });

    return () => unsubscribe();
  }, [springValue, formatConfig]);

  return <span className={className} ref={ref} />;
};
