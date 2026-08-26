import type { TemplateProps } from "./types";
import { RomanceClassico } from "./romance-classico";
import { LinhaDoTempo } from "./linha-do-tempo";
import { AmorMinimalista } from "./amor-minimalista";
import { AmigosParaSempre } from "./amigos-para-sempre";
import { MuralDeMemorias } from "./mural-de-memorias";
import { MomentosDaAmizade } from "./momentos-da-amizade";
import { NossaFamilia } from "./nossa-familia";
import { CantinhoDaFamilia } from "./cantinho-da-familia";
import { AlbumDaFamilia } from "./album-da-familia";
import { MelhorAmigo } from "./melhor-amigo";
import { AventurasDoPet } from "./aventuras-do-pet";
import { DiarioDoPet } from "./diario-do-pet";
import { FelizAniversario } from "./feliz-aniversario";
import { NossaTrajetoria } from "./nossa-trajetoria";
import { SurpresaDeAniversario } from "./surpresa-de-aniversario";
import { BemVindoBebe } from "./bem-vindo-bebe";
import { AlbumDoBebe } from "./album-do-bebe";
import { MesAMes } from "./mes-a-mes";
import { NossoSim } from "./nosso-sim";
import { GaleriaDeCasamento } from "./galeria-de-casamento";
import { NossosVotos } from "./nossos-votos";

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
    case "amigos-para-sempre":
      return <AmigosParaSempre {...props} />;
    case "mural-de-memorias":
      return <MuralDeMemorias {...props} />;
    case "momentos-da-amizade":
      return <MomentosDaAmizade {...props} />;
    case "nossa-familia":
      return <NossaFamilia {...props} />;
    case "cantinho-da-familia":
      return <CantinhoDaFamilia {...props} />;
    case "album-da-familia":
      return <AlbumDaFamilia {...props} />;
    case "melhor-amigo":
      return <MelhorAmigo {...props} />;
    case "aventuras-do-pet":
      return <AventurasDoPet {...props} />;
    case "diario-do-pet":
      return <DiarioDoPet {...props} />;
    case "feliz-aniversario":
      return <FelizAniversario {...props} />;
    case "nossa-trajetoria":
      return <NossaTrajetoria {...props} />;
    case "surpresa-de-aniversario":
      return <SurpresaDeAniversario {...props} />;
    case "bem-vindo-bebe":
      return <BemVindoBebe {...props} />;
    case "album-do-bebe":
      return <AlbumDoBebe {...props} />;
    case "mes-a-mes":
      return <MesAMes {...props} />;
    case "nosso-sim":
      return <NossoSim {...props} />;
    case "galeria-de-casamento":
      return <GaleriaDeCasamento {...props} />;
    case "nossos-votos":
      return <NossosVotos {...props} />;
    default:
      return <RomanceClassico {...props} />;
  }
}
