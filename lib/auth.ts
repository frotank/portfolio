import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/* ============================================================
   ADMIN AUTH — single-editor cookie session.
   The session token is an HMAC over an expiry timestamp, keyed
   by ADMIN_PASSWORD, so changing the password invalidates every
   outstanding session.
   ============================================================ */

const COOKIE = "pw_session";
const SESSION_DAYS = 30;

function secret(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

export function adminConfigured(): boolean {
  return Boolean(secret());
}

function sign(expiry: number): string {
  return createHmac("sha256", `pitwall:${secret()}`)
    .update(String(expiry))
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(attempt: string): boolean {
  const pw = secret();
  return Boolean(pw) && safeEqual(attempt, pw!);
}

export async function createSession(): Promise<void> {
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  (await cookies()).set(COOKIE, `${expiry}.${sign(expiry)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  // no password set → open access, but only in local dev; production
  // without ADMIN_PASSWORD stays locked
  if (!adminConfigured()) return process.env.NODE_ENV !== "production";
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expiry = Number(token.slice(0, dot));
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  return safeEqual(token.slice(dot + 1), sign(expiry));
}
