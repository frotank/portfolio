import { getContent } from "@/lib/content";
import HomeClient from "./home-client";

/* ISR safety net; publishing from /admin revalidates this page
   immediately via revalidatePath("/") */
export const revalidate = 300;

export default async function Home() {
  const content = await getContent();
  return <HomeClient content={content} />;
}
