import {
  Buildings,
  ChatsCircle,
  ForkKnife,
  Gift,
  HandHeart,
  House,
  MapTrifold,
  Package,
  Receipt,
  ShoppingBagOpen,
  Storefront,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { MockRole } from "@/lib/types/api";

/**
 * Role-aware navigation (build spec §6). `release` follows FRONTEND-CLAUDE.md. Items from a
 * later release show "Soon" with an explainer page instead of being hidden.
 */
export type NavItem = { href: string; label: string; icon: typeof House; key?: string; release: "R1" | "R2" | "R3"; mobile?: boolean };

export const NAV: Record<MockRole, NavItem[]> = {
  FARMER: [
    { href: "/dashboard/farmer", label: "Dashboard", icon: House, key: "D", release: "R1" },
    { href: "/products", label: "Products", icon: Package, key: "P", release: "R1" },
    { href: "/orders", label: "Orders", icon: Receipt, key: "O", release: "R1" },
    { href: "/surplus/manage", label: "Surplus", icon: HandHeart, key: "S", release: "R2" },
    { href: "/donations/manage", label: "Donations", icon: Gift, key: "G", release: "R2" },
    { href: "/messages", label: "Messages", icon: ChatsCircle, key: "I", release: "R2" },
    { href: "/profile", label: "Profile", icon: UserCircle, key: "U", release: "R1" },
  ],
  CUSTOMER: [
    { href: "/marketplace", label: "Marketplace", icon: Storefront, key: "M", release: "R1", mobile: true },
    { href: "/orders", label: "My orders", icon: Receipt, key: "O", release: "R1", mobile: true },
    { href: "/cart", label: "Cart", icon: ShoppingBagOpen, key: "C", release: "R1", mobile: true },
    { href: "/messages", label: "Messages", icon: ChatsCircle, key: "I", release: "R2" },
    { href: "/nomadeat", label: "NomadEat", icon: ForkKnife, release: "R3" },
    { href: "/profile", label: "Profile", icon: UserCircle, key: "U", release: "R1", mobile: true },
  ],
  DRIVER: [
    { href: "/dashboard/driver", label: "Today", icon: House, key: "D", release: "R1", mobile: true },
    { href: "/jobs", label: "Jobs", icon: MapTrifold, key: "J", release: "R1", mobile: true },
    { href: "/messages", label: "Messages", icon: ChatsCircle, key: "I", release: "R2", mobile: true },
    { href: "/profile", label: "Profile", icon: UserCircle, key: "U", release: "R1", mobile: true },
  ],
  ORGANISATION: [
    { href: "/dashboard/organisation", label: "Dashboard", icon: House, key: "D", release: "R2" },
    { href: "/donations", label: "Donations", icon: Gift, key: "G", release: "R2" },
    { href: "/surplus", label: "Surplus", icon: HandHeart, key: "S", release: "R2" },
    { href: "/organisations/apply", label: "Organisation", icon: Buildings, key: "V", release: "R2" },
    { href: "/messages", label: "Messages", icon: ChatsCircle, key: "I", release: "R2" },
    { href: "/profile", label: "Profile", icon: UserCircle, key: "U", release: "R1" },
  ],
};

/** Items still to come: shown as "Soon" (their page explains what's coming). */
export const SOON = new Set(["/nomadeat"]);

export const HOME: Record<MockRole, string> = {
  FARMER: "/dashboard/farmer",
  CUSTOMER: "/marketplace",
  DRIVER: "/dashboard/driver",
  ORGANISATION: "/dashboard/organisation",
};

export const ROLE_META: Record<MockRole, { label: string; workspace: string; demoEmail: string }> = {
  FARMER: { label: "Farmer", workspace: "Hollins Farm", demoEmail: "tom@hollinsfarm.co.uk" },
  CUSTOMER: { label: "Customer", workspace: "FarmNomad", demoEmail: "amara.okafor@example.com" },
  DRIVER: { label: "Driver", workspace: "Driving", demoEmail: "sam.patel@example.com" },
  ORGANISATION: { label: "Food group", workspace: "St Mary's Food Bank", demoEmail: "ruth@stmarysfoodbank.org.uk" },
};

/**
 * Pages each role may open (stand-in for RoleGuard until real auth lands).
 * A trailing "$" means that exact path only, so "/surplus$" doesn't also allow "/surplus/manage".
 */
const ALLOWED: Record<MockRole, string[]> = {
  FARMER: ["/dashboard$", "/dashboard/farmer", "/products", "/orders", "/surplus/manage", "/donations/manage", "/marketplace", "/messages", "/profile"],
  CUSTOMER: ["/dashboard$", "/marketplace", "/orders", "/cart", "/checkout", "/nomadeat", "/messages", "/profile"],
  DRIVER: ["/dashboard$", "/dashboard/driver", "/jobs", "/messages", "/profile"],
  ORGANISATION: ["/dashboard$", "/dashboard/organisation", "/donations$", "/surplus$", "/organisations", "/marketplace", "/messages", "/profile"],
};

export function canOpen(role: MockRole, path: string) {
  return ALLOWED[role].some((r) => (r.endsWith("$") ? path === r.slice(0, -1) : path === r || path.startsWith(r + "/")));
}

export const allNav = Object.values(NAV).flat();
