import type { Metadata } from "next";
import { AuthScreen } from "@/components/app/auth/AuthScreen";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return <AuthScreen initial="login" />;
}
