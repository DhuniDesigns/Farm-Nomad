"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowSquareOut, BookOpenText, PencilSimple, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { useCreateMealMutation, useDeleteMealMutation, useMyMealsQuery, useUpdateMealMutation } from "@/lib/api/farmnomad";
import type { Meal } from "@/lib/types/api";
import { PageHeader } from "@/components/app/PageHeader";
import { MealSheet, Switch } from "@/components/app/meals/MealSheet";
import { DietTags, MealArt } from "@/components/app/meals/meta";
import { Button, EmptyState, IconButton, Skeleton, gbp } from "@/components/app/ui";
import { cn } from "@/lib/cn";

/** Kitchen menu (spec §7 /meals): every meal, portions left, and an on/off switch. */
export default function MenuPage() {
  const { data, isLoading } = useMyMealsQuery();
  const [update] = useUpdateMealMutation();
  const [remove] = useDeleteMealMutation();
  const [create] = useCreateMealMutation();
  const [sheet, setSheet] = useState<Meal | "new" | null>(null);

  const on = data?.filter((m) => m.available).length ?? 0;

  async function del(m: Meal) {
    await remove(m.id);
    toast(`Removed ${m.name}`, {
      action: {
        label: "Undo",
        onClick: () => create({ name: m.name, description: m.description, price: m.price, portionsAvailable: m.portionsAvailable, cuisine: m.cuisine, imageUrls: m.imageUrls, available: m.available, dietary: m.dietary, farms: m.farms }),
      },
    });
  }

  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader
        title="Menu"
        description={data ? `${on} of ${data.length} meals on NomadEat right now.` : "Your meals on NomadEat."}
        actions={
          <>
            <Link href="/nomadeat" className="hidden sm:block">
              <Button variant="ghost">
                <ArrowSquareOut className="size-4" /> See it as a diner
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setSheet("new")}>
              <Plus weight="bold" className="size-3.5" /> Add meal
            </Button>
          </>
        }
      />
      <div className="px-4 md:px-8">
        {isLoading ? (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            <EmptyState icon={<BookOpenText className="size-5" />} title="Your menu is empty" body="Add your first meal. Diners nearby can order it on NomadEat straight away." action={<Button variant="primary" onClick={() => setSheet("new")}>Add meal</Button>} />
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--a-line)]">
            {data.map((m) => {
              const low = m.available && m.portionsAvailable > 0 && m.portionsAvailable <= 3;
              return (
                <li key={m.id} className={cn("group flex items-center gap-3 border-b sm:gap-4 border-app-line px-4 py-3 last:border-0 md:px-5", !m.available && "bg-app-hover/40")}>
                  <button onClick={() => setSheet(m)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4">
                    <MealArt meal={m} className={cn("size-12 shrink-0 rounded-xl sm:size-14", !m.available && "opacity-50 grayscale")} sizes="56px" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={cn("truncate font-medium", !m.available && "text-app-muted")}>{m.name}</span>
                        <DietTags tags={m.dietary} className="hidden md:flex" />
                      </span>
                      <span className={cn("num mt-0.5 block text-ui-sm sm:hidden", m.portionsAvailable === 0 ? "text-app-red" : low ? "text-app-amber" : "text-app-muted")}>
                        {gbp(m.price)} · {m.portionsAvailable === 0 ? "Sold out" : `${m.portionsAvailable} left`}
                      </span>
                      <span className="mt-0.5 hidden truncate text-ui-sm text-app-faint sm:block">
                        {m.cuisine}
                        {m.farms?.length ? ` · with ${m.farms.join(", ")}` : ""}
                      </span>
                    </span>
                  </button>
                  <span className="num hidden w-16 text-right sm:block">{gbp(m.price)}</span>
                  <span className={cn("num hidden w-24 text-right text-ui-sm sm:block", m.portionsAvailable === 0 ? "text-app-red" : low ? "text-app-amber" : "text-app-muted")}>
                    {m.portionsAvailable === 0 ? "Sold out" : `${m.portionsAvailable} left`}
                  </span>
                  <Switch
                    on={m.available}
                    label={`${m.name} on the menu`}
                    disabled={m.portionsAvailable === 0 && !m.available}
                    onChange={(v) => {
                      update({ id: m.id, available: v });
                      toast(v ? `${m.name} is on the menu` : `${m.name} is hidden`);
                    }}
                  />
                  <span className="flex gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    <IconButton label={`Edit ${m.name}`} onClick={() => setSheet(m)}>
                      <PencilSimple className="size-4" />
                    </IconButton>
                    <IconButton label={`Delete ${m.name}`} onClick={() => del(m)} className="hidden sm:grid">
                      <Trash className="size-4" />
                    </IconButton>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-ui-sm text-app-faint">A meal switches off by itself when its last portion sells. Add portions to put it back on.</p>
      </div>
      <MealSheet open={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}
