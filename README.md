# Portfolio — Gunesh Munjal

F1-themed portfolio for a business & product analyst (fintech and payments),
built with Next.js and deployed on Vercel. The downloadable analyst CV lives at
`public/Gunesh-Munjal-Analyst-CV.pdf` (source in `cv/`).

## Editing content (no code needed)

Go to **`/admin`** on the live site (or `http://localhost:3000/admin` in dev),
log in with the admin password, and edit **Experiences** (Stint history) and
**Articles** (Race reports). Hit **Publish** — the homepage updates
immediately. An experience with a **circuit label** also appears as a corner
on the circuit map in the timing tower.

## One-time setup

1. **Admin password** — set `ADMIN_PASSWORD` in `.env.local` (local) and in
   Vercel → Project → Settings → Environment Variables (production), then
   redeploy.
2. **Blob storage** (where published content lives) — Vercel dashboard →
   **Storage → Create Database → Blob**, connect it to this project. That sets
   `BLOB_READ_WRITE_TOKEN` in production automatically. For local publishing,
   pull it down with:

   ```bash
   npm i -g vercel   # if not installed
   vercel link
   vercel env pull .env.local
   ```

Until Blob is connected, the site renders the built-in seed content and the
admin panel shows a setup hint when you try to publish.

## How it works

- `lib/content.ts` — content types, seed data, Blob read/write (each publish
  writes a new versioned JSON blob and keeps the last 5 as backups).
- `app/admin/` — password-protected editor (cookie session, server actions).
- `app/page.tsx` — server component that loads content and revalidates on
  publish; `app/home-client.tsx` renders the site.

## Development

```bash
npm run dev
```
