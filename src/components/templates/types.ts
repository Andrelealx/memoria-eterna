import type { ProjectContent } from "@/lib/domain/projects";
import type { PublicPhoto } from "@/lib/server/media";

export interface TemplateProps {
  content: ProjectContent;
  photos: PublicPhoto[];
}
