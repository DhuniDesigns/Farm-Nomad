import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { CartItem, CheckoutSession, Donation, Meal, MealInput, MealOrder, MealOrderStatus, Message, Notification, Order, OrderStatus, Organisation, Product, ProductInput, Surplus, User } from "@/lib/types/api";

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
  tagTypes: ["Product", "Order", "Surplus", "Notification", "Me", "Cart", "Market", "MyOrders", "Jobs", "Donation", "Org", "Messages", "Meal", "MealOrder"],
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

    // ───────── Driver jobs (spec §3.7) ─────────
    assignedOrders: b.query<Order[], void>({ query: () => "/orders/assigned", providesTags: ["Jobs"] }),
    unassignedOrders: b.query<Order[], void>({ query: () => "/orders/unassigned", providesTags: ["Jobs"] }),
    assignOrder: b.mutation<Order, number>({
      // Driver → self: driverId is optional (required only for admin).
      query: (id) => ({ url: `/orders/${id}/assign`, method: "PATCH" }),
      invalidatesTags: ["Jobs", "Order", "MyOrders", "Notification"],
    }),
    updateOrderStatus: b.mutation<Order, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `/orders/${id}/status`, method: "PATCH", params: { status } }),
      invalidatesTags: ["Jobs", "Order", "MyOrders", "Donation", "Notification"],
    }),

    // ───────── Donations (spec §3.9) ─────────
    listDonations: b.query<Donation[], void>({ query: () => "/donations", providesTags: ["Donation"] }),
    myFarmerDonations: b.query<Donation[], void>({ query: () => "/donations/my/farmer", providesTags: ["Donation"] }),
    myOrganisationDonations: b.query<Donation[], void>({ query: () => "/donations/my/organisation", providesTags: ["Donation"] }),
    createDonation: b.mutation<Donation, { productId: number; quantity: number; note?: string }>({
      query: (body) => ({ url: "/donations", method: "POST", body }),
      invalidatesTags: ["Donation", "Product"],
    }),
    // organisationId is only required when the caller is ADMIN; omitted for ORGANISATION.
    claimDonation: b.mutation<Donation, { id: number; withDelivery?: boolean }>({
      query: ({ id, withDelivery }) => ({ url: `/donations/${id}/${withDelivery ? "claim-and-order" : "claim"}`, method: "PATCH" }),
      invalidatesTags: ["Donation", "Jobs", "Notification"],
    }),

    // ───────── Surplus browse (spec §3.10) ─────────
    listSurplus: b.query<Surplus[], void>({ query: () => "/surplus", providesTags: ["Surplus"] }),
    claimSurplus: b.mutation<Surplus, number>({ query: (productId) => ({ url: `/surplus/claim/${productId}`, method: "POST" }), invalidatesTags: ["Surplus", "Notification"] }),

    // ───────── Organisations (spec §3.11). CONFIRM WITH BACKEND: GET /organisations/my is assumed. ─────────
    myOrganisation: b.query<Organisation | null, void>({
      query: () => "/organisations/my",
      // No organisation yet → 404, and the page shows the apply form.
      providesTags: ["Org"],
    }),
    createOrganisation: b.mutation<Organisation, Pick<Organisation, "name" | "type" | "charityNumber" | "description">>({
      query: (body) => ({ url: "/organisations", method: "POST", body }),
      invalidatesTags: ["Org"],
    }),
    updateOrganisation: b.mutation<Organisation, { id: number } & Partial<Organisation>>({
      query: ({ id, ...body }) => ({ url: `/organisations/${id}`, method: "PUT", body }),
      invalidatesTags: ["Org"],
    }),
    mockResetOrganisation: b.mutation<{ ok: boolean }, void>({ query: () => ({ url: "/__mock/organisation", method: "DELETE" }), invalidatesTags: ["Org"] }),
    mockVerifyOrganisation: b.mutation<Organisation, void>({ query: () => ({ url: "/__mock/organisation/verify", method: "POST" }), invalidatesTags: ["Org"] }),

    // ───────── Messages (spec §3.12). Polls until STOMP lands. ─────────
    myMessages: b.query<Message[], void>({ query: () => "/messages", providesTags: ["Messages"] }),
    sendMessage: b.mutation<Message, { recipientId: number; content: string; recipientName?: string }>({
      // recipientName is a hint for the mock only; the API takes recipientId and content.
      query: (body) => ({ url: "/messages", method: "POST", body }),
      invalidatesTags: ["Messages"],
    }),
    markMessageRead: b.mutation<Message, number>({ query: (id) => ({ url: `/messages/${id}/read`, method: "PATCH" }), invalidatesTags: ["Messages"] }),
    people: b.query<{ id: number; name: string; role: string }[], void>({ query: () => "/__mock/people" }),

    // ───────── NomadEat meals (spec §3.4, JSON with already-hosted imageUrls) ─────────
    listMeals: b.query<Meal[], void>({ query: () => "/meals", providesTags: ["Meal"] }),
    getMeal: b.query<Meal, number>({ query: (id) => `/meals/${id}`, providesTags: ["Meal"] }),
    myMeals: b.query<Meal[], void>({ query: () => "/meals/my", providesTags: ["Meal"] }),
    createMeal: b.mutation<Meal, MealInput>({ query: (body) => ({ url: "/meals", method: "POST", body }), invalidatesTags: ["Meal"] }),
    updateMeal: b.mutation<Meal, { id: number } & Partial<MealInput>>({
      query: ({ id, ...body }) => ({ url: `/meals/${id}`, method: "PUT", body }),
      // Optimistic: availability toggles feel instant.
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const undo = dispatch(api.util.updateQueryData("myMeals", undefined, (d) => {
          const m = d.find((x) => x.id === id);
          if (m) Object.assign(m, patch);
        }));
        queryFulfilled.catch(undo.undo);
      },
      invalidatesTags: ["Meal"],
    }),
    deleteMeal: b.mutation<Meal, number>({ query: (id) => ({ url: `/meals/${id}`, method: "DELETE" }), invalidatesTags: ["Meal"] }),

    // ───────── Meal orders. CONFIRM WITH BACKEND: not in the spec yet. ─────────
    orderMeal: b.mutation<MealOrder, { mealId: number; quantity: number; note?: string }>({
      query: (body) => ({ url: "/meal-orders", method: "POST", body }),
      invalidatesTags: ["Meal", "MealOrder"],
    }),
    myMealOrders: b.query<MealOrder[], void>({ query: () => "/meal-orders/my", providesTags: ["MealOrder"] }),
    kitchenMealOrders: b.query<MealOrder[], void>({ query: () => "/meal-orders/kitchen", providesTags: ["MealOrder"] }),
    updateMealOrder: b.mutation<MealOrder, { id: number; status: MealOrderStatus }>({
      query: ({ id, status }) => ({ url: `/meal-orders/${id}/status`, method: "PATCH", params: { status } }),
      invalidatesTags: ["MealOrder", "Meal", "Notification"],
    }),

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
  useAssignedOrdersQuery,
  useUnassignedOrdersQuery,
  useAssignOrderMutation,
  useUpdateOrderStatusMutation,
  useListDonationsQuery,
  useMyFarmerDonationsQuery,
  useMyOrganisationDonationsQuery,
  useCreateDonationMutation,
  useClaimDonationMutation,
  useListSurplusQuery,
  useClaimSurplusMutation,
  useMyOrganisationQuery,
  useCreateOrganisationMutation,
  useUpdateOrganisationMutation,
  useMockResetOrganisationMutation,
  useMockVerifyOrganisationMutation,
  useMyMessagesQuery,
  useSendMessageMutation,
  useMarkMessageReadMutation,
  usePeopleQuery,
  useListMealsQuery,
  useGetMealQuery,
  useMyMealsQuery,
  useCreateMealMutation,
  useUpdateMealMutation,
  useDeleteMealMutation,
  useOrderMealMutation,
  useMyMealOrdersQuery,
  useKitchenMealOrdersQuery,
  useUpdateMealOrderMutation,
} = api;
