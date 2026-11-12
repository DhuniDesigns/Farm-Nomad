import type { Metadata } from "next";
import { AuthScreen } from "@/components/app/auth/AuthScreen";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return <AuthScreen initial="forgot" />;
}
