import type { PlantingAdvice, WeatherConditions } from "@/lib/types/api";
import { api } from "./farmnomad";

/**
 * Weather & planting (spec §7.13), all through the Spring Boot API:
 *   GET /weather/conditions?lat=&lon= → WeatherConditions (soil temp at 6 cm, frost risk, rain)
 *   GET /weather/planting?lat=&lon=   → PlantingAdvice    (readyToPlantOut / readyToSow, with blockers and warnings)
 * The crop calendar lives in the AI service; there is deliberately no calendar in this codebase.
 * CONFIRM WITH BACKEND: paths and response fields.
 */
type At = { lat: number; lon: number };

const weatherApi = api.injectEndpoints({
  endpoints: (b) => ({
    conditions: b.query<WeatherConditions, At>({ query: ({ lat, lon }) => ({ url: "/weather/conditions", params: { lat, lon } }) }),
    planting: b.query<PlantingAdvice, At>({ query: ({ lat, lon }) => ({ url: "/weather/planting", params: { lat, lon } }) }),
  }),
});

export const { useConditionsQuery, usePlantingQuery } = weatherApi;

export type Place = { lat: number; lon: number; postcode: string; name: string };

/**
 * UK postcode → coordinates via postcodes.io (public, no key), called straight from the browser.
 * Not part of our API on purpose: it's a free lookup with no secrets.
 */
export async function lookupPostcode(postcode: string): Promise<Place> {
  const clean = postcode.trim().toUpperCase();
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
  const json = (await res.json().catch(() => null)) as { status?: number; result?: { latitude: number; longitude: number; postcode: string; admin_district?: string; parish?: string; region?: string } } | null;
  if (!res.ok || !json?.result) throw new Error(res.status === 404 ? "We couldn't find that postcode." : "Postcode lookup isn't working right now.");
  const r = json.result;
  return { lat: r.latitude, lon: r.longitude, postcode: r.postcode, name: r.admin_district ?? r.parish ?? r.region ?? r.postcode };
}
