import Badge from "@/components/ui/Badge";
import type { Recipient } from "@/types/dashboard";

interface PatientTableProps {
  recipients: Recipient[];
  loading: boolean;
}

function statusTone(status: Recipient["status"]) {
  if (status === "waiting") return "primary" as const;
  if (status === "matched") return "safe" as const;
  return "neutral" as const;
}

export default function PatientTable({ recipients, loading }: PatientTableProps) {
  if (loading) {
    return <div className="bg-white border border-line rounded-card p-6 text-sm text-muted">Loading registry…</div>;
  }

  if (recipients.length === 0) {
    return (
      <div className="bg-white border border-line rounded-card p-6 text-sm text-muted">
        No patients registered yet. Add one to populate the waiting pool.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block bg-white border border-line rounded-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-4 py-3">Patient</th>
              <th className="text-left font-medium px-4 py-3">Organ</th>
              <th className="text-left font-medium px-4 py-3">Urgency</th>
              <th className="text-left font-medium px-4 py-3">Waiting</th>
              <th className="text-left font-medium px-4 py-3">Hospital</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.patientId} className="border-t border-line">
                <td className="px-4 py-3 font-mono">{r.patientId}</td>
                <td className="px-4 py-3">{r.organNeeded}</td>
                <td className="px-4 py-3 font-mono">{r.urgency}/10</td>
                <td className="px-4 py-3 font-mono">{r.waitingYears}y</td>
                <td className="px-4 py-3 font-mono">#{r.hospitalId}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {recipients.map((r) => (
          <div key={r.patientId} className="bg-white border border-line rounded-card shadow-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium text-sm">{r.patientId}</span>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            </div>
            <p className="text-sm text-ink mt-1">{r.organNeeded}</p>
            <div className="flex gap-4 mt-2 text-xs text-muted font-mono">
              <span>Urgency {r.urgency}/10</span>
              <span>{r.waitingYears}y waiting</span>
              <span>Hosp #{r.hospitalId}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}