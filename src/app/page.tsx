import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Overview } from "@/components/site/Overview";
import { Network } from "@/components/site/Network";
import { Shop } from "@/components/site/Shop";
import { HowItWorks } from "@/components/site/HowItWorks";
import { PromiseLines } from "@/components/site/Promise";
import { Farmers } from "@/components/site/Farmers";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <>
      <a
        href="#what"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-solid focus:px-5 focus:py-3 focus:text-on-solid"
      >
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero />
        <Overview />
        <HowItWorks />
        <Shop />
        <Network />
        <PromiseLines />
        <Farmers />
      </main>
      <Footer />
    </>
  );
}
