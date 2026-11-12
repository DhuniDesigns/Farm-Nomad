"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, EnvelopeSimple, MapPin } from "@phosphor-icons/react/dist/ssr";
import { useRef } from "react";
import { Join } from "@/components/site/Join";
import { Logo } from "@/components/ui";

const ease = [0.23, 1, 0.32, 1] as const;

const cols = [
  { title: "Explore", links: [["Shop", "#shop"], ["How it works", "#how"], ["Food groups", "#surplus"], ["For farmers", "#farmers"]] },
  { title: "Join as", links: [["Customer", "#join"], ["Farmer", "#join"], ["Community group", "#join"], ["Driver", "#join"]] },
] as const;

export function Footer() {
  const reduce = useReducedMotion();
  const band = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: band, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "10%"]);

  return (
    <>
      {/* Contact band: full-bleed field photo, copy left, form card right */}
      <section ref={band} aria-labelledby="join-title" className="relative isolate mt-24 overflow-hidden bg-forest text-on-forest md:mt-36">
        <motion.div className="absolute inset-x-0 -inset-y-[10%] -z-10" style={{ y }}>
          <Image src="/images/gate-dusk.webp" alt="" fill sizes="100vw" className="object-cover object-[30%_60%]" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(10_20_14/0.82)_0%,rgb(10_20_14/0.55)_45%,rgb(10_20_14/0.2)_100%)]" />

        <div className="gutter py-20 md:py-28">
          <div className="wrap grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-20">
            <div>
              <h2 id="join-title" className="max-w-[12ch] text-h2">Be first on FarmNomad.</h2>
              <p className="mt-6 max-w-[40ch] text-lead text-on-forest/80">
                We&apos;re opening in Lancashire first. Tell us who you are and we&apos;ll email you when your side of FarmNomad is ready.
              </p>
              <ul className="mt-10 grid gap-3 text-body">
                <li>
                  <a href="mailto:hello@farmnomad.co.uk" className="inline-flex items-center gap-3 transition-colors duration-200 hover:text-accent">
                    <EnvelopeSimple aria-hidden className="size-5 text-accent" />
                    hello@farmnomad.co.uk
                  </a>
                </li>
                <li className="inline-flex items-center gap-3">
                  <MapPin aria-hidden className="size-5 text-accent" />
                  Lancashire, United Kingdom
                </li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] bg-raised p-6 text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)] md:p-8">
              <Join />
            </div>
          </div>
        </div>
      </section>

      {/* Footer, Farmrow style: brand and columns, a big tone-on-tone wordmark, a quiet bottom bar */}
      <footer className="bg-[#0B1710] text-on-forest">
        <div className="gutter pb-8 pt-20 md:pt-24">
          <div className="wrap">
            <div className="grid gap-12 md:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))] md:gap-8">
              <div className="max-w-[22rem]">
                <Logo tone="on-dark" />
                <p className="mt-6 text-body text-on-forest/60">
                  A marketplace and delivery network for growers, buyers and community food groups. Starting in Lancashire.
                </p>
              </div>

              {cols.map((c) => (
                <nav key={c.title} aria-label={c.title}>
                  <p className="mb-4 text-small text-on-forest/45">{c.title}</p>
                  <ul className="grid gap-1">
                    {c.links.map(([label, href]) => (
                      <li key={label}>
                        <a href={href} className="group inline-flex min-h-9 items-center gap-1 text-body text-on-forest/90 transition-colors duration-200 hover:text-on-forest">
                          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 ease-[var(--ease-out)] group-hover:bg-[length:100%_1px]">
                            {label}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}

              <div>
                <p className="mb-4 text-small text-on-forest/45">Contact</p>
                <ul className="grid gap-1 text-body">
                  <li>
                    <a href="mailto:hello@farmnomad.co.uk" className="group inline-flex min-h-9 items-center gap-1 text-on-forest/90 transition-colors hover:text-on-forest">
                      hello@farmnomad.co.uk
                      <ArrowUpRight aria-hidden className="size-4 opacity-50 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                  <li className="min-h-9 py-1.5 text-on-forest/60">Lancashire, UK</li>
                </ul>
              </div>
            </div>

            {/* Big wordmark, tinted a step above the ground, rises into place once */}
            <div aria-hidden className="mt-20 overflow-hidden md:mt-28">
              <motion.div
                initial={reduce ? false : { transform: "translateY(35%)", opacity: 0 }}
                whileInView={{ transform: "translateY(0%)", opacity: 1 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 1.3, ease }}
                className="aspect-[178/36] w-full bg-[#1A3020] [mask:url(/logo-mono.svg)_center/contain_no-repeat]"
              />
            </div>

            <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-7 text-small text-on-forest/45 md:mt-14 md:flex-row md:justify-between">
              <p>© 2026 FarmNomad. Built in Lancashire.</p>
              <p>Statistic: WRAP. Photographs generated for FarmNomad.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
