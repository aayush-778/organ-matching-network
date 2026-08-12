import Link from "next/link";
import { Activity, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-11 md:pt-12 pb-7">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-10 gap-x-4 md:gap-8 lg:gap-12 text-center md:text-left">
          
          {/* Brand & Description (Spans 2 cols on mobile, 6 on desktop) */}
          <div className="col-span-2 md:col-span-6 flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary-light p-1.5 rounded-lg text-primary">
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <span className="font-heading font-bold text-ink text-lg tracking-tight">
                Organ-Match Network
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed font-sans max-w-sm">
              A high-performance algorithmic pipeline for real-time organ donor matching and critical medical logistics.
            </p>
          </div>

          {/* Quick Links (Spans 1 col on mobile, 3 on desktop) */}
          <div className="col-span-1 md:col-span-3 flex flex-col items-center md:items-start">
            <h4 className="font-heading font-semibold text-ink mb-2">Platform</h4>
            <ul className="space-y-2 text-sm text-muted font-sans font-medium flex flex-col items-center md:items-start">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Command Center
                </Link>
              </li>
              <li>
                <Link href="/recipients" className="hover:text-primary transition-colors">
                  Registry
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-primary transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* System Status (Spans 1 col on mobile, 3 on desktop) */}
          <div className="col-span-1 md:col-span-3 flex flex-col items-center md:items-start">
            <h4 className="font-heading font-semibold text-ink mb-2">System Status</h4>
            <ul className="space-y-2 text-sm text-muted font-sans font-medium flex flex-col items-center md:items-start">
              <li className="flex items-center gap-2 text-left">
                <span className="h-2 w-2 rounded-full bg-safe shrink-0"></span>
                <span>C++ Engine Operational</span>
              </li>
              <li className="flex items-center gap-2 text-left">
                <span className="h-2 w-2 rounded-full bg-safe shrink-0"></span>
                <span>Database Connected</span>
              </li>
              <li className="pt-1 text-[11px] font-mono text-muted/70">
                v1.0.0-stable
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-line flex flex-col items-center justify-between gap-4 text-center">
          <p className="text-sm text-muted font-sans flex items-center gap-1.5 font-medium">
            Made with <Heart size={14} className="text-urgent fill-urgent animate-pulse" /> by Aayush
          </p>
        </div>
        
      </div>
    </footer>
  );
}