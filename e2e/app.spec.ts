import { expect, test } from "@playwright/test";

// Fluxos críticos (seção 23). Rodam contra o ambiente de desenvolvimento com seed.

test("landing page carrega com o hero", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Suas memórias em um presente que pode ser tocado." }),
  ).toBeVisible();
});

test("catálogo de modelos lista os três templates", async ({ page }) => {
  await page.goto("/modelos");
  await expect(page.getByText("Romance Clássico")).toBeVisible();
  await expect(page.getByText("Nossa Linha do Tempo")).toBeVisible();
  await expect(page.getByText("Amor Minimalista")).toBeVisible();
});

test("página pública do projeto de demonstração renderiza", async ({ page }) => {
  await page.goto("/presente/demo-alex-e-dani");
  await expect(page.getByText(/Alex/i).first()).toBeVisible();
});

test("admin não autenticado redireciona para /entrar", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/entrar/);
});
