import localFont from "next/font/local";

// Headlines: General Sans by Indian Type Foundry, loaded from the Fontshare API in layout.tsx.
// The ITF Free Font License doesn't allow the font files in a public repository,
// so they are not committed here.

export const outfit = localFont({
  src: [
    { path: "./fonts/outfit-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/outfit-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/outfit-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});

export const mono = localFont({
  src: [
    { path: "./fonts/geist-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/geist-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});
