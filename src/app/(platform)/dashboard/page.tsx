"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/app/AppState";
import { HOME } from "@/lib/navigation";

// Signed-in users land on their role's home (spec routeAfterLogin).
export default function Dashboard() {
  const { role } = useApp();
  const router = useRouter();
  useEffect(() => {
    router.replace(HOME[role]);
  }, [role, router]);
  return null;
}
