import type { Donation, Meal, MealOrder, Message, Notification, Order, Organisation, Product, Surplus, User } from "@/lib/types/api";

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
  createdAt: at(-180, 8),
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

// Extra photos per product (cover first). Farm shots fill the frame; cut-outs sit on a tint.
const PHOTOS: Record<string, string[]> = {
  "/images/crate-surplus-cut.webp": ["/images/step-pack-wide.webp", "/images/crate-stack-cut.webp", "/images/harvest-hands.webp"],
  "/images/carrots-cut.webp": ["/images/harvest-hands.webp", "/images/crate-veg-cut.webp", "/images/greenhouse.webp"],
  "/images/eggs-cut.webp": ["/images/step-pack-wide.webp", "/images/step-door-wide.webp"],
  "/images/beetroot-cut.webp": ["/images/crate-veg-cut.webp", "/images/harvest-hands.webp", "/images/step-list-wide.webp"],
  "/images/strawberries-cut.webp": ["/images/crate-fruit-cut.webp", "/images/greenhouse.webp"],
  "/images/crate-veg-cut.webp": ["/images/step-pack-wide.webp", "/images/harvest-hands.webp", "/images/step-door-wide.webp", "/images/greenhouse.webp"],
  "/images/crate-fruit-cut.webp": ["/images/strawberries-cut.webp", "/images/step-pack-wide.webp", "/images/step-load-wide.webp"],
  "/images/crate-stack-cut.webp": ["/images/crate-veg-cut.webp", "/images/step-pack-wide.webp", "/images/step-door-wide.webp", "/images/hero.webp"],
  "/images/bag-cut.webp": ["/images/crate-surplus-cut.webp", "/images/step-load-wide.webp"],
};
const withPhotos = (p: Product): Product => ({ ...p, imageUrls: p.imageUrls ?? (p.coverImageUrl ? PHOTOS[p.coverImageUrl] : undefined) });
products.forEach((p, i) => (products[i] = withPhotos(p)));

// ───────── Customer side ─────────

export const customer: User = {
  createdAt: at(-50, 19),
  id: 501,
  fullName: "Amara Okafor",
  email: "amara.okafor@example.com",
  role: "CUSTOMER",
  phoneNumber: "07700 900123",
  address: "14 Fishergate Hill",
  city: "Preston",
  postcode: "PR1 8JA",
  country: "United Kingdom",
};

const farms = {
  ribble: { farmerId: 11, farmerName: "Ribble Fruit", pickupAddress: "Ribble Fruit, Longridge PR3 3XL" },
  moss: { farmerId: 12, farmerName: "Moss Lane Farm", pickupAddress: "Moss Lane Farm, Ormskirk L39 4TA" },
  fylde: { farmerId: 13, farmerName: "Fylde Growers", pickupAddress: "Fylde Growers, Kirkham PR4 2AB" },
  bowland: { farmerId: 14, farmerName: "Bowland Dairy", pickupAddress: "Bowland Dairy, Clitheroe BB7 3DA" },
};

/** Everything listed on the marketplace: Hollins Farm's products plus other farms in the North West. */
export const marketplaceBase: Product[] = [
  ...products.filter((p) => p.quantityAvailable > 0 && (!p.bestBeforeDate || p.bestBeforeDate >= iso(0))),
  { id: 201, name: "Seasonal fruit box", category: "Fruit", price: 15, quantityAvailable: 18, bestBeforeDate: iso(7), coverImageUrl: "/images/crate-fruit-cut.webp", tags: ["Weekly", "Apples, pears, berries"], description: "Whatever's best from our orchards this week. Usually apples, pears and plums, with berries in summer.", createdAt: at(-14, 9), ...farms.ribble },
  { id: 202, name: "Strawberries", category: "Fruit", price: 3.2, quantityAvailable: 40, bestBeforeDate: iso(3), coverImageUrl: "/images/strawberries-cut.webp", tags: ["400 g punnet"], description: "Picked in the morning, packed by lunchtime.", createdAt: at(-2, 7), ...farms.ribble },
  { id: 203, name: "Surplus veg box", category: "Vegetables", price: 9, quantityAvailable: 14, bestBeforeDate: iso(4), coverImageUrl: "/images/crate-surplus-cut.webp", tags: ["Surplus", "Serves 2 to 3"], description: "Good produce that missed its order. Potatoes, onions and roots, at a lower price so nothing goes to waste.", createdAt: at(-1, 15), ...farms.moss },
  { id: 204, name: "Free-range eggs", category: "Dairy", price: 3.1, quantityAvailable: 90, bestBeforeDate: iso(12), coverImageUrl: "/images/eggs-cut.webp", tags: ["Box of 6"], description: "Large eggs from hens on pasture.", createdAt: at(-3, 8), ...farms.moss },
  { id: 205, name: "Rainbow carrots", category: "Vegetables", price: 1.9, quantityAvailable: 35, bestBeforeDate: iso(10), coverImageUrl: "/images/carrots-cut.webp", tags: ["Bunched"], description: "Orange, purple and yellow carrots, bunched with tops.", createdAt: at(-6, 10), ...farms.fylde },
  { id: 206, name: "Beetroot", category: "Vegetables", price: 1.3, quantityAvailable: 0, bestBeforeDate: iso(15), coverImageUrl: "/images/beetroot-cut.webp", tags: ["Bunched"], createdAt: at(-8, 10), ...farms.fylde },
  { id: 207, name: "Family veg box", category: "Vegetables", price: 22, quantityAvailable: 25, bestBeforeDate: iso(6), coverImageUrl: "/images/crate-stack-cut.webp", tags: ["Weekly", "Serves 4 to 5"], description: "A bigger box for families: roots, greens, salad and a little fruit.", createdAt: at(-20, 9), ...farms.fylde },
  { id: 208, name: "Surplus grocery bag", category: "Other", price: 6.5, quantityAvailable: 9, bestBeforeDate: iso(2), coverImageUrl: "/images/bag-cut.webp", tags: ["Surplus", "Mixed"], description: "A mixed bag of surplus from farms on today's route: greens, peppers, eggs and more.", createdAt: at(0, 8), ...farms.bowland },
];

export const marketplace = marketplaceBase.map(withPhotos);

export const customerOrders: Order[] = [
  { id: 2101, productId: 106, productName: "Mixed veg box", quantity: 2, status: "IN_TRANSIT", paymentStatus: "PAID", driverId: 901, driverName: "Grace Moore", d: 0, h: 9 },
  { id: 2098, productId: 202, productName: "Strawberries", quantity: 2, status: "ASSIGNED", paymentStatus: "PAID", driverId: 900, driverName: "Sam Patel", d: 0, h: 8 },
  { id: 2087, productId: 204, productName: "Free-range eggs", quantity: 1, status: "DELIVERED", paymentStatus: "PAID", driverId: 902, driverName: "Leo Hughes", d: -4, h: 11 },
  { id: 2072, productId: 207, productName: "Family veg box", quantity: 1, status: "DELIVERED", paymentStatus: "PAID", driverId: 901, driverName: "Grace Moore", d: -11, h: 10 },
  { id: 2060, productId: 203, productName: "Surplus veg box", quantity: 1, status: "CANCELLED", paymentStatus: "REFUNDED", driverId: null, driverName: null, d: -16, h: 14 },
].map(({ d, h, ...o }) => ({ ...o, customerId: customer.id, customerName: customer.fullName, createdAt: at(d, h, 12) }) as Order);

export const customerNotifications: Notification[] = [
  { id: 41, recipientId: customer.id, type: "ORDER_UPDATE", message: "Grace Moore is on the way with your Mixed veg box", read: false, createdAt: at(0, 10, 5) },
  { id: 42, recipientId: customer.id, type: "ORDER_UPDATE", message: "Ribble Fruit packed your strawberries", read: false, createdAt: at(0, 8, 40) },
  { id: 43, recipientId: customer.id, type: "SYSTEM", message: "New this week: surplus boxes from Moss Lane Farm", read: true, createdAt: at(-1, 17) },
];

// ───────── Driver side ─────────

export const driver: User = {
  createdAt: at(-80, 10),
  id: 900,
  fullName: "Sam Patel",
  email: "sam.patel@example.com",
  role: "DRIVER",
  phoneNumber: "07700 900456",
  address: "3 Deepdale Road",
  city: "Preston",
  postcode: "PR1 6PA",
  country: "United Kingdom",
};

/** Where each customer's order goes. Illustrative addresses around Preston and Lancaster. */
export const deliveryAddresses: Record<string, string> = {
  "Amara Okafor": "14 Fishergate Hill, Preston PR1 8JA",
  "The Pantry, Preston": "22 Winckley Square, Preston PR1 3JJ",
  "Ben Whitfield": "8 Garstang Road, Broughton PR3 5JB",
  "Lancaster Uni Catering": "Bailrigg House, Lancaster LA1 4YW",
  "Priya Shah": "41 Watling Street Road, Fulwood PR2 8BP",
  "Moss Lane Café": "2 Market Place, Garstang PR3 1ZA",
  "Jack Riley": "17 Ribbleton Avenue, Preston PR1 5RP",
  "Sophie Turner": "5 Station Road, Kirkham PR4 2HA",
  "Ribble Valley Deli": "12 King Street, Clitheroe BB7 2EP",
  "Hannah Lewis": "29 Moor Lane, Lancaster LA1 1QD",
  "St Mary's Food Bank": "St Mary's Hall, Friargate, Preston PR1 2EE",
};

// ───────── Organisation side ─────────

export const orgUser: User = {
  createdAt: at(-120, 9),
  id: 601,
  fullName: "Ruth Ellis",
  email: "ruth@stmarysfoodbank.org.uk",
  role: "ORGANISATION",
  phoneNumber: "01772 000123",
  address: "St Mary's Hall, Friargate",
  city: "Preston",
  postcode: "PR1 2EE",
  country: "United Kingdom",
};

export const organisation: Organisation = {
  id: 61,
  name: "St Mary's Food Bank",
  type: "FOODBANK",
  charityNumber: "1123456",
  verificationLevel: "VERIFIED",
  userId: orgUser.id,
  createdAt: at(-120, 10),
  description: "Weekly food parcels for around 80 households in central Preston.",
};

const ORG = { organisationId: organisation.id, organisationName: organisation.name };
const enrich = (productId: number) => {
  const p = [...products, ...marketplace].find((x) => x.id === productId)!;
  return { productName: p.name, farmerId: p.farmerId, farmerName: p.farmerName, coverImageUrl: p.coverImageUrl, bestBeforeDate: p.bestBeforeDate, pickupAddress: p.pickupAddress };
};

export const donations: Donation[] = [
  // Hollins Farm's own donations (farmer view)
  { id: 401, productId: 108, quantity: 5, status: "PENDING", createdAt: at(0, 8, 30), note: "Leaves a little wilted, fine for cooking.", ...enrich(108) },
  { id: 402, productId: 103, quantity: 24, status: "CLAIMED", createdAt: at(-2, 9), ...ORG, ...enrich(103) },
  { id: 403, productId: 101, quantity: 30, status: "DELIVERED", createdAt: at(-8, 10), organisationId: 62, organisationName: "Preston Community Pantry", ...enrich(101) },
  { id: 404, productId: 107, quantity: 4, status: "DELIVERED", createdAt: at(-15, 14), ...ORG, ...enrich(107) },
  // Other farms, open for food groups to claim
  { id: 411, productId: 203, quantity: 12, status: "PENDING", createdAt: at(0, 7, 15), note: "Mixed roots, all sound.", ...enrich(203) },
  { id: 412, productId: 205, quantity: 20, status: "PENDING", createdAt: at(-1, 16), ...enrich(205) },
  { id: 413, productId: 201, quantity: 6, status: "PENDING", createdAt: at(-1, 11), ...enrich(201) },
  { id: 414, productId: 204, quantity: 36, status: "PENDING", createdAt: at(0, 6, 50), note: "Odd sizes, fully fresh.", ...enrich(204) },
  // Earlier claims by St Mary's
  { id: 420, productId: 207, quantity: 5, status: "IN_DELIVERY", createdAt: at(-1, 9), ...ORG, ...enrich(207) },
  { id: 421, productId: 202, quantity: 10, status: "DELIVERED", createdAt: at(-9, 8), ...ORG, ...enrich(202) },
];

/** Surplus across all farms, for food groups to browse (spec §7.10 /surplus). */
export const otherSurplus: Surplus[] = [
  { id: 311, productId: 203, quantity: 10, availableQuantity: 10, createdAt: at(0, 9), ...enrich(203) },
  { id: 312, productId: 205, quantity: 20, availableQuantity: 14, createdAt: at(-1, 13), ...enrich(205) },
  { id: 313, productId: 201, quantity: 6, availableQuantity: 6, createdAt: at(-1, 10), ...enrich(201) },
  { id: 314, productId: 208, quantity: 8, availableQuantity: 8, createdAt: at(0, 8, 20), ...enrich(208) },
];

// ───────── Messages (spec §3.12) ─────────

/** Everyone the demo knows, so threads show names. */
export const people: Record<number, { name: string; role: string }> = {
  7: { name: "Tom Hollins", role: "Hollins Farm" },
  11: { name: "Ribble Fruit", role: "Farm" },
  12: { name: "Moss Lane Farm", role: "Farm" },
  501: { name: "Amara Okafor", role: "Customer" },
  503: { name: "Lancaster Uni Catering", role: "Customer" },
  601: { name: "Ruth Ellis", role: "St Mary's Food Bank" },
  801: { name: "Lena Brooks", role: "Fishergate Kitchen" },
  900: { name: "Sam Patel", role: "Driver" },
  901: { name: "Grace Moore", role: "Driver" },
};

const msg = (id: number, from: number, to: number, content: string, d: number, h: number, m: number, read = true): Message => ({
  id,
  senderId: from,
  senderName: people[from]?.name,
  recipientId: to,
  recipientName: people[to]?.name,
  content,
  read,
  createdAt: at(d, h, m),
});

export const messages: Message[] = [
  // Farmer ↔ driver
  msg(1, 900, 7, "Morning Tom, I'm picking up the potatoes for Lancaster Uni around 2. Is the yard gate open?", 0, 9, 12),
  msg(2, 7, 900, "Yes, gate's open. Crates are by the barn door, 25 kg labelled.", 0, 9, 20),
  msg(3, 900, 7, "Perfect, thanks. Will message when I'm on the way.", 0, 9, 22, false),
  // Farmer ↔ food bank
  msg(4, 601, 7, "Thank you for the eggs on Tuesday. They went out in Thursday's parcels.", -1, 15, 4),
  msg(5, 7, 601, "Glad they helped. I've got kale coming up spare this week if that's useful.", -1, 15, 30),
  msg(6, 601, 7, "Yes please, we'll claim it as soon as it's listed.", 0, 8, 41, false),
  // Farmer ↔ customer
  msg(7, 503, 7, "Could we move next week's potato order to Wednesday?", -2, 11, 0),
  msg(8, 7, 503, "No problem, Wednesday works.", -2, 11, 45),
  // Customer ↔ driver / farm
  msg(9, 901, 501, "Hi Amara, I'm about 10 minutes away with your veg box.", 0, 10, 5, false),
  msg(10, 501, 11, "Are the strawberries this week sweet ones?", -1, 18, 2),
  msg(11, 11, 501, "Very! First pick of the new beds.", -1, 18, 30),
  // Driver ↔ customer
  msg(12, 900, 501, "I've got your strawberries, I'll be with you after my Fulwood drop.", 0, 8, 50),
  // Food bank ↔ farm
  msg(13, 12, 601, "We've put a box of roots up as a donation if St Mary's wants it.", 0, 7, 20, false),
  // Kitchen ↔ farm / customer
  msg(14, 801, 7, "Could you hold 20 kg of Maris Pipers for Thursday? Hotpot's been flying.", -1, 16, 10),
  msg(15, 7, 801, "Can do. I'll put them aside, collect any time after 9.", -1, 16, 40),
  msg(16, 501, 801, "Is the hotpot OK to reheat the next day?", 0, 11, 50, false),
];

export const driverNotifications: Notification[] = [
  { id: 61, recipientId: driver.id, type: "ORDER_UPDATE", message: "3 new jobs near Garstang are waiting for a driver", read: false, createdAt: at(0, 11, 10) },
  { id: 62, recipientId: driver.id, type: "ORDER_UPDATE", message: "Lancaster Uni Catering's order is ready to collect at Hollins Farm", read: false, createdAt: at(0, 9, 5) },
  { id: 63, recipientId: driver.id, type: "SYSTEM", message: "Your documents were approved. You can take jobs now.", read: true, createdAt: at(-6, 12) },
];

export const orgNotifications: Notification[] = [
  { id: 71, recipientId: orgUser.id, type: "DONATION_UPDATE", message: "Moss Lane Farm donated 12 × Surplus veg box near you", read: false, createdAt: at(0, 7, 16) },
  { id: 72, recipientId: orgUser.id, type: "SURPLUS_ALERT", message: "New surplus: 8 × Surplus grocery bag from Bowland Dairy", read: false, createdAt: at(0, 8, 21) },
  { id: 73, recipientId: orgUser.id, type: "DONATION_UPDATE", message: "Your Family veg box donation is on its way with Grace Moore", read: true, createdAt: at(-1, 10) },
];

/** Deliveries booked through "claim and request delivery" (spec §3.9 claim-and-order). */
export const donationOrders: Order[] = [
  { id: 2201, productId: 207, productName: "Family veg box", quantity: 5, customerId: orgUser.id, customerName: organisation.name, driverId: 901, driverName: "Grace Moore", status: "IN_TRANSIT", paymentStatus: "PAID", createdAt: at(-1, 9, 30), donationId: 420 },
];

// ───────── Kitchen side (NomadEat) ─────────

export const kitchenUser: User = {
  createdAt: at(-60, 12),
  id: 801,
  fullName: "Lena Brooks",
  email: "lena@fishergatekitchen.co.uk",
  role: "KITCHEN",
  phoneNumber: "01772 000456",
  address: "9 Fishergate",
  city: "Preston",
  postcode: "PR1 2NJ",
  country: "United Kingdom",
};

const KITCHENS: Record<number, { name: string; area: string }> = {
  801: { name: "Fishergate Kitchen", area: "Preston" },
  802: { name: "Ribble Valley Cooks", area: "Clitheroe" },
  803: { name: "Campus Kitchen", area: "Lancaster" },
};
const meal = (id: number, kitchenId: number, m: Omit<Meal, "id" | "kitchenId" | "kitchenName" | "kitchenArea" | "imageUrls" | "available"> & { available?: boolean }, d = -3): Meal => ({
  id,
  kitchenId,
  kitchenName: KITCHENS[kitchenId].name,
  kitchenArea: KITCHENS[kitchenId].area,
  imageUrls: [],
  available: true,
  createdAt: at(d, 10),
  ...m,
});

export const meals: Meal[] = [
  meal(701, 801, { name: "Lancashire hotpot", cuisine: "British", price: 7.5, portionsAvailable: 14, description: "Slow-cooked lamb and onion under sliced Maris Pipers, the classic way. Serves one generously.", dietary: [], farms: ["Hollins Farm"] }),
  meal(702, 801, { name: "Roast root veg & lentil bowl", cuisine: "British", price: 6, portionsAvailable: 3, description: "Roast carrots, beetroot and squash over herby green lentils with a tahini dressing.", dietary: ["Vegan", "Gluten-free"], farms: ["Hollins Farm", "Fylde Growers"] }),
  meal(703, 801, { name: "Jollof rice & chicken", cuisine: "West African", price: 8, portionsAvailable: 10, description: "Smoky party jollof with grilled chicken thigh and fried plantain.", dietary: ["Halal", "Dairy-free"], farms: [] }),
  meal(704, 801, { name: "Kale & potato soup", cuisine: "British", price: 4.5, portionsAvailable: 0, description: "Hearty kale and potato soup with crusty bread from the bakery next door.", dietary: ["Vegetarian"], farms: ["Hollins Farm"], available: false }),
  meal(711, 802, { name: "Chicken & leek pie", cuisine: "British", price: 7, portionsAvailable: 8, description: "Shortcrust pie with free-range chicken, leeks and a creamy thyme sauce.", dietary: [], farms: ["Moss Lane Farm"] }),
  meal(712, 802, { name: "Strawberry Eton mess", cuisine: "Dessert", price: 3.5, portionsAvailable: 12, description: "Crushed meringue, cream and this week's Ribble Valley strawberries.", dietary: ["Vegetarian", "Gluten-free"], farms: ["Ribble Fruit"] }),
  meal(721, 803, { name: "Chickpea & spinach curry", cuisine: "South Asian", price: 5, portionsAvailable: 20, description: "Mild coconut curry with basmati rice. Built for students and big batches.", dietary: ["Vegan", "Halal"], farms: [] }),
  meal(722, 803, { name: "Veg box lasagne", cuisine: "Italian", price: 6.5, portionsAvailable: 9, description: "Layered with whatever's best in the Fylde veg box this week, plus a rich tomato ragù.", dietary: ["Vegetarian"], farms: ["Fylde Growers"] }),
];

export const mealOrders: MealOrder[] = [
  { id: 5101, mealId: 701, mealName: "Lancashire hotpot", quantity: 2, total: 15, customerId: 501, customerName: "Amara Okafor", kitchenId: 801, kitchenName: "Fishergate Kitchen", status: "NEW", createdAt: at(0, 11, 42) },
  { id: 5102, mealId: 703, mealName: "Jollof rice & chicken", quantity: 4, total: 32, customerId: 507, customerName: "Jack Riley", kitchenId: 801, kitchenName: "Fishergate Kitchen", status: "NEW", createdAt: at(0, 11, 5), note: "Extra plantain if you can" },
  { id: 5103, mealId: 702, mealName: "Roast root veg & lentil bowl", quantity: 1, total: 6, customerId: 504, customerName: "Priya Shah", kitchenId: 801, kitchenName: "Fishergate Kitchen", status: "PREPARING", createdAt: at(0, 10, 20) },
  { id: 5104, mealId: 701, mealName: "Lancashire hotpot", quantity: 3, total: 22.5, customerId: 509, customerName: "Hannah Lewis", kitchenId: 801, kitchenName: "Fishergate Kitchen", status: "READY", createdAt: at(0, 9, 30) },
  { id: 5105, mealId: 703, mealName: "Jollof rice & chicken", quantity: 2, total: 16, customerId: 506, customerName: "Sophie Turner", kitchenId: 801, kitchenName: "Fishergate Kitchen", status: "COLLECTED", createdAt: at(-1, 18, 10) },
  { id: 5106, mealId: 702, mealName: "Roast root veg & lentil bowl", quantity: 5, total: 30, customerId: 503, customerName: "Lancaster Uni Catering", kitchenId: 801, kitchenName: "Fishergate Kitchen", status: "COLLECTED", createdAt: at(-2, 12) },
  { id: 5107, mealId: 712, mealName: "Strawberry Eton mess", quantity: 2, total: 7, customerId: 501, customerName: "Amara Okafor", kitchenId: 802, kitchenName: "Ribble Valley Cooks", status: "COLLECTED", createdAt: at(-3, 19) },
];

export const kitchenNotifications: Notification[] = [
  { id: 81, recipientId: kitchenUser.id, type: "ORDER_UPDATE", message: "New order: 4 × Jollof rice & chicken from Jack Riley", read: false, createdAt: at(0, 11, 5) },
  { id: 82, recipientId: kitchenUser.id, type: "SYSTEM", message: "Only 3 portions of Roast root veg & lentil bowl left", read: false, createdAt: at(0, 10, 30) },
  { id: 83, recipientId: kitchenUser.id, type: "SURPLUS_ALERT", message: "Hollins Farm has surplus potatoes. Good for tomorrow's hotpot.", read: true, createdAt: at(-1, 8) },
];

// ───────── Admin ─────────

export const adminUser: User = { id: 1, fullName: "Alex Morgan", email: "admin@farmnomad.co.uk", role: "ADMIN", city: "Preston", country: "United Kingdom", createdAt: at(-200, 9) };

const u = (id: number, fullName: string, email: string, role: User["role"], city: string, joined: number): User => ({ id, fullName, email, role, city, country: "United Kingdom", createdAt: at(joined, 10 + (id % 8), (id * 7) % 60) });

/** Everyone else on the platform, for the admin user list. Illustrative people only. */
export const directory: User[] = [
  u(11, "Ribble Fruit", "hello@ribblefruit.co.uk", "FARMER", "Longridge", -150),
  u(12, "Moss Lane Farm", "info@mosslanefarm.co.uk", "FARMER", "Ormskirk", -140),
  u(13, "Fylde Growers", "team@fyldegrowers.co.uk", "FARMER", "Kirkham", -96),
  u(14, "Bowland Dairy", "dairy@bowland.co.uk", "FARMER", "Clitheroe", -12),
  u(502, "The Pantry, Preston", "orders@thepantrypreston.co.uk", "CUSTOMER", "Preston", -88),
  u(503, "Lancaster Uni Catering", "catering@lancs-uni.example", "CUSTOMER", "Lancaster", -75),
  u(504, "Priya Shah", "priya.shah@example.com", "CUSTOMER", "Fulwood", -40),
  u(505, "Ben Whitfield", "ben.w@example.com", "CUSTOMER", "Broughton", -33),
  u(506, "Sophie Turner", "sophie.t@example.com", "CUSTOMER", "Kirkham", -21),
  u(507, "Jack Riley", "jack.riley@example.com", "CUSTOMER", "Preston", -9),
  u(509, "Hannah Lewis", "hannah.lewis@example.com", "CUSTOMER", "Lancaster", -3),
  u(510, "Tariq Hussain", "tariq.h@example.com", "CUSTOMER", "Preston", 0),
  u(901, "Grace Moore", "grace.moore@example.com", "DRIVER", "Preston", -60),
  u(902, "Tomasz Nowak", "tomasz.n@example.com", "DRIVER", "Chorley", -5),
  u(602, "Dev Patel", "dev@prestonpantry.org.uk", "ORGANISATION", "Preston", -110),
  u(603, "Sian Hughes", "foodcoop@lancsu.example", "ORGANISATION", "Lancaster", -2),
  u(604, "Mark Ellison", "office@ashtonprimary.example", "ORGANISATION", "Preston", -1),
  u(605, "Yusuf Ali", "yusuf@avenhamfoodshare.org.uk", "ORGANISATION", "Preston", 0),
  u(802, "Ribble Valley Cooks", "cooks@ribblevalley.example", "KITCHEN", "Clitheroe", -45),
  u(803, "Campus Kitchen", "kitchen@campus.example", "KITCHEN", "Lancaster", -30),
];

/** Other organisations, for the verification queue. */
export const otherOrganisations: Organisation[] = [
  { id: 62, name: "Preston Community Pantry", type: "FOODBANK", charityNumber: "1187654", verificationLevel: "VERIFIED", userId: 602, createdAt: at(-110, 11), description: "Community pantry open three days a week." },
  { id: 63, name: "Lancaster SU Food Co-op", type: "STUDENT_GROUP", verificationLevel: "PENDING", userId: 603, createdAt: at(-2, 15, 20), description: "Student-run co-op giving out free veg bags on campus every Friday." },
  { id: 64, name: "Ashton Primary Breakfast Club", type: "SCHOOL", verificationLevel: "PENDING", userId: 604, createdAt: at(-1, 9, 40), description: "Free breakfast for around 60 pupils before school." },
  { id: 65, name: "Avenham Faith Food Share", type: "RELIGIOUS", charityNumber: "1201133", verificationLevel: "PENDING", userId: 605, createdAt: at(0, 8, 5), description: "Weekly hot meals and food parcels run by local faith groups." },
];
