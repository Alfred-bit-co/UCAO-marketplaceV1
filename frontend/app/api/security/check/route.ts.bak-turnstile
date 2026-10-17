import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const attempts = new Map<string, number[]>();

function clientKey(request: Request): string {
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return vercelIp || forwardedIp || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recentAttempts = (attempts.get(key) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recentAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    attempts.set(key, recentAttempts);
    return true;
  }
  recentAttempts.push(now);
  attempts.set(key, recentAttempts);
  return false;
}

/**
 * Local fallback for login/signup abuse. When Turnstile is configured, a valid
 * token is also mandatory. Supabase Auth remains the source of truth.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { action?: string; token?: string } | null;
  if (!body || !["login", "register"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "Requête de sécurité invalide." }, { status: 400 });
  }

  if (isRateLimited(`${body.action}:${clientKey(request)}`)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000) } },
    );
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return NextResponse.json({ ok: true, protected: false, rateLimited: true });
  if (!body.token) {
    return NextResponse.json({ error: "Vérification anti-bot requise." }, { status: 403 });
  }

  const form = new URLSearchParams({ secret, response: body.token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(5_000),
  }).catch(() => null);
  if (!response?.ok) {
    return NextResponse.json({ error: "Vérification anti-bot indisponible. Réessayez." }, { status: 503 });
  }
  const result = await response.json() as { success?: boolean };
  if (!result.success) return NextResponse.json({ error: "Vérification anti-bot échouée." }, { status: 403 });
  return NextResponse.json({ ok: true, protected: true });
}
