import { test, expect, type Page } from "@playwright/test";

// Fluxos administrativos (seção 23). Fazem login real pelo magic link de dev e
// exercitam as ações do painel. Rodam contra o ambiente de desenvolvimento com seed.

const ADMIN_EMAIL = "admin@memoriaeternaprime.com.br";

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("Seu e-mail").fill(ADMIN_EMAIL);
  await page.getByRole("button", { name: "Enviar link de acesso" }).click();
  await page.getByRole("link", { name: "abrir link de acesso" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("staff faz login e cai direto no admin", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("admin cria e exclui um cupom", async ({ page }) => {
  await loginAsAdmin(page);

  const code = `E2E${Date.now()}`;
  await page.goto("/admin/cupons");
  await expect(page.getByText("Novo cupom")).toBeVisible();

  await page.getByLabel("Código").fill(code);
  await page.getByLabel("Tipo").selectOption("FIXED");
  await page.getByLabel("Valor (R$)").fill("10");
  await page.getByRole("button", { name: "Criar cupom" }).click();

  const row = page.locator("li", { hasText: code });
  await expect(row).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "Excluir" }).click();
  await expect(row).toHaveCount(0);
});

test("admin edita e reverte o preço de um plano", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/admin/planos");
  const momento = page.locator("li", { hasText: "Momento" });
  await expect(momento).toContainText("R$ 19,90");

  await momento.getByTitle("Editar preço").click();
  await momento.getByRole("textbox").fill("20,00");
  await momento.getByRole("button", { name: "Salvar" }).click();
  await expect(momento).toContainText("R$ 20,00");

  await momento.getByTitle("Editar preço").click();
  await momento.getByRole("textbox").fill("19,90");
  await momento.getByRole("button", { name: "Salvar" }).click();
  await expect(momento).toContainText("R$ 19,90");
});

test("admin edita nome e duração de um plano", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/admin/planos");
  const momento = page.locator("li", { hasText: "R$ 19,90" });

  // Nome: Momento -> Momento E2E -> Momento
  await momento.getByTitle("Editar nome").click();
  await momento.getByRole("textbox").fill("Momento E2E");
  await momento.getByRole("button", { name: "Salvar" }).click();
  await expect(momento).toContainText("Momento E2E");

  await momento.getByTitle("Editar nome").click();
  await momento.getByRole("textbox").fill("Momento");
  await momento.getByRole("button", { name: "Salvar" }).click();
  await expect(momento).toContainText("Momento");

  // Duração: 7 dias -> 30 dias -> 7 dias
  const duration = momento.getByTitle("Duração");
  await expect(duration).toHaveValue("7");
  await duration.selectOption("30");
  await expect(duration).toBeEnabled();
  await expect(duration).toHaveValue("30");
  await duration.selectOption("7");
  await expect(duration).toBeEnabled();
  await expect(duration).toHaveValue("7");
});

test("admin arquiva e reativa um template no catálogo", async ({ page }) => {
  await loginAsAdmin(page);

  // Arquivar "Amor Minimalista"
  await page.goto("/admin/templates");
  const row = page.locator("li", { hasText: "Amor Minimalista" });
  await row.getByRole("button", { name: "Arquivar" }).click();
  await expect(row.getByRole("button", { name: "Ativar" })).toBeVisible();

  // Some do catálogo público
  await page.goto("/modelos");
  await expect(page.getByText("Amor Minimalista")).toHaveCount(0);

  // Reativar e confirmar que volta ao catálogo
  await page.goto("/admin/templates");
  const row2 = page.locator("li", { hasText: "Amor Minimalista" });
  await row2.getByRole("button", { name: "Ativar" }).click();
  await expect(row2.getByRole("button", { name: "Arquivar" })).toBeVisible();

  await page.goto("/modelos");
  await expect(page.getByText("Amor Minimalista")).toBeVisible();
});
