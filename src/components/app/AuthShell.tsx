"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AppState, useApp } from "./AppState";

/** Frame for sign-in and sign-up. Client-only (reads the saved theme and demo role). */
export function AuthShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="fn-app min-h-[100dvh]" />;
  return (
    <AppState>
      <Themed>{children}</Themed>
    </AppState>
  );
}

function Themed({ children }: { children: ReactNode }) {
  const { theme, resolvedDark } = useApp();
  return (
    <div className="fn-app min-h-[100dvh]" data-theme={theme === "system" ? undefined : theme}>
      {children}
      <Toaster position="bottom-center" theme={resolvedDark ? "dark" : "light"} />
    </div>
  );
}
