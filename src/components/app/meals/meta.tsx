"use client";

import Image from "next/image";
import { BowlFood, BowlSteam, CheckCircle, Cookie, CookingPot, FishSimple, Fire, HandWaving, Pepper, Pizza, XCircle } from "@phosphor-icons/react/dist/ssr";
import type { Meal, MealOrderStatus } from "@/lib/types/api";
import type { Tone } from "@/components/app/ui";
import { cn } from "@/lib/cn";

export const CUISINES = ["British", "West African", "South Asian", "Caribbean", "Middle Eastern", "East Asian", "Italian", "Dessert"] as const;
export const DIETARY = ["Vegan", "Vegetarian", "Halal", "Gluten-free", "Dairy-free"] as const;

/** Each cuisine gets a tint and an icon, so meals without photos still read at a glance. */
const ART: Record<string, { icon: typeof BowlFood; light: string; dark: string; fg: string }> = {
  British: { icon: CookingPot, light: "#EEF2E6", dark: "#1A2216", fg: "#4F6B2F" },
  "West African": { icon: Pepper, light: "#FBEDE2", dark: "#2A1A12", fg: "#B4561E" },
  "South Asian": { icon: BowlSteam, light: "#FCF3DC", dark: "#2A2310", fg: "#A0760B" },
  Caribbean: { icon: Fire, light: "#FCE9E4", dark: "#2A1613", fg: "#B4432D" },
  "Middle Eastern": { icon: BowlFood, light: "#F5EEDF", dark: "#251F14", fg: "#8A6A2A" },
  "East Asian": { icon: FishSimple, light: "#E7F0F4", dark: "#13202A", fg: "#2F6A86" },
  Italian: { icon: Pizza, light: "#FBE9E9", dark: "#2A1515", fg: "#A63A3A" },
  Dessert: { icon: Cookie, light: "#F7ECF3", dark: "#261622", fg: "#9A4A7E" },
};
const fallback = ART.British;

export function MealArt({ meal, className, iconClass, sizes = "33vw" }: { meal: Pick<Meal, "imageUrls" | "cuisine" | "name">; className?: string; iconClass?: string; sizes?: string }) {
  const src = meal.imageUrls?.[0];
  const a = ART[meal.cuisine] ?? fallback;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {src ? (
        <Image src={src} alt={meal.name} fill sizes={sizes} unoptimized={src.startsWith("blob:")} className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[var(--art-l)] dark:bg-[var(--art-d)]" style={{ ["--art-l" as string]: a.light, ["--art-d" as string]: a.dark }} aria-hidden>
          <a.icon weight="duotone" className={cn("size-[38%] max-w-24", iconClass)} style={{ color: a.fg }} />
        </div>
      )}
    </div>
  );
}

export const mealOrderMeta: Record<MealOrderStatus, { label: string; customer: string; tone: Tone; icon: typeof BowlFood; next?: { to: MealOrderStatus; label: string } }> = {
  NEW: { label: "New", customer: "Sent to the kitchen", tone: "amber", icon: HandWaving, next: { to: "PREPARING", label: "Start cooking" } },
  PREPARING: { label: "Cooking", customer: "Being cooked", tone: "blue", icon: Fire, next: { to: "READY", label: "Mark ready" } },
  READY: { label: "Ready", customer: "Ready to collect", tone: "green", icon: CheckCircle, next: { to: "COLLECTED", label: "Mark collected" } },
  COLLECTED: { label: "Collected", customer: "Collected", tone: "neutral", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", customer: "Cancelled", tone: "neutral", icon: XCircle },
};

export function DietTags({ tags, className }: { tags?: string[]; className?: string }) {
  if (!tags?.length) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((t) => (
        <span key={t} className="rounded-full bg-app-accent-soft px-2 py-0.5 text-[11px] font-medium text-app-accent">
          {t}
        </span>
      ))}
    </span>
  );
}
