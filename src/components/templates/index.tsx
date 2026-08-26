import type { TemplateProps } from "./types";
import { RomanceClassico } from "./romance-classico";
import { LinhaDoTempo } from "./linha-do-tempo";
import { AmorMinimalista } from "./amor-minimalista";

// Resolve o componente de apresentação a partir do slug do template (seção 11).
// O template muda a apresentação; o schema de conteúdo é único e versionado.
export function TemplateRenderer({ slug, ...props }: TemplateProps & { slug: string }) {
  switch (slug) {
    case "romance-classico":
      return <RomanceClassico {...props} />;
    case "nossa-linha-do-tempo":
      return <LinhaDoTempo {...props} />;
    case "amor-minimalista":
      return <AmorMinimalista {...props} />;
    default:
      return <RomanceClassico {...props} />;
  }
}
