import {
  ChatsCircle,
  ForkKnife,
  HandHeart,
  House,
  Package,
  Receipt,
  ShoppingBagOpen,
  Storefront,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { MockRole } from "@/lib/types/api";

/**
 * Role-aware navigation (build spec §6). `release` follows FRONTEND-CLAUDE.md:
 * R1 ships now; later releases show as "Soon" with a short explainer page instead of being hidden,
 * so the whole product shape is visible.
 */
export type NavItem = { href: string; label: string; icon: typeof House; key?: string; release: "R1" | "R2" | "R3" };

export const NAV: Record<MockRole, NavItem[]> = {
  FARMER: [
    { href: "/dashboard/farmer", label: "Dashboard", icon: House, key: "D", release: "R1" },
    { href: "/products", label: "Products", icon: Package, key: "P", release: "R1" },
    { href: "/orders", label: "Orders", icon: Receipt, key: "O", release: "R1" },
    { href: "/surplus/manage", label: "Surplus", icon: HandHeart, key: "S", release: "R1" },
    { href: "/messages", label: "Messages", icon: ChatsCircle, release: "R2" },
    { href: "/profile", label: "Profile", icon: UserCircle, key: "U", release: "R1" },
  ],
  CUSTOMER: [
    { href: "/marketplace", label: "Marketplace", icon: Storefront, key: "M", release: "R1" },
    { href: "/orders", label: "My orders", icon: Receipt, key: "O", release: "R1" },
    { href: "/cart", label: "Cart", icon: ShoppingBagOpen, key: "C", release: "R1" },
    { href: "/nomadeat", label: "NomadEat", icon: ForkKnife, release: "R3" },
    { href: "/messages", label: "Messages", icon: ChatsCircle, release: "R2" },
    { href: "/profile", label: "Profile", icon: UserCircle, key: "U", release: "R1" },
  ],
};

export const HOME: Record<MockRole, string> = { FARMER: "/dashboard/farmer", CUSTOMER: "/marketplace" };
export const allNav = [...NAV.FARMER, ...NAV.CUSTOMER];
