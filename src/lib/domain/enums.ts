import { z } from "zod";

// Estados de negócio canônicos (seção 21). Os valores batem com os enums do
// Prisma para que possam ser persistidos diretamente sem conversão.

export const ROLES = ["CUSTOMER", "OPERATOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROJECT_STATUSES = [
  "DRAFT",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "PUBLISHED",
  "EXPIRED",
  "ARCHIVED",
  "BLOCKED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "CREATED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "REFUNDED",
  "CHARGEDBACK",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAID",
  "CANCELLED",
  "REFUNDED",
  "CHARGEDBACK",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PHYSICAL_ORDER_STATUSES = [
  "WAITING_PAYMENT",
  "QUEUED",
  "PRINTING",
  "ASSEMBLY",
  "NFC_WRITING",
  "QUALITY_CHECK",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
] as const;
export type PhysicalOrderStatus = (typeof PHYSICAL_ORDER_STATUSES)[number];

export const NFC_TAG_STATUSES = [
  "GENERATED",
  "WRITTEN",
  "TESTED",
  "PACKED",
  "SHIPPED",
  "ACTIVE",
  "DISABLED",
] as const;
export type NfcTagStatus = (typeof NFC_TAG_STATUSES)[number];

export const PAYMENT_METHODS = ["PIX", "CARD", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const COUPON_TYPES = ["FIXED", "PERCENTAGE"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

// Zod enums reutilizáveis (validação compartilhada).
export const roleSchema = z.enum(ROLES);
export const projectStatusSchema = z.enum(PROJECT_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const physicalOrderStatusSchema = z.enum(PHYSICAL_ORDER_STATUSES);
export const nfcTagStatusSchema = z.enum(NFC_TAG_STATUSES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const couponTypeSchema = z.enum(COUPON_TYPES);
