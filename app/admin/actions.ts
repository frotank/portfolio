"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  adminConfigured,
  checkPassword,
  createSession,
  destroySession,
  isAdmin,
} from "@/lib/auth";
import {
  blobConfigured,
  saveContent,
  type SiteContent,
} from "@/lib/content";

export interface LoginState {
  error: string | null;
}

/* per-instance brake on brute-force attempts */
let failures = 0;
let lockedUntil = 0;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!adminConfigured()) {
    return {
      error:
        "ADMIN_PASSWORD is not set. Add it to .env.local (and to the Vercel project's environment variables), then restart.",
    };
  }
  if (Date.now() < lockedUntil) {
    return { error: "Too many attempts — box, box. Try again in a minute." };
  }
  const attempt = String(formData.get("password") ?? "").trim();
  if (!checkPassword(attempt)) {
    failures += 1;
    if (failures >= 5) {
      lockedUntil = Date.now() + 60_000;
      failures = 0;
    }
    return { error: "Wrong password." };
  }
  failures = 0;
  await createSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin");
}

export interface SaveResult {
  ok: boolean;
  error?: string;
  updatedAt?: string;
}

export async function saveContentAction(
  content: SiteContent
): Promise<SaveResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Session expired — log in again." };
  }
  if (!blobConfigured()) {
    return {
      ok: false,
      error:
        "Blob storage is not connected. In the Vercel dashboard: Storage → Create → Blob → connect it to this project, then pull the env vars locally (vercel env pull .env.local).",
    };
  }
  try {
    const saved = await saveContent(content);
    revalidatePath("/");
    return { ok: true, updatedAt: saved.updatedAt };
  } catch (err) {
    return {
      ok: false,
      error: `Save failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}
