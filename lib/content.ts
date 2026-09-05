import { list, put, del } from "@vercel/blob";

/* ============================================================
   SITE CONTENT — the editable parts of the portfolio.
   Stored as a versioned JSON document in Vercel Blob; the seed
   below is what ships before the first save (and is the local
   fallback when no BLOB_READ_WRITE_TOKEN is configured).
   ============================================================ */

export interface Experience {
  id: string; // stable slug; the section anchor is #s-<id>
  period: string; // "May 2025 — Dec 2025"
  title: string; // "ZashIt — Builder"
  team: string; // "Project · 8 months"
  description: string;
  circuitLabel: string; // non-empty → shown as a corner on the circuit map
}

export interface Article {
  id: string;
  doc: string; // "Doc 12"
  kind: string; // "Playbook"
  title: string;
  description: string;
  href: string; // external link; empty → renders as a non-link card
  meta1: string; // "Featured"
  meta2: string; // "ValidateIdeaAI"
}

export interface SiteContent {
  experiences: Experience[];
  articles: Article[];
  updatedAt?: string;
}

export const SEED_CONTENT: SiteContent = {
  experiences: [
    {
      id: "zashit",
      period: "May 2025 — Dec 2025",
      title: "ZashIt — Founder, Research & Product",
      team: "Credit card recommendation engine · 8 months",
      description:
        "Modelled how a user's spending mix decides the right card portfolio: statement OCR reads real spending, an expected-rewards model ranks the cards, and the top two surface. One-to-one consulting sessions with high-earning professionals fed straight back into the matching logic.",
      circuitLabel: "",
    },
    {
      id: "fint",
      period: "Sep 2023 — Nov 2023",
      title: "Software Engineer Intern",
      team: "FINT · Internship · Remote · 3 months",
      description:
        "Three months shipping production code in an unfamiliar fintech codebase. Reading someone else's systems fast is its own kind of analysis.",
      circuitLabel: "FINT",
    },
    {
      id: "fpay",
      period: "Sep 2022 — Jun 2023",
      title: "ForeignerPay — Founder, Research & Product Lead",
      team: "UPI access for foreign tourists · Full-time · 10 months",
      description:
        "From a Delhi street corner to NPCI's table: 1,000+ structured tourist interviews to size the problem, RBI's KYC and PPI rules read line by line to find the ₹20,000 wallet provision, and a working UPI model handed to the entity that became one of the first two non-bank UPI providers for foreign nationals.",
      circuitLabel: "",
    },
    {
      id: "college",
      period: "Nov 2021 — Sep 2025",
      title: "BTech, Computer Science",
      team: "Inderprastha Engineering College · The academy years",
      description:
        "The junior formula — CS fundamentals, all-nighters, and learning to finish every race you start.",
      circuitLabel: "COLLEGE",
    },
  ],
  articles: [
    {
      id: "validate-ai",
      doc: "Doc 12",
      kind: "Playbook",
      title: "Smart Decision-Making with AI for Entrepreneurs",
      description:
        "From idea to writing code to generating revenue — how founders can put AI to work at every stage of the build.",
      href: "https://validateideaai.vercel.app/",
      meta1: "Featured",
      meta2: "ValidateIdeaAI",
    },
    {
      id: "inside-fpay",
      doc: "Doc 09",
      kind: "Case study",
      title: "Inside ForeignerPay",
      description:
        "The analyst's debrief: why tourists can't pay in India, the ₹20,000 wallet provision in RBI's KYC rules, and how the model ended up in front of NPCI.",
      href: "",
      meta1: "Case study",
      meta2: "2022–23",
    },
    {
      id: "free-money",
      doc: "Doc 44",
      kind: "Fintech",
      title: "Stop missing out on free money",
      description:
        "What your spending mix says about which credit cards you should actually hold — the rewards model behind ZashIt.",
      href: "https://www.zashit.live/waitlist",
      meta1: "Waitlist open",
      meta2: "ZashIt",
    },
  ],
};

const CONTENT_PREFIX = "site-content/portfolio-";
const KEEP_VERSIONS = 5;

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/* Each save writes a new timestamped blob (immutable URL → no CDN
   staleness) and prunes old versions, keeping a few as backups. */
async function latestContentBlob() {
  const { blobs } = await list({ prefix: CONTENT_PREFIX });
  if (blobs.length === 0) return null;
  return blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1))[0];
}

function sanitize(content: SiteContent): SiteContent {
  const str = (v: unknown, max = 2000) =>
    typeof v === "string" ? v.slice(0, max).trim() : "";
  const slug = (v: unknown, fallback: string) => {
    const s = str(v, 60)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return s || fallback;
  };
  return {
    experiences: (Array.isArray(content.experiences) ? content.experiences : [])
      .slice(0, 50)
      .map((e, i) => ({
        id: slug(e.id, `exp-${i + 1}`),
        period: str(e.period, 120),
        title: str(e.title, 200),
        team: str(e.team, 200),
        description: str(e.description),
        circuitLabel: str(e.circuitLabel, 20).toUpperCase(),
      })),
    articles: (Array.isArray(content.articles) ? content.articles : [])
      .slice(0, 50)
      .map((a, i) => ({
        id: slug(a.id, `art-${i + 1}`),
        doc: str(a.doc, 40),
        kind: str(a.kind, 60),
        title: str(a.title, 200),
        description: str(a.description),
        href: str(a.href, 500),
        meta1: str(a.meta1, 60),
        meta2: str(a.meta2, 60),
      })),
    updatedAt: new Date().toISOString(),
  };
}

export async function getContent(): Promise<SiteContent> {
  if (!blobConfigured()) return SEED_CONTENT;
  try {
    const blob = await latestContentBlob();
    if (!blob) return SEED_CONTENT;
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return SEED_CONTENT;
    const data = (await res.json()) as SiteContent;
    if (!Array.isArray(data.experiences) || !Array.isArray(data.articles)) {
      return SEED_CONTENT;
    }
    return data;
  } catch {
    // storage hiccup — the site must still render
    return SEED_CONTENT;
  }
}

export async function saveContent(raw: SiteContent): Promise<SiteContent> {
  const content = sanitize(raw);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.]/g, "")
    .replace("T", "-")
    .slice(0, 17);
  await put(`${CONTENT_PREFIX}${stamp}.json`, JSON.stringify(content, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
  });
  try {
    const { blobs } = await list({ prefix: CONTENT_PREFIX });
    const stale = blobs
      .sort((a, b) => (a.pathname < b.pathname ? 1 : -1))
      .slice(KEEP_VERSIONS);
    if (stale.length > 0) await del(stale.map((b) => b.url));
  } catch {
    // pruning is best-effort; old versions are harmless
  }
  return content;
}
