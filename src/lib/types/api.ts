// Types mirror FARMNOMAD-FRONTEND-BUILD-SPEC.md §2 so the mock and the Spring Boot API share one contract.

export type Role = "ADMIN" | "FARMER" | "KITCHEN" | "CUSTOMER" | "DRIVER" | "ORGANISATION";
export type OrganisationType = "FOODBANK" | "SCHOOL" | "RELIGIOUS" | "STUDENT_GROUP";
export type OrderStatus = "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type NotificationType = "SURPLUS_ALERT" | "ORDER_UPDATE" | "DONATION_UPDATE" | "SYSTEM";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  profilePictureUrl?: string | null;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantityAvailable: number;
  pickupAddress?: string;
  category?: string;
  tags?: string[];
  coverImageUrl?: string;
  imageUrls?: string[];
  bestBeforeDate?: string;
  farmerId: number;
  farmerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  customerId: number;
  customerName: string;
  driverId?: number | null;
  driverName?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Surplus {
  id: number;
  productId: number;
  productName?: string;
  quantity?: number;
  availableQuantity?: number;
  createdAt?: string;
}

export interface Notification {
  id: number;
  recipientId: number;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export const PRODUCT_CATEGORIES = ["Vegetables", "Fruit", "Grain", "Dairy", "Meat", "Other"] as const;

/** Product input as the form collects it. The real API takes multipart; see api/farmnomad.ts. */
export type ProductInput = Pick<Product, "name" | "price" | "quantityAvailable"> &
  Partial<Pick<Product, "description" | "category" | "bestBeforeDate" | "pickupAddress" | "tags" | "coverImageUrl">>;

// ─── UI-derived helpers (not part of the API) ───
export type StockState = "active" | "low" | "expiring" | "expired" | "out";

export function stockState(p: Product, now = new Date()): StockState {
  if (p.quantityAvailable <= 0) return "out";
  if (p.bestBeforeDate) {
    const days = daysUntil(p.bestBeforeDate, now);
    if (days < 0) return "expired";
    if (days <= 3) return "expiring";
  }
  if (p.quantityAvailable <= 10) return "low";
  return "active";
}

export function daysUntil(iso: string, now = new Date()) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86_400_000);
}
