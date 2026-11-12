import type { Metadata } from "next";
import { AuthScreen } from "@/components/app/auth/AuthScreen";

export const metadata: Metadata = { title: "Sign up" };

export default function Page() {
  return <AuthScreen initial="register" />;
}
