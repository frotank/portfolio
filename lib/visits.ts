import { get, put } from "@vercel/blob";
import { blobConfigured } from "./content";

/* ============================================================
   VISITOR LOG — one rolling JSON file in Blob (private access),
   newest first, capped. Best-effort: a lost entry must never
   break the site. Falls back to in-memory storage in local dev
   when Blob isn't configured (resets on server restart).
   ============================================================ */

export interface Visit {
  ts: string; // ISO timestamp
  ip: string;
  country: string;
  city: string;
  ua: string;
  referer: string;
  path: string;
}

const LOG_PATH = "visits/log.json";
const MAX_VISITS = 1000;

/* the API route and the admin page are bundled separately, so a
   plain module-level array would be duplicated — share via globalThis */
const g = globalThis as typeof globalThis & { __visitLog?: Visit[] };

function memoryLog(): Visit[] {
  g.__visitLog ??= [];
  return g.__visitLog;
}

async function readLog(): Promise<Visit[]> {
  try {
    const res = await get(LOG_PATH, { access: "private" });
    if (!res || res.statusCode !== 200) return [];
    const data = JSON.parse(await new Response(res.stream).text());
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function recordVisit(v: Visit): Promise<void> {
  if (!blobConfigured()) {
    g.__visitLog = [v, ...memoryLog()].slice(0, MAX_VISITS);
    return;
  }
  try {
    const log = [v, ...(await readLog())].slice(0, MAX_VISITS);
    await put(LOG_PATH, JSON.stringify(log), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch {
    // best-effort — never let logging break a visit
  }
}

export async function getVisits(): Promise<Visit[]> {
  if (!blobConfigured()) return memoryLog();
  return readLog();
}
