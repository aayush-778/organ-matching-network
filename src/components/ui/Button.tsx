"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark disabled:bg-primary/40",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-alt disabled:opacity-50",
  danger: "bg-urgent text-white hover:bg-urgent/90 disabled:bg-urgent/40",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-surface disabled:opacity-50",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`font-heading font-medium rounded-card transition-colors cursor-pointer disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}