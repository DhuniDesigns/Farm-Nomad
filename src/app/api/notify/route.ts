import { NextResponse } from "next/server";

// "Notify me" sign-ups for features that aren't live yet (e.g. group buying).
// TODO: persist these (database table or email list) before launch. For now the request is
// validated and logged only, and nothing is stored.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const { email, topic } = (body ?? {}) as { email?: string; topic?: string };
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }
  console.info("[notify]", { topic: topic ?? "general", at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
