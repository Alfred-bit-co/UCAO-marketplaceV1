import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const MAX_TRACKED_KEYS = 5_000;
const attempts = new Map<string, number[]>();

function clientKey(request: Request): string {
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return vercelIp || forwardedIp || "unknown";
}

// Évite que la mémoire grossisse indéfiniment : on oublie les adresses sans tentative récente.
function pruneAttempts(now: number) {
  if (attempts.size <= MAX_TRACKED_KEYS) return;
  for (const [key, times] of attempts) {
    if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) attempts.delete(key);
  }
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  pruneAttempts(now);
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
 * Limite de débit de confort pour la connexion et l'inscription.
 *
 * Cette route ne vérifie PAS le jeton Turnstile : un jeton ne sert qu'une fois, et c'est
 * Supabase Auth (option « CAPTCHA protection ») qui le vérifie, côté serveur, au moment
 * de créer le compte ou de connecter. C'est la seule vérification qu'un script ne peut pas
 * contourner en appelant Supabase directement. La mémoire de cette route est propre à chaque
 * instance serverless : la limite est donc indicative, pas absolue.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  if (!body || !["login", "register"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "Requête de sécurité invalide." }, { status: 400 });
  }

  if (isRateLimited(`${body.action}:${clientKey(request)}`)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000) } },
    );
  }

  return NextResponse.json({ ok: true });
}
