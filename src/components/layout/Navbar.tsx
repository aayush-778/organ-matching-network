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
      <header className="hidden md:flex fixed top-0 inset-x-0 h-14 z-40 items-center justify-between px-6 bg-white/90 backdrop-blur border-b border-line">
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold text-ink">
          OrganMatch Network
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-pill text-sm font-medium transition-colors ${
                  active ? "bg-primary-light text-primary-dark" : "text-muted hover:text-ink hover:bg-surface"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 text-xs font-mono text-safe">
          <Activity size={14} className="animate-pulse" />
          System live
        </div>
      </header>

      <header className="md:hidden fixed top-0 inset-x-0 h-14 z-40 safe-top flex items-center justify-between px-4 bg-white/90 backdrop-blur border-b border-line">
        <span className="flex items-center gap-2 font-heading font-semibold text-ink text-sm">
          <span className="w-2 h-2 rounded-full bg-primary" aria-hidden />
          OrganMatch
        </span>
        <span className="flex items-center gap-1 text-[11px] font-mono text-safe">
          <Activity size={12} className="animate-pulse" />
          Live
        </span>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom bg-white border-t border-line flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} className={active ? "text-primary" : "text-muted"} />
              <span className={active ? "text-primary" : "text-muted"}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}