import { NextResponse } from "next/server";

const ROLES = new Set(["Farmer", "Customer", "Community group", "Driver"]);

// TODO(launch): persist signups. Options: forward to the Spring Boot API
// (POST /api/waitlist), or a Vercel-integrated store or email list (e.g. Resend audience).
// Until then signups are only logged on the server and are NOT stored.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { email, role } = (body ?? {}) as { email?: string; role?: string };
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 });
  }
  if (!role || !ROLES.has(role)) {
    return NextResponse.json({ error: "Choose a role" }, { status: 422 });
  }
  console.info("[waitlist]", { role, domain: email.split("@")[1] });
  return NextResponse.json({ ok: true });
}
