"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateCoupon } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Formulário de criação de cupom. O valor é tratado no servidor: para FIXED,
// reais → centavos; para PERCENTAGE, inteiro 1..100.
export function CouponCreate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [validUntil, setValidUntil] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminCreateCoupon({ code, type, value, validUntil: validUntil || null });
      setCode("");
      setValue("");
      setValidUntil("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-serif text-lg">Novo cupom</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="coupon-code">Código</Label>
          <Input
            id="coupon-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BOASVINDAS10"
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="coupon-type">Tipo</Label>
          <select
            id="coupon-type"
            value={type}
            onChange={(e) => setType(e.target.value as "FIXED" | "PERCENTAGE")}
            className="mt-1.5 flex h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground"
          >
            <option value="FIXED">Valor fixo (R$)</option>
            <option value="PERCENTAGE">Percentual (%)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="coupon-value">{type === "FIXED" ? "Valor (R$)" : "Desconto (%)"}</Label>
          <Input
            id="coupon-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "FIXED" ? "19,90" : "10"}
            className="mt-1.5"
            inputMode="decimal"
            required
          />
        </div>
        <div>
          <Label htmlFor="coupon-until">Válido até (opcional)</Label>
          <Input
            id="coupon-until"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="mt-4">
        <Button type="submit" disabled={busy}>
          {busy ? "Criando..." : "Criar cupom"}
        </Button>
      </div>
    </form>
  );
}
