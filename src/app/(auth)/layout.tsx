import type { Metadata } from "next";
import { AuthShell } from "@/components/app/AuthShell";

export const metadata: Metadata = { title: { template: "%s · FarmNomad", default: "FarmNomad" }, robots: { index: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
