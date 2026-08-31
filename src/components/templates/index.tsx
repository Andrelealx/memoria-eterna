import type { TemplateProps } from "./types";
import { StoryExperience } from "./story-experience";
import { EXPERIENCE_PRESETS } from "./experience-presets";

// Resolve o componente de apresentação a partir do slug do template (seção 11).
// O template muda a apresentação; o schema de conteúdo é único e versionado.
export function TemplateRenderer({ slug, ...props }: TemplateProps & { slug: string }) {
  const experience = EXPERIENCE_PRESETS[slug] ?? EXPERIENCE_PRESETS["romance-classico"];
  return <StoryExperience {...props} preset={experience} />;
}
