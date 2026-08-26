// Seed de DESENVOLVIMENTO (seção 22). NUNCA misturar com produção.
// Dados fictícios claramente identificados como demonstração.
// Executar com: npm run db:seed

import {
  PrismaClient,
  Role,
  ProjectStatus,
  PaymentStatus,
  OrderStatus,
  PhysicalOrderStatus,
  NfcTagStatus,
  PaymentMethod,
  OrderItemType,
} from "@prisma/client";
import { DEFAULT_PLANS } from "../src/lib/domain/plans";
import { DEFAULT_TEMPLATES, NICHE_LABELS } from "../src/lib/domain/templates";
import {
  generateNfcToken,
  generatePublicToken,
  generateDraftToken,
  generateOrderNumber,
} from "../src/lib/domain/tokens";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@presentevivo.local").toLowerCase();
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Administrador (demo)";
const DEMO_EMAIL = "demo@presentevivo.local";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function main() {
  // 1. Categorias (nichos)
  const categoryIds = new Map<string, string>();
  for (const [niche, label] of Object.entries(NICHE_LABELS)) {
    const category = await prisma.category.upsert({
      where: { slug: niche },
      update: { name: label },
      create: { name: label, slug: niche, status: "ACTIVE", order: 1 },
    });
    categoryIds.set(niche, category.id);
  }

  // 2. Templates
  for (const t of DEFAULT_TEMPLATES) {
    const categoryId = categoryIds.get(t.niche);
    if (!categoryId) continue;
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: { name: t.name, description: t.description, presets: t.presets, categoryId },
      create: {
        slug: t.slug,
        name: t.name,
        description: t.description,
        categoryId,
        presets: t.presets,
        status: "ACTIVE",
      },
    });
  }

  // 3. Planos
  for (const p of DEFAULT_PLANS) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        priceCents: p.priceCents,
        durationDays: p.durationDays,
        includesPhysical: p.includesPhysical,
        order: p.order,
        limits: p.limits,
      },
      create: {
        slug: p.slug,
        name: p.name,
        priceCents: p.priceCents,
        durationDays: p.durationDays,
        includesPhysical: p.includesPhysical,
        order: p.order,
        limits: p.limits,
      },
    });
  }

  // 4. Usuários (admin + cliente demo)
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" as Role },
    create: {
      email: ADMIN_EMAIL,
      emailNormalized: normalizeEmail(ADMIN_EMAIL),
      name: ADMIN_NAME,
      role: "ADMIN" as Role,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      emailNormalized: normalizeEmail(DEMO_EMAIL),
      name: "Cliente Demo",
      role: "CUSTOMER" as Role,
    },
  });

  // 5. Projeto de demonstração "Alex e Dani"
  const demoTemplate = await prisma.template.findUniqueOrThrow({
    where: { slug: "romance-classico" },
  });
  const paraSempre = await prisma.plan.findUniqueOrThrow({ where: { slug: "para-sempre" } });

  const existingDemo = await prisma.project.findUnique({ where: { slug: "demo-alex-e-dani" } });

  if (!existingDemo) {
    // Cria o projeto primeiro (sem fotos), depois as mídias, depois atualiza o conteúdo.
    const demoProject = await prisma.project.create({
      data: {
        ownerId: customer.id,
        draftToken: generateDraftToken(),
        templateId: demoTemplate.id,
        templateVersion: demoTemplate.version,
        planId: paraSempre.id,
        slug: "demo-alex-e-dani",
        publicToken: generatePublicToken(),
        status: "PUBLISHED" as ProjectStatus,
        publishedAt: new Date(),
        content: { schemaVersion: 1, niche: "romance" },
      },
    });

    const photoDefs = [
      { key: "placeholders/foto-1.svg", alt: "Foto de demonstração 1", position: 0, cover: true },
      { key: "placeholders/foto-2.svg", alt: "Foto de demonstração 2", position: 1, cover: false },
      { key: "placeholders/foto-3.svg", alt: "Foto de demonstração 3", position: 2, cover: false },
    ];

    const mediaIds: string[] = [];
    for (const p of photoDefs) {
      const media = await prisma.mediaAsset.create({
        data: {
          projectId: demoProject.id,
          storageKey: p.key,
          mimeType: "image/svg+xml",
          sizeBytes: 0,
          width: 600,
          height: 800,
          status: "READY",
          position: p.position,
          altText: p.alt,
          variants: { thumbnail: p.key, preview: p.key, full: p.key },
        },
      });
      mediaIds.push(media.id);
    }

    await prisma.project.update({
      where: { id: demoProject.id },
      data: {
        content: {
          schemaVersion: 1,
          niche: "romance",
          creatorName: "Alex",
          recipientName: "Dani",
          title: "Demonstração — Alex e Dani",
          relationshipDate: "2022-06-14",
          message:
            "Esta é uma página de DEMONSTRAÇÃO (seed de desenvolvimento). Os nomes e fotos são fictícios.",
          counterEnabled: true,
          photos: [
            { assetId: mediaIds[0], altText: photoDefs[0].alt, position: 0, isCover: true },
            { assetId: mediaIds[1], altText: photoDefs[1].alt, position: 1, isCover: false },
            { assetId: mediaIds[2], altText: photoDefs[2].alt, position: 2, isCover: false },
          ],
          moments: [
            {
              id: "m1",
              date: "2022-06-14",
              title: "O começo",
              text: "O dia em que tudo começou (conteúdo fictício de demonstração).",
            },
            {
              id: "m2",
              date: "2023-02-14",
              title: "Primeiro Dia dos Namorados",
              text: "Um momento especial (conteúdo fictício de demonstração).",
            },
          ],
          music: null,
          finalPhrase: "Para sempre, nós dois.",
          colorScheme: "vinho",
        },
      },
    });

    // 6. Pedido digital pago (fictício)
    const digitalOrder = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(1),
        customerId: customer.id,
        checkoutEmail: DEMO_EMAIL,
        projectId: demoProject.id,
        currency: "BRL",
        subtotal: paraSempre.priceCents,
        total: paraSempre.priceCents,
        status: "PAID" as OrderStatus,
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: digitalOrder.id,
        type: "PLAN" as OrderItemType,
        planId: paraSempre.id,
        reference: paraSempre.slug,
        description: paraSempre.name,
        quantity: 1,
        unitCents: paraSempre.priceCents,
        totalCents: paraSempre.priceCents,
      },
    });
    await prisma.payment.create({
      data: {
        orderId: digitalOrder.id,
        provider: "fake",
        providerPaymentId: "demo_digital_paid",
        idempotencyKey: "demo_digital_paid_key",
        method: "PIX" as PaymentMethod,
        status: "APPROVED" as PaymentStatus,
        amount: paraSempre.priceCents,
        sanitizedPayload: { demo: true },
      },
    });

    // 7. Pedido físico em produção (fictício)
    const kit = await prisma.plan.findUniqueOrThrow({ where: { slug: "kit-coracao-nfc" } });
    const physicalOrder = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(2),
        customerId: customer.id,
        checkoutEmail: DEMO_EMAIL,
        projectId: demoProject.id,
        currency: "BRL",
        subtotal: kit.priceCents,
        shipping: 1990,
        total: kit.priceCents + 1990,
        status: "PAID" as OrderStatus,
        addressSnapshot: { cep: "01310-100", cidade: "São Paulo (demo)" },
      },
    });
    const phys = await prisma.physicalOrder.create({
      data: {
        orderId: physicalOrder.id,
        status: "PRINTING" as PhysicalOrderStatus,
        sku: "HEART-VINHO",
        color: "vinho",
        estimatedDays: 7,
        internalNotes: "Pedido físico fictício (seed de desenvolvimento).",
      },
    });

    // 8. Tag NFC ativa vinculada ao pedido físico
    await prisma.nfcTag.create({
      data: {
        publicToken: generateNfcToken(),
        projectId: demoProject.id,
        physicalOrderId: phys.id,
        status: "TESTED" as NfcTagStatus,
        destinationUrl: `/presente/demo-alex-e-dani`,
        testedAt: new Date(),
      },
    });
  }

  // 9. Tag de teste desativada (independente)
  const existingTestTag = await prisma.nfcTag.findFirst({ where: { status: "DISABLED" } });
  if (!existingTestTag) {
    await prisma.nfcTag.create({
      data: {
        publicToken: generateNfcToken(),
        status: "DISABLED" as NfcTagStatus,
        batchNumber: "TEST-DISABLED",
        disabledAt: new Date(),
      },
    });
  }

  console.log("Seed concluído (desenvolvimento).");
  console.log(`Admin: ${ADMIN_EMAIL} (role ADMIN)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
