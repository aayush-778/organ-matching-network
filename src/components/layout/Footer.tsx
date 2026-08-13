import Link from "next/link";
import { Activity, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto overflow-hidden">
      
      <div className="w-full flex select-none pt-10 pb-12" aria-hidden="true">
        <div className="flex whitespace-nowrap animate-marquee items-center">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="mx-8 md:mx-16 text-4xl md:text-6xl lg:text-7xl font-heading font-black text-primary opacity-[0.06] uppercase tracking-[0.15em]">
              Hope. Heal. Live.
            </span>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 50s linear infinite;
            width: max-content;
          }
        `}} />
      </div>

      <div className="bg-white border-t border-line">
        <div className="max-w-5xl mx-auto px-6 md:px-8 pt-16 pb-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-8">
            
            {/* Brand & Description */}
            <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary shadow-sm">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <span className="font-heading font-bold text-ink text-xl tracking-tight">
                  Organ-Match Network
                </span>
              </div>
              <p className="text-sm text-muted leading-relaxed font-sans max-w-xs">
                A high-performance algorithmic pipeline for real-time organ donor matching and critical medical logistics.
              </p>
            </div>

            {/* Platform Links */}
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

            {/* System Status */}
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

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-line/60 flex flex-col items-center justify-center">
            <p className="text-sm text-muted font-sans flex items-center gap-1.5 font-medium">
              Made with <Heart size={14} className="text-urgent fill-urgent animate-pulse" /> by Aayush
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
}