"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import PatientTable from "@/components/registry/PatientTable";
import AddPatientModal from "@/components/registry/AddPatientModal";
import { listRecipients, addRecipient } from "@/lib/api";
import type { Recipient } from "@/types/dashboard";

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await listRecipients();
    if (res.status === "success") setRecipients(res.recipients);
    setLoading(false);
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(initialLoad);
    };
  }, []);

  // Server computes bloodMask/hlaMask from bloodType/hlaAntigens -- the
  // client only ever sends the human-readable fields.
  async function handleAdd(payload: {
    patientId: string;
    name: string;
    organNeeded: Recipient["organNeeded"];
    urgency: number;
    waitingYears: number;
    bloodType: string;
    hlaAntigens: number[];
    hospitalId: number;
    hospitalName: string;
  }) {
    const res = await addRecipient(payload);
    if (!res.ok) {
      return { ok: false, message: res.message };
    }
    await refresh();
    return { ok: true };
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl">Patient Registry</h1>
          <p className="text-muted text-sm mt-1">Waiting pool and manual enrollment.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> Add patient
        </Button>
      </div>

      <PatientTable recipients={recipients} loading={loading} />

      <AddPatientModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAdd} />
    </div>
  );
}
