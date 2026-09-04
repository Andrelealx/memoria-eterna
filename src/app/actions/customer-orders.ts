"use server";

import { requireUser } from "@/lib/auth/require-auth";
import { regeneratePixForCustomer, type RegeneratePixResult } from "@/lib/server/orders";

// Ações do cliente autenticado sobre os próprios pedidos (/painel/pedidos).

/**
 * Gera um Pix novo para o pedido logado. Diferente da versão do checkout
 * anônimo, não depende do cookie criado no navegador em que a compra
 * começou — funciona em qualquer aparelho onde a pessoa faça login, o que
 * cobre o caso de quem perdeu o Pix original e não tinha como recuperá-lo.
 */
export async function regenerateOrderPix(orderId: string): Promise<RegeneratePixResult> {
  const user = await requireUser();
  return regeneratePixForCustomer(orderId, user.id);
}
