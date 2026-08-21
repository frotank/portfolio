import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { blobConfigured, getContent } from "@/lib/content";
import { getVisits } from "@/lib/visits";
import LoginForm from "./login-form";
import AdminPanel from "./admin-panel";
import "./admin.css";

export const metadata: Metadata = {
  title: "Pit Wall — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <LoginForm />;
  }
  const [content, visits] = await Promise.all([getContent(), getVisits()]);
  return (
    <AdminPanel
      initial={content}
      visits={visits}
      storageReady={blobConfigured()}
    />
  );
}
