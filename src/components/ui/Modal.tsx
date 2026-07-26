"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <button
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full md:max-w-md bg-white rounded-t-card md:rounded-card shadow-card border border-line max-h-[85vh] overflow-y-auto safe-bottom z-10"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white z-10">
          <h2 className="font-heading font-semibold text-base">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}