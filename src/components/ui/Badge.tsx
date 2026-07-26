import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "primary" | "safe" | "urgent" | "neutral";
}

const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  primary: "bg-primary-light text-primary-dark",
  safe: "bg-safe-light text-safe",
  urgent: "bg-urgent-light text-urgent",
  neutral: "bg-surface text-muted",
};

export default function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}