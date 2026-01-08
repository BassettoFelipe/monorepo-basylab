"use client";

import { useEffect } from "react";
import {
  type Transition,
  motion,
  useAnimation,
  useMotionValue,
} from "framer-motion";
import "./CircularText.css";

type HoverEffect = "speedUp" | "slowDown" | "pause" | "goBonkers" | null;

interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: HoverEffect;
  className?: string;
}

const getRotationTransition = (
  duration: number,
  from: number,
  loop = true,
) => ({
  from,
  to: from + 360,
  ease: "linear" as const,
  duration,
  type: "tween" as const,
  repeat: loop ? Number.POSITIVE_INFINITY : 0,
});

const getTransition = (duration: number, from: number): Transition => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: "spring",
    damping: 20,
    stiffness: 300,
  },
});

const getPauseTransition = (): Transition => ({
  rotate: { type: "spring", damping: 20, stiffness: 300 },
  scale: { type: "spring", damping: 20, stiffness: 300 },
});

export default function CircularText({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
}: CircularTextProps) {
  const letters = Array.from(text);
  const controls = useAnimation();
  const rotation = useMotionValue(0);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
  }, [spinDuration, controls, rotation]);

  const handleHoverStart = () => {
    const start = rotation.get();
    if (!onHover) return;

    let transitionConfig: Transition = getTransition(spinDuration, start);
    let scaleVal = 1;

    switch (onHover) {
      case "slowDown":
        transitionConfig = getTransition(spinDuration * 2, start);
        break;
      case "speedUp":
        transitionConfig = getTransition(spinDuration / 4, start);
        break;
      case "pause":
        transitionConfig = getPauseTransition();
        scaleVal = 1;
        break;
      case "goBonkers":
        transitionConfig = getTransition(spinDuration / 20, start);
        scaleVal = 0.8;
        break;
    }

    controls.start({
      rotate: start + 360,
      scale: scaleVal,
      transition: transitionConfig,
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
  };

  return (
    <motion.div
      className={`circular-text ${className}`}
      style={{ rotate: rotation }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {letters.map((letter, i) => {
        const rotationDeg = (360 / letters.length) * i;
        const factor = Math.PI / letters.length;
        const x = factor * i;
        const y = factor * i;
        const transform = `rotateZ(${rotationDeg}deg) translate3d(${x}px, ${y}px, 0)`;

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: letters array is derived from static text prop, index provides stable identity for each character position
          <span key={i} style={{ transform, WebkitTransform: transform }}>
            {letter}
          </span>
        );
      })}
    </motion.div>
  );
}
