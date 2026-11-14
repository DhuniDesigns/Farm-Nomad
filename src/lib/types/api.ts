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
  /** CONFIRM WITH BACKEND: not in the documented user shape; the admin list uses it for "joined". */
  createdAt?: string;
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
  // CONFIRM WITH BACKEND: drivers need both ends of the run. The mock fills these in.
  pickupAddress?: string;
  deliveryAddress?: string;
  farmerName?: string;
  donationId?: number;
}

export interface Surplus {
  id: number;
  productId: number;
  productName?: string;
  quantity?: number;
  availableQuantity?: number;
  createdAt?: string;
  // UI enrichments (see Donation).
  farmerName?: string;
  coverImageUrl?: string;
  bestBeforeDate?: string;
  pickupAddress?: string;
  claimedByMe?: boolean;
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
  Partial<Pick<Product, "description" | "category" | "bestBeforeDate" | "pickupAddress" | "tags" | "coverImageUrl" | "imageUrls">>;

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

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product?: Product;
}

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

/** Roles the demo can show: every role, including the admin console. */
export type MockRole = Role;

// ─── R3: NomadEat (spec §3.4 /meals) ───
export interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  portionsAvailable: number;
  cuisine: string;
  imageUrls: string[];
  available: boolean;
  kitchenId?: number;
  createdAt?: string;
  // UI enrichments. CONFIRM WITH BACKEND: not in the documented meal body yet.
  kitchenName?: string;
  kitchenArea?: string;
  dietary?: string[];
  farms?: string[]; // farms on FarmNomad the ingredients came from
}
export type MealInput = Pick<Meal, "name" | "description" | "price" | "portionsAvailable" | "cuisine" | "imageUrls" | "available"> & Partial<Pick<Meal, "dietary" | "farms">>;

/**
 * CONFIRM WITH BACKEND: the spec has no meal ordering endpoint. The demo assumes
 * POST /meal-orders {mealId, quantity}, GET /meal-orders/my, GET /meal-orders/kitchen,
 * PATCH /meal-orders/{id}/status?status=.
 */
export type MealOrderStatus = "NEW" | "PREPARING" | "READY" | "COLLECTED" | "CANCELLED";
export interface MealOrder {
  id: number;
  mealId: number;
  mealName: string;
  quantity: number;
  total: number;
  customerId: number;
  customerName: string;
  kitchenId: number;
  kitchenName?: string;
  status: MealOrderStatus;
  createdAt: string;
  updatedAt?: string;
  note?: string;
}

// ─── R2: donations, organisations, messages (spec §2, §3.9–3.12) ───
export type VerificationLevel = "UNVERIFIED" | "PENDING" | "VERIFIED";
/** CONFIRM WITH BACKEND: spec types status as a plain string; these are the values the UI expects. */
export type DonationStatus = "PENDING" | "CLAIMED" | "IN_DELIVERY" | "DELIVERED";

export interface Donation {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  status?: DonationStatus;
  farmerId?: number;
  organisationId?: number | null;
  createdAt?: string;
  // UI enrichments: the mock joins these from the product. If the API doesn't, join with GET /products/{id}.
  farmerName?: string;
  organisationName?: string | null;
  coverImageUrl?: string;
  bestBeforeDate?: string;
  pickupAddress?: string;
  note?: string;
}

export interface Organisation {
  id: number;
  name: string;
  type: OrganisationType;
  charityNumber?: string;
  verificationLevel?: VerificationLevel;
  userId?: number;
  createdAt?: string;
  description?: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName?: string;
  recipientId: number;
  recipientName?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// ─── Farmer tools: crop scanner and weather & planting ───────────────
// Everything goes through the Spring Boot API (never the farmnomad-ai service directly).
// CONFIRM WITH BACKEND: paths and fields below follow the agreed contract as described, not a
// published schema. Adjust here and in src/lib/api/cropScan.api.ts / weather.api.ts if they differ.

/** POST /uploads (multipart, field `file`) → hosted image URL (Cloudinary). */
export interface UploadResult {
  url: string;
}

export type ScanSeverity = "NONE" | "LOW" | "MODERATE" | "HIGH";

/** A diagnosed crop photo. POST /crop-scans/diagnose { imageUrl } returns one and saves it. */
export interface CropScan {
  id: number;
  imageUrl: string;
  crop?: string; // e.g. "Tomato"
  diagnosis: string; // disease name, or "Healthy"
  healthy?: boolean;
  confidence: number; // 0–1 (spec §10 Q6: confirm the scale; the UI also accepts 0–100)
  severity?: ScanSeverity;
  treatment?: string[];
  prevention?: string[];
  recommendation?: string; // older single-text field from spec §3.14, shown if the lists are empty
  createdAt: string;
}

export type FrostRisk = "NONE" | "LOW" | "MEDIUM" | "HIGH";

/** GET /weather/conditions?lat=&lon= */
export interface WeatherConditions {
  soilTemp6cm: number; // °C at 6 cm
  airTemp?: number; // °C now
  frostRisk: FrostRisk;
  minTempNext7d?: number; // °C, lowest forecast night
  rainNext24hMm: number;
  rainNext7dMm?: number;
  observedAt?: string;
  /** Not returned yet: the 7-day ForecastCard needs a small /conditions extension. Shown when present. */
  daily?: { date: string; tempMax: number; tempMin: number; rainMm: number }[];
}

export type PlantingMethod = "SOW_INDOORS" | "SOW_OUTDOORS" | "PLANT_OUT";

export interface CropAdvice {
  crop: string;
  method?: PlantingMethod;
  minSoilTemp?: number; // °C the crop needs
  blockers: string[]; // why not today, e.g. "Soil is 7°C; needs 10°C"
  warnings: string[]; // OK to go, but watch out, e.g. "Frost possible on Thursday night: fleece it"
  notes?: string;
}

/** GET /weather/planting?lat=&lon= — the 35-crop calendar lives in the AI service. */
export interface PlantingAdvice {
  readyToPlantOut: CropAdvice[];
  readyToSow: CropAdvice[];
  notReady?: CropAdvice[]; // crops with blockers
}
