"use client";

import Image from "next/image";
import { CheckCircle, CircleDashed, HandHeart, Truck } from "@phosphor-icons/react/dist/ssr";
import type { DonationStatus, OrganisationType, VerificationLevel } from "@/lib/types/api";
import type { Tone } from "@/components/app/ui";
import { cn } from "@/lib/cn";

export const donationMeta: Record<DonationStatus, { label: string; farmer: string; tone: Tone; icon: typeof CheckCircle }> = {
  PENDING: { label: "Open to claim", farmer: "Waiting for a food group", tone: "amber", icon: CircleDashed },
  CLAIMED: { label: "Claimed · to collect", farmer: "Claimed, they'll collect", tone: "blue", icon: HandHeart },
  IN_DELIVERY: { label: "On its way", farmer: "Claimed, a driver is delivering", tone: "blue", icon: Truck },
  DELIVERED: { label: "Received", farmer: "Delivered", tone: "green", icon: CheckCircle },
};

export const orgTypeLabel: Record<OrganisationType, string> = {
  FOODBANK: "Food bank",
  SCHOOL: "School",
  RELIGIOUS: "Faith group",
  STUDENT_GROUP: "Student group",
};

export const verificationMeta: Record<VerificationLevel, { label: string; tone: Tone; body: string }> = {
  UNVERIFIED: { label: "Not verified", tone: "neutral", body: "Apply to start claiming food." },
  PENDING: { label: "Checking your details", tone: "amber", body: "We usually verify groups within two working days. You can browse in the meantime." },
  VERIFIED: { label: "Verified", tone: "green", body: "You can claim donations and surplus from farms nearby." },
};

/** Town from a "Farm, Street, Town POSTCODE" address. */
export const townOf = (a?: string) => a?.split(",").slice(-1)[0]?.trim().replace(/\s+[A-Z]{1,2}\d.*$/, "") ?? "";

export function Thumb({ src, className }: { src?: string; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F1F4EC] dark:bg-[#121912]", className ?? "size-11")}>
      {src && <Image src={src} alt="" width={96} height={96} className="size-[85%] object-contain" />}
    </span>
  );
}
