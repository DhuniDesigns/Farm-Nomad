# FarmNomad marketing site

Next.js 16 (App Router) · Tailwind CSS v4 · Motion. Brand v2 tokens live in `src/app/globals.css`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Structure
- `src/app/page.tsx` composes the sections in `src/components/site/`:
  Nav · Hero · Ticker · WhatIs · Dashboard · HowItWorks · Story · Market · Why · Join · Footer
- `src/components/ui.tsx` holds PillLink, Eyebrow, Reveal and Logo.
- `public/images/` holds the imagery generated for FarmNomad in Figma (Farm Nomad file → "Website imagery" page).
  `*-cut.webp` are cut-outs with transparent backgrounds.

## Before launch
- **Waitlist is not stored yet.** `src/app/api/waitlist/route.ts` validates and logs only. Connect it to the
  Spring Boot API or an email list before going live.
- **Clash Grotesk:** add `ClashGrotesk-Medium.woff2` and `ClashGrotesk-Semibold.woff2` to `src/app/fonts/`
  and update the two paths in `src/app/fonts.ts`. Space Grotesk is the stand-in.
- Set `metadataBase` in `src/app/layout.tsx` to the production URL.
- Market listings and dashboard figures are labelled as examples; replace them with live data when the app ships.
- Stat: WRAP, food surplus and waste in UK primary production (2017 data): 3.6m tonnes a year.

## Fonts

- Headlines: General Sans by Indian Type Foundry, loaded from the Fontshare API (see `src/app/layout.tsx`). The ITF Free Font License doesn't allow the font files in a public repository, so don't commit them. If the repo goes private you can self-host them with `next/font/local` instead.
- Body: Outfit. Data and labels: Geist Mono.

## Web app (farmer side)

Signed-in screens live in `src/app/(platform)`:

| Route | Screen |
|---|---|
| `/dashboard/farmer` | KPIs, revenue chart, needs attention, open orders |
| `/products` | Product table with filters, sort, create/edit panel, delete with undo |
| `/orders` | Orders grouped by status, detail panel with progress |
| `/surplus/manage` | Flagged surplus and claims |

Keyboard: `⌘K` command menu, `C` new product, `G` then `D/P/O/S` to jump, `/` filter, `[` collapse sidebar, `⌘↵` save.

Data comes from RTK Query (`src/lib/api/farmnomad.ts`). By default it uses sample data from `src/lib/api/mock`.
To use the Spring Boot API set:

```
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_API_URL=http://localhost:9000/api
```

Endpoints marked `CONFIRM WITH BACKEND` in that file aren't in the documented API yet (farmer orders list, surplus create, revenue analytics).
