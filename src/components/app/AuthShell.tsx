"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AppState } from "./AppState";

/** Sign-in and sign-up frame: form on the left, the farm on the right. Same app theme tokens. */
export function AuthShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="fn-app grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-6 md:px-12">
        <Link href="/" className="w-fit" aria-label="FarmNomad home">
          <Image src="/logo-on-light-tight.svg" alt="FarmNomad" width={178} height={36} className="h-7 w-auto dark:hidden" />
          <Image src="/logo-on-dark-tight.svg" alt="FarmNomad" width={178} height={36} className="hidden h-7 w-auto dark:block" />
        </Link>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">{mounted && <AppState>{children}</AppState>}</div>
        <p className="text-ui-sm text-app-faint">Launching across the North West, rolling out UK-wide.</p>
      </div>
      <div className="relative hidden p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-2xl">
          <Image src="/images/hero.webp" alt="" fill sizes="50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgb(16_37_27/0.7))]" />
          <p className="absolute inset-x-10 bottom-10 max-w-[22ch] font-display text-[34px] font-medium leading-[1.05] tracking-[-0.03em] text-white">
            Food straight from UK farms.
          </p>
        </div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}
