"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminChangeRole } from "@/app/actions/admin";
import type { Role } from "@/lib/domain/enums";

const ROLES: Role[] = ["CUSTOMER", "OPERATOR", "ADMIN"];
const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Cliente",
  OPERATOR: "Operador",
  ADMIN: "Admin",
};

// Alteração de papel do usuário. A validação real (somente ADMIN, sem alterar
// o próprio papel) acontece no servidor.
export function UserRole({ userId, currentRole, isSelf }: { userId: string; currentRole: Role; isSelf: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(currentRole);
  const [busy, setBusy] = useState(false);

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">você</span>;
  }

  async function change(next: Role) {
    setRole(next);
    if (next === currentRole) return;
    if (!confirm(`Alterar papel para ${ROLE_LABELS[next]}?`)) {
      setRole(currentRole);
      return;
    }
    setBusy(true);
    try {
      await adminChangeRole(userId, next);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
      setRole(currentRole);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={role}
      disabled={busy}
      onChange={(e) => change(e.target.value as Role)}
      className="rounded-xl border border-border bg-card px-2 py-1 text-sm text-foreground disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}
