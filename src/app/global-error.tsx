"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#fff9f5", color: "#231f20", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 520 }}>
            <p style={{ color: "#7a2438", fontWeight: 700 }}>Memória Eterna</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, marginBottom: 12 }}>Não conseguimos abrir a página</h1>
            <p style={{ color: "#6e6568", lineHeight: 1.7 }}>Tente carregar novamente. Se o problema continuar, volte em alguns minutos.</p>
            <button onClick={reset} style={{ marginTop: 24, border: 0, borderRadius: 999, background: "#7a2438", color: "white", padding: "14px 22px", fontWeight: 700, cursor: "pointer" }}>
              Tentar novamente
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
