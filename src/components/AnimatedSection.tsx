"use client";

import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animationType?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale";
}

export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  animationType = "fade-up",
}: AnimatedSectionProps) {
  const { elementRef, isVisible } = useScrollAnimation({ delay });

  const animationClass = {
    "fade-up": "animate-fade-in-up",
    "fade-down": "animate-fade-in-down",
    "fade-left": "animate-fade-in-left",
    "fade-right": "animate-fade-in-right",
    scale: "animate-scale-in",
  }[animationType];

  return (
    <div
      ref={elementRef}
      className={`scroll-animate ${isVisible ? `visible ${animationClass}` : ""} ${className}`}
    >
      {children}
    </div>
  );
}
