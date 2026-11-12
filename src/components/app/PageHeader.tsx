import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-5 pt-7 md:px-8 md:pt-9">
      <div className="min-w-0">
        <h1 className="font-display text-[26px] font-medium leading-tight tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-1 text-app-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
