import type { Notification, Order, Product, Surplus, User } from "@/lib/types/api";

// Sample data for the signed-in farmer. Names are illustrative.
// Dates are generated relative to today so best-before warnings always look current.

const today = new Date();
const iso = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};
const at = (offsetDays: number, h: number, m = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const me: User = {
  id: 7,
  fullName: "Tom Hollins",
  email: "tom@hollinsfarm.co.uk",
  role: "FARMER",
  city: "Garstang",
  postcode: "PR3 1ZA",
  country: "United Kingdom",
};

const FARM = { farmerId: me.id, farmerName: "Hollins Farm", pickupAddress: "Hollins Farm, Moss Lane, Garstang PR3 1ZA" };

export const products: Product[] = [
  { id: 101, name: "Maris Piper potatoes", category: "Vegetables", price: 1.2, quantityAvailable: 46, bestBeforeDate: iso(21), coverImageUrl: "/images/crate-surplus-cut.webp", tags: ["Loose", "Per kg"], description: "Floury all-rounders, washed and graded.", createdAt: at(-30, 9), ...FARM },
  { id: 102, name: "Chantenay carrots", category: "Vegetables", price: 1.6, quantityAvailable: 8, bestBeforeDate: iso(9), coverImageUrl: "/images/carrots-cut.webp", tags: ["Bunched"], description: "Short, sweet carrots sold in bunches with tops.", createdAt: at(-12, 10), ...FARM },
  { id: 103, name: "Free-range eggs", category: "Dairy", price: 2.8, quantityAvailable: 64, bestBeforeDate: iso(2), coverImageUrl: "/images/eggs-cut.webp", tags: ["Box of 6"], description: "Mixed sizes from hens on pasture.", createdAt: at(-5, 8), ...FARM },
  { id: 104, name: "Beetroot", category: "Vegetables", price: 1.4, quantityAvailable: 32, bestBeforeDate: iso(14), coverImageUrl: "/images/beetroot-cut.webp", tags: ["Bunched"], createdAt: at(-9, 11), ...FARM },
  { id: 105, name: "Strawberries", category: "Fruit", price: 3.5, quantityAvailable: 0, bestBeforeDate: iso(1), coverImageUrl: "/images/strawberries-cut.webp", tags: ["400 g punnet"], createdAt: at(-3, 7), ...FARM },
  { id: 106, name: "Mixed veg box", category: "Vegetables", price: 18, quantityAvailable: 22, bestBeforeDate: iso(6), coverImageUrl: "/images/crate-veg-cut.webp", tags: ["Weekly", "Serves 3 to 4"], createdAt: at(-40, 9), ...FARM },
  { id: 107, name: "Orchard fruit box", category: "Fruit", price: 16, quantityAvailable: 12, bestBeforeDate: iso(-1), coverImageUrl: "/images/crate-fruit-cut.webp", tags: ["Weekly"], createdAt: at(-20, 9), ...FARM },
  { id: 108, name: "Curly kale", category: "Vegetables", price: 1.1, quantityAvailable: 5, bestBeforeDate: iso(3), coverImageUrl: "/images/crate-veg-cut.webp", tags: ["200 g bag"], createdAt: at(-4, 12), ...FARM },
];

const customers = ["Amara Okafor", "The Pantry, Preston", "Ben Whitfield", "Lancaster Uni Catering", "Priya Shah", "Moss Lane Café", "Jack Riley", "Sophie Turner", "Ribble Valley Deli", "Hannah Lewis"];
const drivers = ["Sam Patel", "Grace Moore", "Leo Hughes"];

let oid = 2030;
export const orders: Order[] = [
  // Today
  { status: "PENDING", d: 0, h: 11, p: 106, q: 2, c: 0, pay: "PAID" },
  { status: "PENDING", d: 0, h: 10, p: 102, q: 4, c: 1, pay: "PAID" },
  { status: "PENDING", d: 0, h: 9, p: 103, q: 6, c: 2, pay: "UNPAID" },
  { status: "ASSIGNED", d: 0, h: 8, p: 101, q: 25, c: 3, pay: "PAID", drv: 0 },
  { status: "IN_TRANSIT", d: 0, h: 7, p: 106, q: 1, c: 4, pay: "PAID", drv: 1 },
  { status: "IN_TRANSIT", d: -1, h: 16, p: 104, q: 3, c: 5, pay: "PAID", drv: 2 },
  // Earlier
  { status: "DELIVERED", d: -1, h: 12, p: 106, q: 1, c: 6, pay: "PAID", drv: 0 },
  { status: "DELIVERED", d: -2, h: 15, p: 103, q: 12, c: 8, pay: "PAID", drv: 1 },
  { status: "DELIVERED", d: -3, h: 10, p: 101, q: 40, c: 3, pay: "PAID", drv: 2 },
  { status: "DELIVERED", d: -4, h: 9, p: 107, q: 2, c: 7, pay: "PAID", drv: 0 },
  { status: "CANCELLED", d: -5, h: 14, p: 105, q: 3, c: 9, pay: "REFUNDED" },
  { status: "DELIVERED", d: -6, h: 11, p: 102, q: 6, c: 1, pay: "PAID", drv: 1 },
].map((o) => {
  const p = products.find((x) => x.id === o.p)!;
  const id = ++oid;
  return {
    id,
    productId: p.id,
    productName: p.name,
    quantity: o.q,
    customerId: 500 + o.c,
    customerName: customers[o.c],
    driverId: o.drv !== undefined ? 900 + o.drv : null,
    driverName: o.drv !== undefined ? drivers[o.drv] : null,
    status: o.status as Order["status"],
    paymentStatus: o.pay as Order["paymentStatus"],
    createdAt: at(o.d, o.h, (id * 7) % 60),
  };
});

export const surplus: Surplus[] = [
  { id: 301, productId: 107, productName: "Orchard fruit box", quantity: 6, availableQuantity: 6, createdAt: at(-1, 15) },
  { id: 302, productId: 103, productName: "Free-range eggs", quantity: 24, availableQuantity: 12, createdAt: at(-1, 9) },
  { id: 303, productId: 101, productName: "Maris Piper potatoes", quantity: 40, availableQuantity: 0, createdAt: at(-6, 10) },
];

export const notifications: Notification[] = [
  { id: 1, recipientId: me.id, type: "ORDER_UPDATE", message: "New order: 2 × Mixed veg box from Amara Okafor", read: false, createdAt: at(0, 11, 4) },
  { id: 2, recipientId: me.id, type: "SURPLUS_ALERT", message: "St Mary's food bank claimed 12 × Free-range eggs", read: false, createdAt: at(0, 9, 40) },
  { id: 3, recipientId: me.id, type: "ORDER_UPDATE", message: "Grace Moore collected order FN-2035", read: true, createdAt: at(0, 7, 20) },
  { id: 4, recipientId: me.id, type: "SYSTEM", message: "Payout of £412.80 sent to your bank", read: true, createdAt: at(-1, 18) },
];

/** Daily revenue for the last 90 days, shaped like a real farm: weekend peaks, a slow rise. */
export const revenueSeries = Array.from({ length: 90 }, (_, i) => {
  const day = new Date(today);
  day.setDate(day.getDate() - (89 - i));
  const dow = day.getDay();
  const base = 28 + i * 0.55;
  const weekend = dow === 5 || dow === 6 ? 1.7 : dow === 0 ? 0.6 : 1;
  const wobble = Math.sin(i * 1.7) * 7 + Math.cos(i * 0.45) * 5;
  return { date: day.toISOString().slice(0, 10), value: Math.max(6, Math.round((base * weekend + wobble) * 100) / 100) };
});
