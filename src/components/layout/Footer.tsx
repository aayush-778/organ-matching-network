import Link from "next/link";
import { Activity, Heart, Mail, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto overflow-hidden">
      
      {/* Marquee Background */}
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
            animation: marquee 150s linear infinite;
            width: max-content;
          }
        `}} />
      </div>

      <div className="bg-white border-t border-line">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-8">
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-4 lg:gap-8 justify-items-center">
            
            {/* Column 1: Brand & Description (Spans full width on mobile) */}
            <div className="col-span-2 md:col-span-1 flex flex-col items-center text-center max-w-[280px]">
              <div className="flex items-center gap-3 mb-4 md:mb-5">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary shadow-sm">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <span className="font-heading font-bold text-ink text-lg md:text-xl tracking-tight">
                  Organ-Match Network
                </span>
              </div>
              <p className="text-sm text-muted leading-relaxed font-sans">
                A high-performance algorithmic pipeline for real-time organ donor matching and critical medical logistics.
              </p>
            </div>

            {/* Column 2: Platform Links */}
            <div className="col-span-1 w-full flex flex-col items-center text-center">
              <h4 className="font-heading font-semibold text-ink text-sm md:text-base mb-4 md:mb-5">Platform</h4>
              <ul className="space-y-3 text-xs md:text-sm text-muted font-sans font-medium flex flex-col items-center">
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

            {/* Column 3: Let's Connect (Takes right half on mobile) */}
            <div className="col-span-1 w-full flex flex-col items-center text-center max-w-[280px]">
              <h4 className="font-heading font-semibold text-ink text-sm md:text-base mb-3 md:mb-5">Let's Connect</h4>
              
              <p className="text-[11px] md:text-sm text-muted leading-relaxed font-sans mb-4 md:mb-5">
                Have a recommendation, found an issue, or just want to chat?
              </p>
              
              <div className="flex flex-col gap-2 md:gap-3 w-full max-w-[160px] md:max-w-[220px]">
                <a 
                  href="mailto:abcx7019@example.com" 
                  className="flex items-center justify-center gap-2 text-[11px] md:text-sm font-medium text-ink hover:text-primary transition-colors bg-surface hover:bg-primary/5 px-2.5 md:px-4 py-2 md:py-2.5 rounded-lg border border-line/60 w-full shadow-sm group"
                >
                  <Mail size={14} className="text-primary md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                  Drop me an email
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-center gap-2 text-[11px] md:text-sm font-medium text-ink hover:text-primary transition-colors bg-surface hover:bg-primary/5 px-2.5 md:px-4 py-2 md:py-2.5 rounded-lg border border-line/60 w-full shadow-sm group"
                >
                  <MessageSquare size={14} className="text-primary md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                  Send feedback
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="mt-12 md:mt-16 pt-8 border-t border-line/60 flex flex-col items-center justify-center">
            <p className="text-[11px] md:text-sm text-muted font-sans flex items-center gap-1.5 font-medium">
              Made with <Heart size={14} className="text-urgent fill-urgent animate-pulse" /> by Aayush
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
}