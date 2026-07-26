"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, ShieldCheck, HeartHandshake, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

interface AnalyticsData {
  avgIschemiaHours: number;
  acceptRatePercent: number;
  successfulTransplants: number;
  systemLatencyMs: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void fetchAnalytics();
    }, 0);

    return () => {
      window.clearTimeout(initialLoad);
    };
  }, []);

  const stats = [
    {
      label: "Avg Cold Ischemia Time",
      value: loading ? "..." : `${data?.avgIschemiaHours ?? 0} hrs`,
      icon: Clock,
      subtext: "Calculated from transit ETAs",
    },
    {
      label: "Match Accept Rate",
      value: loading ? "..." : `${data?.acceptRatePercent ?? 0}%`,
      icon: ShieldCheck,
      subtext: "Accepted vs total offers",
    },
    {
      label: "Successful Transplants",
      value: loading ? "..." : `${data?.successfulTransplants ?? 0}`,
      icon: HeartHandshake,
      subtext: "Completed matches in database",
    },
    {
      label: "System Latency",
      value: loading ? "..." : `${data?.systemLatencyMs ?? 0}ms`,
      icon: Activity,
      subtext: "C++ Engine match duration",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Analytics</h1>
          <p className="text-sm text-muted">
            Live pipeline execution metrics calculated from active sessions.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Stats
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white border border-line rounded-card shadow-card p-5 space-y-2"
            >
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs font-medium">{item.label}</span>
                <Icon size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-bold font-mono tracking-tight">{item.value}</p>
              <span className="text-[11px] text-muted font-medium">{item.subtext}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-line rounded-card shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-base">Pipeline Optimization Insights</h3>
        <p className="text-sm text-muted leading-relaxed">
          The automatic ischemia windows calculator dynamically filters candidates based on transport ETAs to ensure cold ischemic ceilings are strictly respected.
        </p>
      </div>
    </div>
  );
}