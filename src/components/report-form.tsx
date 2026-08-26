"use client";

import { useState } from "react";
import { submitReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportForm({ projectId }: { projectId: string }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await submitReport({ projectId, reason, description, contact });
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <p className="mt-6 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
        Denúncia recebida. Obrigado por nos avisar.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="reason">Motivo</Label>
        <Input
          id="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: conteúdo íntimo não consentido"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="contact">Contato (opcional)</Label>
        <Input
          id="contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <Button type="submit" disabled={busy || !reason}>
        Enviar denúncia
      </Button>
    </form>
  );
}
