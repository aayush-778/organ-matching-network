"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, BarChart3, HeartPulse } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: HeartPulse },
  { href: "/recipients", label: "Registry", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:flex fixed top-0 inset-x-0 h-16 z-40 items-center justify-between px-6 bg-white/95 backdrop-blur-md border-b border-line transition-all">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-primary-light p-1.5 rounded-lg text-primary transition-colors">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-ink text-lg tracking-tight">
            Organ-Match Network
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-pill text-sm font-semibold transition-colors ${
                  active 
                    ? "bg-primary-light text-primary-dark" 
                    : "text-muted hover:text-ink hover:bg-surface"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 text-xs font-mono text-safe font-medium">
          <span className="h-2 w-2 rounded-full bg-safe"></span>
          System Live
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 z-40 safe-top flex items-center justify-between px-4 bg-white/95 backdrop-blur-md border-b border-line">
        <span className="flex items-center gap-2">
          <div className="bg-primary-light p-1 rounded-md text-primary">
            <Activity size={16} strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-ink text-base tracking-tight">
            Organ-Match
          </span>
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-safe">
          <span className="h-1.5 w-1.5 rounded-full bg-safe"></span>
          Live
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom bg-white border-t border-line flex pb-safe">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold transition-colors"
            >
              <Icon 
                size={20} 
                strokeWidth={2} 
                className={active ? "text-primary" : "text-muted"} 
              />
              <span className={active ? "text-primary-dark" : "text-muted"}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}