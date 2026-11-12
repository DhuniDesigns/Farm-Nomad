import { CheckCircle, Circle, CircleDashed, Truck, XCircle } from "@phosphor-icons/react/dist/ssr";
import type { OrderStatus, PaymentStatus } from "@/lib/types/api";
import type { Tone } from "./ui";

// Linear-style status icons: shape carries meaning as well as colour.
export const statusMeta: Record<OrderStatus, { label: string; short: string; icon: typeof Circle; color: string; tone: Tone }> = {
  PENDING: { label: "To pack", short: "To pack", icon: CircleDashed, color: "text-app-amber", tone: "amber" },
  ASSIGNED: { label: "Driver assigned", short: "Assigned", icon: Circle, color: "text-app-blue", tone: "blue" },
  IN_TRANSIT: { label: "On the way", short: "On the way", icon: Truck, color: "text-app-blue", tone: "blue" },
  DELIVERED: { label: "Delivered", short: "Delivered", icon: CheckCircle, color: "text-app-accent", tone: "green" },
  CANCELLED: { label: "Cancelled", short: "Cancelled", icon: XCircle, color: "text-app-faint", tone: "neutral" },
};

export const paymentMeta: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PAID: { label: "Paid", tone: "green" },
  UNPAID: { label: "Unpaid", tone: "amber" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const ORDER_FLOW: OrderStatus[] = ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED"];
