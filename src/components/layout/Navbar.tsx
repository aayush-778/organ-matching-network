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
      {/* 1. DESKTOP & TABLET NAVIGATION (Hidden on mobile) */}
      <header className="hidden md:flex fixed top-0 inset-x-0 h-16 z-40 items-center px-6 bg-white/95 backdrop-blur-md border-b border-line transition-all">
        
        {/* Left Column: Logo (flex-1 forces it to take exactly 1/3 of available free space) */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-2.5 group hover:opacity-80 transition-opacity">
            <div className="bg-primary-light p-1.5 rounded-lg text-primary transition-colors">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-ink text-lg tracking-tight whitespace-nowrap">
              Organ-Match Network
            </span>
          </Link>
        </div>

        {/* Center Column: Navigation (shrink-0 ensures links don't get squished on smaller tablets) */}
        <nav className="flex items-center justify-center gap-1 shrink-0">
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

        {/* Right Column: Invisible balancer (Matches the flex-1 of the logo to keep Nav dead center) */}
        <div className="flex-1"></div>
        
      </header>


      {/* 2. MOBILE TOP HEADER (Hidden on desktop) */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 z-40 safe-top flex items-center px-4 bg-white/95 backdrop-blur-md border-b border-line">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary-light p-1 rounded-md text-primary">
            <Activity size={16} strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-ink text-base tracking-tight">
            Organ-Match
          </span>
        </Link>
      </header>


      {/* 3. MOBILE BOTTOM NAVIGATION (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom bg-white border-t border-line flex pb-safe">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold transition-colors active:scale-95"
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