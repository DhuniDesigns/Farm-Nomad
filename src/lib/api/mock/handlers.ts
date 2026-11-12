import type { CartItem, MockRole, Order, Product, ProductInput, Surplus, User } from "@/lib/types/api";
import * as db from "./db";

// Copies of the sample data. Saved to the browser after every change so a reload (or the
// Stripe-style redirect at checkout) keeps your cart, orders and edits.
const KEY = "fn_mock_v1";
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
    return r === "CUSTOMER" ? "CUSTOMER" : "FARMER";
  } catch {
    return "FARMER";
  }
};
const productById = (id: number) => state.marketplace.find((p) => p.id === id) ?? state.products.find((p) => p.id === id);
const withProduct = (i: CartItem): CartItem => ({ ...i, product: productById(i.productId) });
const bad = (message: string): Res => ({ error: { status: 400, data: { message } } });

type Req = { method: string; path: string; body?: unknown; params?: Record<string, string | number | undefined> };
type Res = { data: unknown } | { error: { status: number; data?: unknown } };

const notFound = (what: string): Res => ({ error: { status: 404, data: { message: `${what} not found` } } });
const nextId = (list: { id: number }[]) => Math.max(0, ...list.map((x) => x.id)) + 1;

const routes: [string, RegExp, (m: RegExpMatchArray, r: Req) => Res][] = [
  ["GET", /^\/users\/me$/, () => ({ data: role() === "CUSTOMER" ? state.customer : db.me })],
  ["PUT", /^\/users\/(\d+)$/, (_, r) => {
    if (role() !== "CUSTOMER") return { data: db.me };
    state.customer = { ...state.customer, ...(r.body as Partial<User>), id: state.customer.id, role: "CUSTOMER", email: state.customer.email };
    return { data: state.customer };
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
    const o = state.customerOrders.find((x) => x.id === +m[1]) ?? state.orders.find((x) => x.id === +m[1]);
    return o ? { data: o } : notFound("Order");
  }],

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

  ["GET", /^\/notifications\/my$/, () => ({ data: role() === "CUSTOMER" ? state.customerNotifications : state.notifications })],
  ["PUT", /^\/notifications\/(\d+)\/read$/, (m) => {
    const n = [...state.notifications, ...state.customerNotifications].find((x) => x.id === +m[1]);
    if (!n) return notFound("Notification");
    n.read = true;
    return { data: n };
  }],

  ["GET", /^\/analytics\/farmer\/revenue$/, () => ({ data: db.revenueSeries })],
];

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
