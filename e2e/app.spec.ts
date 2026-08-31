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

test("filtro do catálogo abre somente a ocasião escolhida", async ({ page }) => {
  await page.goto("/modelos?nicho=pet");
  await expect(page.getByRole("heading", { name: "Pet", exact: true })).toBeVisible();
  await expect(page.getByText("Meu Melhor Amigo")).toBeVisible();
  await expect(page.getByText("Romance Clássico")).toHaveCount(0);
});

test("modelo escolhido chega selecionado no assistente", async ({ page }) => {
  await page.goto("/criar?template=amor-minimalista");
  await expect(
    page.getByText("Selecionado agora: Amor Minimalista", { exact: true }),
  ).toBeVisible();
});

test("IA cria um rascunho e permite ir direto para a revisão", async ({ page }) => {
  await page.goto("/criar");
  const aiHeading = page.getByRole("heading", {
    name: "Conte a história. A IA monta o presente.",
  });
  const aiAvailable = await aiHeading
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!aiAvailable, "IA não configurada neste ambiente");

  await page.getByRole("button", { name: "Para o amor" }).click();
  await page.getByText("Personalizar estilo da escrita").click();
  await page.getByRole("button", { name: "Divertido" }).click();
  await expect(page.getByRole("button", { name: "Divertido" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Criar meu presente com IA" }).click();

  await expect(page.getByText("Seu rascunho ganhou vida.")).toBeVisible();
  await expect(page.getByLabel("Nome de quem recebe")).toHaveValue("Marina");
  await page.getByLabel("Seu nome (quem cria)").fill("Pessoa E2E");
  await page.getByRole("button", { name: "Ver prévia e escolher plano" }).click();
  await expect(page.getByText("Sua experiência está pronta para a revisão")).toBeVisible();

  const checkoutEmail = `retomada-${Date.now()}@example.com`;
  await page.getByLabel("Seu e-mail (para receber o acesso)").fill(checkoutEmail);
  await page.getByLabel("Seu nome", { exact: true }).fill("Cliente Retomado");
  await page.reload();

  await expect(page.getByRole("heading", { name: "Quer continuar de onde parou?" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar na revisão" }).click();
  await expect(page.getByText("Rascunho retomado em prévia e plano.")).toBeVisible();
  await expect(page.getByText("Seus dados desta compra foram recuperados.")).toBeVisible();
  await expect(page.getByLabel("Seu e-mail (para receber o acesso)")).toHaveValue(checkoutEmail);
  await expect(page.getByLabel("Seu nome", { exact: true })).toHaveValue("Cliente Retomado");
});

test("cria o presente e exibe o Pix copia e cola", async ({ page }) => {
  await page.goto("/criar?template=romance-classico");
  const livePreview = page.getByRole("complementary", { name: "Prévia ao vivo do presente" });
  await expect(livePreview).toBeVisible();
  await page.getByRole("button", { name: /Começar com este modelo|Criar passo a passo/ }).click();

  await page.getByLabel("Seu nome (quem cria)").fill("Pessoa E2E");
  await page.getByLabel("Nome de quem vai receber").fill("Presenteado E2E");
  await page.getByLabel("Título da página").fill("Uma história de teste");
  await expect(
    livePreview.getByRole("heading", { name: "Pessoa E2E & Presenteado E2E" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar para Fotos" }).click();
  await page.locator("#gift-photos").setInputFiles({
    name: "memoria.png",
    mimeType: "image/png",
    // Passa do limite padrão de 1 MB das Server Actions e confirma a margem
    // configurada para fotos reais de celular.
    buffer: Buffer.concat([
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
      Buffer.alloc(1_100_000),
    ]),
  });
  await expect(page.getByText("1 foto adicionada.")).toBeVisible();
  await expect(page.getByText("Capa", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remover foto 1" }).click();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("Foto restaurada na galeria.")).toBeVisible();
  await expect(page.getByText("Capa", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continuar para Nossa história" }).click();
  await page.getByRole("button", { name: "Continuar sem momentos" }).click();
  await page.getByRole("button", { name: "Revisar sem música" }).click();

  await page.getByRole("button", { name: /^Momento/ }).click();
  await page.getByLabel("Seu e-mail (para receber o acesso)").fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel("Seu nome", { exact: true }).fill("C");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Gerar Pix de/ }).click();
  await expect(page.getByText("Digite o seu nome com pelo menos 2 caracteres.")).toBeVisible();
  await expect(page.getByLabel("Seu nome", { exact: true })).toBeFocused();
  await page.getByLabel("Seu nome", { exact: true }).fill("Comprador E2E");
  await page.getByRole("button", { name: /Gerar Pix de/ }).click();

  await expect(page).toHaveURL(/\/pagamento\/pendente/);
  await expect(page.getByLabel("Pix copia e cola")).toContainText("DEV-FAKE-PIX");

  // O cookie HttpOnly deve permitir recuperar a cobrança mesmo quando o cache
  // efêmero da aba desaparece (reload, restauração de guia ou limpeza manual).
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByLabel("Pix copia e cola")).toContainText("DEV-FAKE-PIX");
});

test("página pública do projeto de demonstração renderiza", async ({ page }) => {
  await page.goto("/presente/demo-alex-e-dani");
  await expect(page.getByText(/Alex/i).first()).toBeVisible();
});

test("experiências de romance, pet, bebê e casamento renderizam sem erro", async ({ page }) => {
  for (const [slug, heading] of [
    ["romance-classico", "Alex & Dani"],
    ["aventuras-do-pet", "Rex"],
    ["album-do-bebe", "Alice"],
    ["nossos-votos", "Alice & Bruno"],
  ] as const) {
    await page.goto(`/modelos/${slug}`);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByText("Application error")).toHaveCount(0);
  }
});

test("admin não autenticado redireciona para /entrar", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/entrar/);
});
