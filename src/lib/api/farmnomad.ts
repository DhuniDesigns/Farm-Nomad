import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { CartItem, CheckoutSession, Notification, Order, Product, ProductInput, Surplus, User } from "@/lib/types/api";

/**
 * One switch between sample data and the Spring Boot API.
 * NEXT_PUBLIC_USE_MOCKS defaults to on. Set it to "false" and NEXT_PUBLIC_API_URL to the backend
 * (e.g. http://localhost:9000/api) and every hook below talks to the real thing.
 */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const realBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api",
  prepareHeaders: (headers) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("fn_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const mockBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args) => {
  const { handle } = await import("./mock/handlers");
  const a = typeof args === "string" ? { url: args } : args;
  const res = await handle({ method: (a.method ?? "GET").toUpperCase(), path: a.url, body: a.body, params: a.params });
  return "error" in res ? { error: res.error as FetchBaseQueryError } : { data: res.data };
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: USE_MOCKS ? mockBaseQuery : realBaseQuery,
  tagTypes: ["Product", "Order", "Surplus", "Notification", "Me", "Cart", "Market", "MyOrders"],
  endpoints: (b) => ({
    me: b.query<User, void>({ query: () => "/users/me", providesTags: ["Me"] }),

    // Products (spec §7.5)
    listMyProducts: b.query<Product[], void>({ query: () => "/products/my", providesTags: ["Product"] }),
    createProduct: b.mutation<Product, ProductInput>({
      // The real endpoint takes multipart/form-data; the form layer builds FormData when mocks are off.
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: b.mutation<Product, { id: number } & Partial<ProductInput>>({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: "PUT", body }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: b.mutation<Product, number>({ query: (id) => ({ url: `/products/${id}`, method: "DELETE" }), invalidatesTags: ["Product"] }),
    restoreProduct: b.mutation<Product, Product>({ query: (body) => ({ url: "/__mock/products/restore", method: "POST", body }), invalidatesTags: ["Product"] }),

    // Orders. CONFIRM WITH BACKEND: no farmer-scoped list is documented yet; this assumes GET /orders/my/farmer.
    listFarmerOrders: b.query<Order[], void>({ query: () => "/orders/my/farmer", providesTags: ["Order"] }),

    // Surplus (spec §7.10). CONFIRM WITH BACKEND: create endpoint is not documented; this assumes POST /surplus.
    listMySurplus: b.query<Surplus[], void>({ query: () => "/surplus/my", providesTags: ["Surplus"] }),
    createSurplus: b.mutation<Surplus, { productId: number; quantity: number }>({
      query: (body) => ({ url: "/surplus", method: "POST", body }),
      invalidatesTags: ["Surplus"],
    }),

    myNotifications: b.query<Notification[], void>({ query: () => "/notifications/my", providesTags: ["Notification"] }),
    markNotificationRead: b.mutation<Notification, number>({ query: (id) => ({ url: `/notifications/${id}/read`, method: "PUT" }), invalidatesTags: ["Notification"] }),

    // ───────── Customer (spec §3.6–3.8, §7.5, §7.8, §7.9) ─────────
    updateMe: b.mutation<User, { id: number } & Partial<User>>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["Me"],
    }),
    changePassword: b.mutation<{ ok: boolean }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),
    login: b.mutation<{ token: string }, { email: string; password: string }>({ query: (body) => ({ url: "/auth/login", method: "POST", body }) }),
    forgotPassword: b.mutation<{ ok: boolean }, { email: string }>({ query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }) }),
    register: b.mutation<{ ok: boolean }, Record<string, string>>({ query: (body) => ({ url: "/auth/register", method: "POST", body }) }),

    listProducts: b.query<Product[], void>({ query: () => "/products", providesTags: ["Market"] }),
    getProduct: b.query<Product, number>({ query: (id) => `/products/${id}`, providesTags: ["Market"] }),

    getCart: b.query<CartItem[], void>({ query: () => "/cart/items", providesTags: ["Cart"] }),
    addToCart: b.mutation<CartItem, { productId: number; quantity: number }>({
      query: (body) => ({ url: "/cart/items", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),
    updateCartQty: b.mutation<CartItem, { itemId: number; quantity: number }>({
      query: ({ itemId, quantity }) => ({ url: `/cart/items/${itemId}`, method: "PUT", params: { quantity } }),
      // Optimistic: steppers feel instant, the server confirms behind.
      async onQueryStarted({ itemId, quantity }, { dispatch, queryFulfilled }) {
        const patch = dispatch(api.util.updateQueryData("getCart", undefined, (d) => {
          const it = d.find((x) => x.id === itemId);
          if (it) it.quantity = quantity;
        }));
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    removeCartItem: b.mutation<CartItem, number>({ query: (itemId) => ({ url: `/cart/items/${itemId}`, method: "DELETE" }), invalidatesTags: ["Cart"] }),
    clearCart: b.mutation<{ ok: boolean }, void>({ query: () => ({ url: "/cart/clear", method: "DELETE" }), invalidatesTags: ["Cart"] }),

    createCheckoutSession: b.mutation<CheckoutSession, void>({ query: () => ({ url: "/checkout/create-session", method: "POST" }) }),
    confirmCheckout: b.mutation<Order[], string>({
      query: (sessionId) => ({ url: "/checkout/confirm", method: "POST", params: { sessionId } }),
      invalidatesTags: ["Cart", "MyOrders", "Market"],
    }),

    myOrders: b.query<Order[], void>({ query: () => "/orders/my", providesTags: ["MyOrders"] }),
    // CONFIRM WITH BACKEND: GET /orders/{id} is not documented (spec §10 Q2).
    getOrder: b.query<Order, number>({ query: (id) => `/orders/${id}`, providesTags: ["MyOrders"] }),

    // CONFIRM WITH BACKEND: revenue analytics endpoint is not documented yet.
    farmerRevenue: b.query<{ date: string; value: number }[], void>({ query: () => "/analytics/farmer/revenue" }),
  }),
});

export const {
  useMeQuery,
  useListMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
  useListFarmerOrdersQuery,
  useListMySurplusQuery,
  useCreateSurplusMutation,
  useMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useFarmerRevenueQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useListProductsQuery,
  useGetProductQuery,
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartQtyMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useCreateCheckoutSessionMutation,
  useConfirmCheckoutMutation,
  useMyOrdersQuery,
  useGetOrderQuery,
} = api;
