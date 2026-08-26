import type { Role } from "@/lib/domain/enums";

// Autorização baseada em papéis (seções 8, 12, 15). Rotas privadas são protegidas
// no SERVIDOR; nunca confiar apenas em esconder menus no frontend.

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

/** Papéis com permissão administrativa. */
const ADMIN_ROLES: Role[] = ["ADMIN", "OPERATOR"];

export function hasRole(user: SessionUser | null, roles: Role[]): boolean {
  return user != null && roles.includes(user.role);
}

export function isAdmin(user: SessionUser | null): boolean {
  return hasRole(user, ["ADMIN"]);
}

export function isStaff(user: SessionUser | null): boolean {
  return hasRole(user, ADMIN_ROLES);
}

export function isCustomer(user: SessionUser | null): boolean {
  return hasRole(user, ["CUSTOMER"]);
}

/** Lança se o usuário não tiver um dos papéis exigidos. */
export function requireRole(user: SessionUser | null, roles: Role[]): SessionUser {
  if (!hasRole(user, roles)) {
    throw new Error("[auth] Acesso negado: papel insuficiente.");
  }
  return user as SessionUser;
}

/** Cliente só acessa os próprios recursos (IDOR prevention, seção 18). */
export function canAccessOwnedResource(user: SessionUser | null, ownerId: string | null): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  return ownerId === user.id;
}

/** Operadores físicos não devem ver dados financeiros (seção 15). */
export function canViewFinancialData(user: SessionUser | null): boolean {
  return isAdmin(user);
}
