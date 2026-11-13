import type { CartItem, Donation, Message, MockRole, Order, OrderStatus, Organisation, Product, ProductInput, Surplus, User } from "@/lib/types/api";
import * as db from "./db";

// Copies of the sample data. Saved to the browser after every change so a reload (or the
// Stripe-style redirect at checkout) keeps your cart, orders and edits.
const KEY = "fn_mock_v2";
const fresh = () => ({
  products: structuredClone(db.products) as Product[],
  orders: structuredClone(db.orders) as Order[],
  surplus: structuredClone(db.surplus) as Surplus[],
  notifications: structuredClone(db.notifications),
  marketplace: structuredClone(db.marketplace) as Product[],
  customerOrders: structuredClone(db.customerOrders) as Order[],
  customer: structuredClone(db.customer) as User,
  customerNotifications: structuredClone(db.customerNotifications),
  cart: [] as CartItem[],
  sessions: {} as Record<string, CartItem[]>,
  farmer: structuredClone(db.me) as User,
  driver: structuredClone(db.driver) as User,
  orgUser: structuredClone(db.orgUser) as User,
  organisation: structuredClone(db.organisation) as Organisation | null,
  donations: structuredClone(db.donations) as Donation[],
  otherSurplus: structuredClone(db.otherSurplus) as Surplus[],
  donationOrders: structuredClone(db.donationOrders) as Order[],
  messages: structuredClone(db.messages) as Message[],
  driverNotifications: structuredClone(db.driverNotifications),
  orgNotifications: structuredClone(db.orgNotifications),
});
type State = ReturnType<typeof fresh>;
const load = (): State => {
  try {
    const raw = window.localStorage.getItem(KEY);
    // Sample dates are relative to today, so start fresh each day.
    const saved = raw ? (JSON.parse(raw) as Partial<State> & { day?: string }) : null;
    if (saved && saved.day === new Date().toDateString()) return { ...fresh(), ...saved };
  } catch {}
  return fresh();
};
const state: State = load();
const save = () => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...state, day: new Date().toDateString() }));
  } catch {}
};

/** The demo role lives in the browser so the same mock can show either side of the app. */
const role = (): MockRole => {
  try {
    const r = JSON.parse(window.localStorage.getItem("fn_role") ?? '"FARMER"');
    return ["CUSTOMER", "DRIVER", "ORGANISATION"].includes(r) ? r : "FARMER";
  } catch {
    return "FARMER";
  }
};
const meKey = { FARMER: "farmer", CUSTOMER: "customer", DRIVER: "driver", ORGANISATION: "orgUser" } as const;
const currentUser = () => state[meKey[role()]];
const notesKey = { FARMER: "notifications", CUSTOMER: "customerNotifications", DRIVER: "driverNotifications", ORGANISATION: "orgNotifications" } as const;

/** Every order a driver could see: farm orders, customer orders and donation deliveries. */
const pool = () => [...state.orders, ...state.customerOrders, ...state.donationOrders];
const forDriver = (o: Order): Order => {
  const p = productById(o.productId);
  return {
    ...o,
    farmerName: o.farmerName ?? p?.farmerName,
    pickupAddress: o.pickupAddress ?? p?.pickupAddress,
    deliveryAddress: o.deliveryAddress ?? db.deliveryAddresses[o.customerName] ?? (o.customerId === state.customer.id ? [state.customer.address, state.customer.city, state.customer.postcode].filter(Boolean).join(", ") : undefined),
  };
};
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { ASSIGNED: "IN_TRANSIT", IN_TRANSIT: "DELIVERED" };
const notify = (key: (typeof notesKey)[MockRole], message: string, type: "ORDER_UPDATE" | "DONATION_UPDATE" | "SURPLUS_ALERT" = "ORDER_UPDATE") => {
  const list = state[key];
  list.unshift({ id: Math.max(0, ...list.map((n) => n.id)) + 1000, recipientId: 0, type, message, read: false, createdAt: new Date().toISOString() });
};
const productById = (id: number) => state.marketplace.find((p) => p.id === id) ?? state.products.find((p) => p.id === id);
const withProduct = (i: CartItem): CartItem => ({ ...i, product: productById(i.productId) });
const bad = (message: string): Res => ({ error: { status: 400, data: { message } } });

type Req = { method: string; path: string; body?: unknown; params?: Record<string, string | number | undefined> };
type Res = { data: unknown } | { error: { status: number; data?: unknown } };

const notFound = (what: string): Res => ({ error: { status: 404, data: { message: `${what} not found` } } });
const nextId = (list: { id: number }[]) => Math.max(0, ...list.map((x) => x.id)) + 1;

const routes: [string, RegExp, (m: RegExpMatchArray, r: Req) => Res][] = [
  ["GET", /^\/users\/me$/, () => ({ data: currentUser() })],
  ["PUT", /^\/users\/(\d+)$/, (_, r) => {
    const k = meKey[role()];
    const u = state[k];
    state[k] = { ...u, ...(r.body as Partial<User>), id: u.id, role: u.role, email: u.email };
    return { data: state[k] };
  }],
  ["POST", /^\/auth\/change-password$/, (_, r) => {
    const { currentPassword, newPassword } = (r.body ?? {}) as { currentPassword?: string; newPassword?: string };
    if (!currentPassword) return bad("Enter your current password.");
    if (!newPassword || newPassword.length < 8) return bad("Use at least 8 characters.");
    return { data: { ok: true } };
  }],
  ["POST", /^\/auth\/login$/, (_, r) => {
    const { email, password } = (r.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) return bad("Enter your email and password.");
    if (password.length < 6) return { error: { status: 401, data: { message: "That email and password don't match." } } };
    return { data: { token: "mock-token" } };
  }],
  ["POST", /^\/auth\/forgot-password$/, (_, r) => {
    const { email } = (r.body ?? {}) as { email?: string };
    return email && /\S+@\S+\.\S+/.test(email) ? { data: { ok: true } } : bad("Enter a full email address.");
  }],
  ["POST", /^\/auth\/register$/, (_, r) => {
    const b = (r.body ?? {}) as { email?: string; password?: string; fullName?: string };
    if (!b.fullName || !b.email || !b.password) return bad("Fill in your name, email and password.");
    return { data: { ok: true } };
  }],

  // Marketplace (spec §7.5)
  ["GET", /^\/products$/, () => ({ data: state.marketplace })],
  ["GET", /^\/products\/(\d+)$/, (m) => {
    const p = productById(+m[1]);
    return p ? { data: p } : notFound("Product");
  }],

  // Cart (spec §3.6)
  ["GET", /^\/cart\/items$/, () => ({ data: state.cart.map(withProduct) })],
  ["POST", /^\/cart\/items$/, (_, r) => {
    const { productId, quantity } = r.body as { productId: number; quantity: number };
    const p = productById(productId);
    if (!p) return notFound("Product");
    const existing = state.cart.find((i) => i.productId === productId);
    const next = (existing?.quantity ?? 0) + quantity;
    if (next > p.quantityAvailable) return bad(`Only ${p.quantityAvailable} available.`);
    if (existing) existing.quantity = next;
    else state.cart.push({ id: nextId(state.cart), productId, quantity });
    return { data: withProduct(existing ?? state.cart[state.cart.length - 1]) };
  }],
  ["PUT", /^\/cart\/items\/(\d+)$/, (m, r) => {
    const item = state.cart.find((i) => i.id === +m[1]);
    if (!item) return notFound("Cart item");
    const q = Number(r.params?.quantity);
    const p = productById(item.productId);
    if (!Number.isInteger(q) || q < 1) return bad("Quantity must be at least 1.");
    if (p && q > p.quantityAvailable) return bad(`Only ${p.quantityAvailable} available.`);
    item.quantity = q;
    return { data: withProduct(item) };
  }],
  ["DELETE", /^\/cart\/items\/(\d+)$/, (m) => {
    const item = state.cart.find((i) => i.id === +m[1]);
    if (!item) return notFound("Cart item");
    state.cart = state.cart.filter((i) => i.id !== item.id);
    return { data: withProduct(item) };
  }],
  ["DELETE", /^\/cart\/clear$/, () => {
    state.cart = [];
    return { data: { ok: true } };
  }],

  // Checkout (spec §3.8). The real API returns a Stripe Checkout URL; the mock skips straight to success.
  ["POST", /^\/checkout\/create-session$/, () => {
    if (!state.cart.length) return bad("Your cart is empty.");
    const sessionId = `cs_test_${Date.now().toString(36)}`;
    state.sessions[sessionId] = structuredClone(state.cart);
    return { data: { sessionId, checkoutUrl: `/checkout/success?session_id=${sessionId}` } };
  }],
  ["POST", /^\/checkout\/confirm$/, (_, r) => {
    const id = String(r.params?.sessionId ?? "");
    const items = state.sessions[id];
    if (!items) {
      // Refresh on the success page: return the orders this session already created.
      const done = state.customerOrders.filter((o) => (o as Order & { sessionId?: string }).sessionId === id);
      return done.length ? { data: done } : notFound("Checkout session");
    }
    const base = nextId(state.customerOrders);
    const created: Order[] = items.map((i, idx) => {
      const p = productById(i.productId)!;
      p.quantityAvailable = Math.max(0, p.quantityAvailable - i.quantity);
      return {
        id: base + idx,
        productId: p.id,
        productName: p.name,
        quantity: i.quantity,
        customerId: state.customer.id,
        customerName: state.customer.fullName,
        driverId: null,
        driverName: null,
        status: "PENDING",
        paymentStatus: "PAID",
        createdAt: new Date().toISOString(),
        sessionId: id,
      } as Order;
    });
    state.customerOrders.unshift(...created);
    delete state.sessions[id];
    state.cart = [];
    return { data: created };
  }],

  // Customer orders (spec §3.7). GET /orders/{id} is not documented yet; see spec §10 Q2.
  ["GET", /^\/orders\/my$/, () => ({ data: state.customerOrders })],
  ["GET", /^\/orders\/(\d+)$/, (m) => {
    const o = pool().find((x) => x.id === +m[1]);
    return o ? { data: forDriver(o) } : notFound("Order");
  }],

  // ───────── Driver jobs (spec §3.7) ─────────
  ["GET", /^\/orders\/unassigned$/, () => ({ data: pool().filter((o) => o.status === "PENDING" && !o.driverId && o.paymentStatus === "PAID").map(forDriver) })],
  ["GET", /^\/orders\/assigned$/, () => ({ data: pool().filter((o) => o.driverId === state.driver.id).map(forDriver).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) })],
  ["PATCH", /^\/orders\/(\d+)\/assign$/, (m) => {
    const o = pool().find((x) => x.id === +m[1]);
    if (!o) return notFound("Order");
    if (o.driverId && o.driverId !== state.driver.id) return { error: { status: 409, data: { message: "Another driver took this job." } } };
    Object.assign(o, { driverId: state.driver.id, driverName: state.driver.fullName, status: "ASSIGNED", updatedAt: new Date().toISOString() });
    notify("notifications", `${state.driver.fullName} will collect order FN-${o.id}`);
    return { data: forDriver(o) };
  }],
  ["PATCH", /^\/orders\/(\d+)\/status$/, (m, r) => {
    const o = pool().find((x) => x.id === +m[1]);
    if (!o) return notFound("Order");
    const to = String(r.params?.status ?? "") as OrderStatus;
    if (NEXT[o.status] !== to) return bad(`Can't move an order from ${o.status} to ${to}.`);
    Object.assign(o, { status: to, updatedAt: new Date().toISOString() });
    if (o.donationId) {
      const d = state.donations.find((x) => x.id === o.donationId);
      if (d && to === "DELIVERED") d.status = "DELIVERED";
    }
    if (to === "IN_TRANSIT") notify("customerNotifications", `${state.driver.fullName} collected ${o.productName} and is on the way`);
    if (to === "DELIVERED") notify("customerNotifications", `${o.productName} was delivered`);
    return { data: forDriver(o) };
  }],

  // ───────── Donations (spec §3.9) ─────────
  ["GET", /^\/donations$/, () => ({ data: state.donations.filter((d) => d.status === "PENDING") })],
  ["GET", /^\/donations\/my\/farmer$/, () => ({ data: state.donations.filter((d) => d.farmerId === state.farmer.id) })],
  ["GET", /^\/donations\/my\/organisation$/, () => ({ data: state.donations.filter((d) => d.organisationId === state.organisation?.id) })],
  ["POST", /^\/donations$/, (_, r) => {
    const { productId, quantity, note } = r.body as { productId: number; quantity: number; note?: string };
    const p = state.products.find((x) => x.id === productId);
    if (!p) return notFound("Product");
    if (!Number.isInteger(quantity) || quantity < 1) return bad("Donate at least 1.");
    if (quantity > p.quantityAvailable) return bad(`You only have ${p.quantityAvailable} in stock.`);
    p.quantityAvailable -= quantity;
    const d: Donation = { id: nextId(state.donations), productId, productName: p.name, quantity, status: "PENDING", farmerId: p.farmerId, farmerName: p.farmerName, coverImageUrl: p.coverImageUrl, bestBeforeDate: p.bestBeforeDate, pickupAddress: p.pickupAddress, note, createdAt: new Date().toISOString() };
    state.donations.unshift(d);
    notify("orgNotifications", `${p.farmerName} donated ${quantity} × ${p.name} near you`, "DONATION_UPDATE");
    return { data: d };
  }],
  ["PATCH", /^\/donations\/(\d+)\/claim(-and-order)?$/, (m) => {
    const d = state.donations.find((x) => x.id === +m[1]);
    if (!d) return notFound("Donation");
    if (d.status !== "PENDING") return { error: { status: 409, data: { message: "Someone else claimed this first." } } };
    if (!state.organisation || state.organisation.verificationLevel !== "VERIFIED") return { error: { status: 403, data: { message: "Your organisation needs to be verified before it can claim." } } };
    Object.assign(d, { status: m[2] ? "IN_DELIVERY" : "CLAIMED", organisationId: state.organisation.id, organisationName: state.organisation.name });
    if (m[2]) {
      // Claim and order: books a delivery that local drivers can pick up.
      state.donationOrders.unshift({
        id: Math.max(...pool().map((o) => o.id)) + 1,
        productId: d.productId,
        productName: d.productName ?? "Donation",
        quantity: d.quantity,
        customerId: state.orgUser.id,
        customerName: state.organisation.name,
        driverId: null,
        driverName: null,
        status: "PENDING",
        paymentStatus: "PAID",
        createdAt: new Date().toISOString(),
        donationId: d.id,
        deliveryAddress: [state.orgUser.address, state.orgUser.postcode].filter(Boolean).join(", "),
      });
      notify("driverNotifications", `New donation run: ${d.quantity} × ${d.productName} to ${state.organisation.name}`);
    }
    notify("notifications", `${state.organisation.name} claimed ${d.quantity} × ${d.productName}`, "DONATION_UPDATE");
    return { data: d };
  }],

  // ───────── Surplus browse (spec §3.10) ─────────
  ["GET", /^\/surplus$/, () => ({
    data: [...state.surplus.map((s) => ({ ...s, ...pick(productById(s.productId)) })), ...state.otherSurplus].filter((s) => (s.availableQuantity ?? 0) > 0 || s.claimedByMe),
  })],
  ["POST", /^\/surplus\/claim\/(\d+)$/, (m) => {
    if (!state.organisation || state.organisation.verificationLevel !== "VERIFIED") return { error: { status: 403, data: { message: "Your organisation needs to be verified before it can claim." } } };
    const s = [...state.surplus, ...state.otherSurplus].find((x) => x.productId === +m[1] && (x.availableQuantity ?? 0) > 0);
    if (!s) return { error: { status: 409, data: { message: "This surplus has already been claimed." } } };
    s.availableQuantity = 0;
    s.claimedByMe = true;
    notify("notifications", `${state.organisation.name} claimed your surplus ${s.productName}`, "SURPLUS_ALERT");
    return { data: s };
  }],

  // ───────── Organisations (spec §3.11). CONFIRM WITH BACKEND: GET /organisations/my is assumed. ─────────
  ["GET", /^\/organisations\/my$/, () => (state.organisation ? { data: state.organisation } : notFound("Organisation"))],
  ["POST", /^\/organisations$/, (_, r) => {
    const b = r.body as Partial<Organisation>;
    if (!b.name?.trim() || !b.type) return bad("Add a name and the type of group.");
    state.organisation = { id: 61, name: b.name.trim(), type: b.type, charityNumber: b.charityNumber, description: b.description, verificationLevel: "PENDING", userId: state.orgUser.id, createdAt: new Date().toISOString() };
    return { data: state.organisation };
  }],
  ["PUT", /^\/organisations\/(\d+)$/, (_, r) => {
    if (!state.organisation) return notFound("Organisation");
    const b = r.body as Partial<Organisation>;
    state.organisation = { ...state.organisation, ...b, id: state.organisation.id, verificationLevel: state.organisation.verificationLevel };
    return { data: state.organisation };
  }],
  // Demo only: reset the organisation so the apply flow can be tried.
  ["DELETE", /^\/__mock\/organisation$/, () => {
    state.organisation = null;
    return { data: { ok: true } };
  }],
  // Demo only: approve the application (an admin does this in the real app).
  ["POST", /^\/__mock\/organisation\/verify$/, () => {
    if (state.organisation) state.organisation.verificationLevel = "VERIFIED";
    return { data: state.organisation };
  }],

  // ───────── Messages (spec §3.12) ─────────
  ["GET", /^\/messages$/, () => {
    const id = currentUser().id;
    return { data: state.messages.filter((x) => x.senderId === id || x.recipientId === id) };
  }],
  ["POST", /^\/messages$/, (_, r) => {
    const { recipientId, content, recipientName } = r.body as { recipientId: number; content: string; recipientName?: string };
    if (!content?.trim()) return bad("Write a message first.");
    const me = currentUser();
    const m: Message = { id: nextId(state.messages), senderId: me.id, senderName: me.fullName, recipientId, recipientName: db.people[recipientId]?.name ?? recipientName, content: content.trim(), read: false, createdAt: new Date().toISOString() };
    state.messages.push(m);
    scheduleReply(recipientId, me.id);
    return { data: m };
  }],
  ["PATCH", /^\/messages\/(\d+)\/read$/, (m) => {
    const x = state.messages.find((y) => y.id === +m[1]);
    if (!x) return notFound("Message");
    x.read = true;
    return { data: x };
  }],
  ["GET", /^\/__mock\/people$/, () => ({ data: Object.entries(db.people).map(([id, p]) => ({ id: +id, ...p })).filter((p) => p.id !== currentUser().id) })],

  ["GET", /^\/products\/my$/, () => ({ data: state.products })],
  ["POST", /^\/products$/, (_, r) => {
    const input = r.body as ProductInput;
    const p: Product = { ...input, id: nextId(state.products), farmerId: db.me.id, farmerName: "Hollins Farm", createdAt: new Date().toISOString() };
    state.products.unshift(p);
    return { data: p };
  }],
  ["PUT", /^\/products\/(\d+)$/, (m, r) => {
    const i = state.products.findIndex((p) => p.id === +m[1]);
    if (i < 0) return notFound("Product");
    state.products[i] = { ...state.products[i], ...(r.body as ProductInput), updatedAt: new Date().toISOString() };
    return { data: state.products[i] };
  }],
  ["DELETE", /^\/products\/(\d+)$/, (m) => {
    const p = state.products.find((x) => x.id === +m[1]);
    if (!p) return notFound("Product");
    state.products = state.products.filter((x) => x.id !== p.id);
    return { data: p };
  }],
  // Undo support for the mock only: put a deleted product back.
  ["POST", /^\/__mock\/products\/restore$/, (_, r) => {
    state.products.unshift(r.body as Product);
    return { data: r.body };
  }],

  ["GET", /^\/orders\/my\/farmer$/, () => ({ data: [...state.orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) })],

  ["GET", /^\/surplus\/my$/, () => ({ data: state.surplus })],
  ["POST", /^\/surplus$/, (_, r) => {
    const { productId, quantity } = r.body as { productId: number; quantity: number };
    const p = state.products.find((x) => x.id === productId);
    if (!p) return notFound("Product");
    const s: Surplus = { id: nextId(state.surplus), productId, productName: p.name, quantity, availableQuantity: quantity, createdAt: new Date().toISOString() };
    state.surplus.unshift(s);
    return { data: s };
  }],

  ["GET", /^\/notifications\/my$/, () => ({ data: state[notesKey[role()]] })],
  ["PUT", /^\/notifications\/(\d+)\/read$/, (m) => {
    const n = state[notesKey[role()]].find((x) => x.id === +m[1]);
    if (!n) return notFound("Notification");
    n.read = true;
    return { data: n };
  }],

  ["GET", /^\/analytics\/farmer\/revenue$/, () => ({ data: db.revenueSeries })],
];

function pick(p?: Product) {
  return p ? { productName: p.name, farmerName: p.farmerName, coverImageUrl: p.coverImageUrl, bestBeforeDate: p.bestBeforeDate, pickupAddress: p.pickupAddress } : {};
}

/** Demo only: the other person answers a few seconds later, so threads feel alive (the UI polls). */
const REPLIES = ["Thanks, got it.", "Sounds good.", "Great, see you then.", "No problem at all.", "Perfect, thank you!"];
function scheduleReply(from: number, to: number) {
  if (!db.people[from]) return;
  setTimeout(() => {
    state.messages.push({ id: nextId(state.messages), senderId: from, senderName: db.people[from].name, recipientId: to, recipientName: currentUser().fullName, content: REPLIES[state.messages.length % REPLIES.length], read: false, createdAt: new Date().toISOString() });
    save();
  }, 2500);
}

export async function handle(req: Req): Promise<Res> {
  // Feels like a network: short, slightly variable.
  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));
  for (const [method, re, fn] of routes) {
    const m = req.path.match(re);
    if (m && method === req.method) {
      const res = fn(m, req);
      if (req.method !== "GET") save();
      // Hand out copies: RTK Query freezes what it caches, and the mock keeps mutating its own state.
      return "data" in res ? { data: structuredClone(res.data) } : res;
    }
  }
  return { error: { status: 404, data: { message: `No mock for ${req.method} ${req.path}` } } };
}
