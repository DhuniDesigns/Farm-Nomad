import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

const boxes = [
  {
    src: "/images/crate-veg-cut.webp",
    alt: "Crate of kale, carrots, leeks and mixed vegetables",
    name: "Veg box",
    body: "Roots, greens and whatever the fields gave this week.",
    inside: ["Kale", "Carrots", "Leeks", "Potatoes", "Cabbage"],
    tint: "bg-[#E3EDD8] dark:bg-[#1C2C1F]",
  },
  {
    src: "/images/crate-fruit-cut.webp",
    alt: "Crate of British apples, pears and berries",
    name: "Fruit box",
    body: "Orchard fruit and berries from growers across the county.",
    inside: ["Apples", "Pears", "Plums", "Berries in season"],
    tint: "bg-[#F1E7D6] dark:bg-[#2A2619]",
  },
  {
    src: "/images/crate-surplus-cut.webp",
    alt: "Wooden crate of surplus potatoes, onions and parsnips",
    name: "Surplus box",
    body: "Good produce that missed its order, at a lower price.",
    inside: ["Changes daily", "Whatever's over", "Picked this week"],
    tint: "bg-[#DFE8E3] dark:bg-[#18291F]",
  },
];

const items = [
  { src: "/images/carrots-cut.webp", alt: "Bunch of carrots with tops", name: "Carrots", season: "Jun to Mar" },
  { src: "/images/strawberries-cut.webp", alt: "Punnet of strawberries", name: "Strawberries", season: "May to Sep" },
  { src: "/images/eggs-cut.webp", alt: "Box of free-range eggs", name: "Free-range eggs", season: "All year" },
  { src: "/images/beetroot-cut.webp", alt: "Bunch of beetroot with leaves", name: "Beetroot", season: "Jun to Jan" },
];

export function Shop() {
  return (
    <section id="shop" className="gutter scroll-mt-20 py-24 md:py-36">
      <div className="wrap">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[12ch] text-h2">Boxes and produce from farms nearby.</h2>
          <p className="max-w-[22rem] text-lead text-muted">Order weekly or once, or add single items. Every listing names its farm.</p>
        </div>

        <ul className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3">
          {boxes.map((b) => (
            <li key={b.name}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-raised">
                <div className={`relative grid aspect-[4/4.2] place-items-center overflow-hidden ${b.tint}`}>
                  <Image
                    src={b.src}
                    alt={b.alt}
                    width={900}
                    height={900}
                    sizes="(min-width: 768px) 30vw, 90vw"
                    className="w-[80%] transition-transform duration-700 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:-translate-y-6 [@media(hover:hover)]:group-hover:scale-[0.94]"
                  />
                  {/* What's inside: slides up on hover, always shown on touch */}
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-raised/90 p-4 backdrop-blur-md transition-[transform,opacity] duration-500 ease-[var(--ease-out)] [@media(hover:hover)]:translate-y-[calc(100%+1rem)] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
                    <p className="text-label text-muted">Usually inside</p>
                    <p className="mt-1 text-small font-medium">{b.inside.join(" · ")}</p>
                  </div>
                </div>
                <div className="flex flex-1 items-start justify-between gap-4 p-6">
                  <div>
                    <h3 className="text-h3">{b.name}</h3>
                    <p className="mt-1.5 text-body text-muted">{b.body}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken transition-[transform,background-color] duration-300 ease-[var(--ease-out)] group-hover:rotate-45 group-hover:bg-accent group-hover:text-on-accent">
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-[var(--radius-card)] bg-raised p-2">
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <p className="text-small font-medium">In season singles</p>
            <p className="font-mono text-label text-muted">UK season</p>
          </div>
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((it) => (
              <li key={it.name} className="group flex items-center gap-4 rounded-2xl p-2 pr-4 transition-colors duration-200 hover:bg-sunken">
                <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-sunken transition-colors duration-200 group-hover:bg-raised">
                  <Image src={it.src} alt={it.alt} width={160} height={160} className="size-12 object-contain transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-110" />
                </span>
                <span className="grid min-w-0">
                  <span className="truncate font-medium">{it.name}</span>
                  <span className="font-mono text-label text-muted">{it.season}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
