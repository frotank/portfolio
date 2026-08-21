import type { NextRequest } from "next/server";
import { recordVisit } from "@/lib/visits";

/* Landing beacon — the browser POSTs here once per session; the
   visitor's IP and geo come from the request headers (set by
   Vercel's proxy in production). */

export async function POST(req: NextRequest) {
  const h = req.headers;
  const ip =
    (h.get("x-vercel-forwarded-for") ?? h.get("x-forwarded-for") ?? "")
      .split(",")[0]
      .trim() || "unknown";

  let path = "/";
  let referer = "";
  try {
    const body = await req.json();
    path = String(body.path ?? "/").slice(0, 200);
    referer = String(body.referer ?? "").slice(0, 300);
  } catch {
    // beacon without a body — still worth logging
  }

  await recordVisit({
    ts: new Date().toISOString(),
    ip,
    country: h.get("x-vercel-ip-country") ?? "",
    city: decodeURIComponent(h.get("x-vercel-ip-city") ?? ""),
    ua: (h.get("user-agent") ?? "").slice(0, 300),
    referer,
    path,
  });

  return new Response(null, { status: 204 });
}
