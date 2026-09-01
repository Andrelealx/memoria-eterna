"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { requestMagicLink } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSent(false);
    try {
      const res = await requestMagicLink(email);
      setSent(true);
      setDevUrl(res.devUrl ?? null);
    } catch {
      setError("Não conseguimos enviar o link agora. Aguarde um instante e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <div>
        <Label htmlFor="email">Seu e-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className="mt-1.5"
        />
      </div>

      <Button type="submit" disabled={busy || !email} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enviar link de acesso
      </Button>

      {sent && (
        <p className="bg-secondary text-muted-foreground rounded-xl px-4 py-3 text-sm">
          Se este e-mail estiver cadastrado, enviaremos um link de acesso.
        </p>
      )}

      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {devUrl && (
        <p className="text-sm">
          <span className="text-muted-foreground">Ambiente de desenvolvimento: </span>
          <a href={devUrl} className="text-primary font-medium underline">
            abrir link de acesso
          </a>
        </p>
      )}
    </form>
  );
}
