import type { Order, Product, ProductInput, Surplus } from "@/lib/types/api";
import * as db from "./db";

// In-memory copies so edits last for the browser session.
const state = {
  products: structuredClone(db.products) as Product[],
  orders: structuredClone(db.orders) as Order[],
  surplus: structuredClone(db.surplus) as Surplus[],
  notifications: structuredClone(db.notifications),
};

type Req = { method: string; path: string; body?: unknown; params?: Record<string, string | number | undefined> };
type Res = { data: unknown } | { error: { status: number; data?: unknown } };

const notFound = (what: string): Res => ({ error: { status: 404, data: { message: `${what} not found` } } });
const nextId = (list: { id: number }[]) => Math.max(0, ...list.map((x) => x.id)) + 1;

const routes: [string, RegExp, (m: RegExpMatchArray, r: Req) => Res][] = [
  ["GET", /^\/users\/me$/, () => ({ data: db.me })],

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

  ["GET", /^\/notifications\/my$/, () => ({ data: state.notifications })],
  ["PUT", /^\/notifications\/(\d+)\/read$/, (m) => {
    const n = state.notifications.find((x) => x.id === +m[1]);
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
    if (m && method === req.method) return fn(m, req);
  }
  return { error: { status: 404, data: { message: `No mock for ${req.method} ${req.path}` } } };
}
