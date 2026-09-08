import { NextResponse } from "next/server";

/** Optional Cloudflare Turnstile verification hook. Supabase Auth remains the
 * source of truth; when a Turnstile secret is configured, a token is checked
 * before login or registration continues. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: string } | null;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !body?.token) return NextResponse.json({ ok: true, protected: false });
  const form = new URLSearchParams({ secret, response: body.token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const result = await response.json() as { success?: boolean };
  if (!result.success) return NextResponse.json({ error: "Vérification anti-bot échouée." }, { status: 403 });
  return NextResponse.json({ ok: true, protected: true });
}
