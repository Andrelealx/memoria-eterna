-- Políticas de Row-Level Security (RLS) para produção no Supabase.
-- Aplicar manualmente no SQL editor do Supabase após o `prisma migrate deploy`.
-- No PostgreSQL local de desenvolvimento, RLS não é aplicada.

-- 1. Ativa RLS nas tabelas sensíveis.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nfc_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "physical_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupon_redemptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "abuse_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;

-- 2. Políticas básicas (ajustar conforme o modelo de auth do Supabase).
-- Exemplo para `projects`: o proprietário vê apenas os próprios projetos.
-- A coluna `owner_id` referencia `auth.uid()` do Supabase Auth.
CREATE POLICY "projects_owner_select" ON "projects"
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "projects_owner_all" ON "projects"
  FOR ALL USING (owner_id = auth.uid());

-- Mídias: apenas o dono do projeto acessa.
CREATE POLICY "media_assets_owner" ON "media_assets"
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

-- Pedidos: apenas o cliente dono vê.
CREATE POLICY "orders_owner" ON "orders"
  FOR SELECT USING (customer_id = auth.uid());

-- NOTA: operadores/admin acessam via service role no servidor (não via RLS de cliente).
