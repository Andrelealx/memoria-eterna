import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { Role } from "@/lib/domain/enums";

// Proteção de rotas no servidor (seções 8, 12). Nunca confiar em esconder menus.

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
