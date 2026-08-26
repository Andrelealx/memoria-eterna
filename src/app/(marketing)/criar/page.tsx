import type { Metadata } from "next";
import { CreationWizard } from "@/components/wizard/creation-wizard";

export const metadata: Metadata = {
  title: "Criar presente",
};

export default function CriarPage() {
  return <CreationWizard />;
}
