"use client";

import { useEffect, useState, useTransition } from "react";
import type { Article, Experience, SiteContent } from "@/lib/content";
import type { Visit } from "@/lib/visits";
import { logoutAction, saveContentAction } from "./actions";

/* ============================================================
   PIT WALL — the operations side of the site. Lists read as
   live timing towers: grid position = render order on the page.
   All edits stay local until Publish.
   ============================================================ */

type Tab = "experiences" | "articles" | "visitors";

const inputCls =
  "w-full rounded-sm border border-line bg-carbon/70 px-3 py-2 text-sm text-silver outline-none transition focus:border-race-purple focus:bg-carbon font-body";
const labelCls = "block font-data text-[11px] uppercase tracking-wider text-dim";

function newExperience(): Experience {
  return {
    id: `exp-${Math.random().toString(36).slice(2, 8)}`,
    period: "",
    title: "",
    team: "",
    description: "",
    circuitLabel: "",
  };
}

function newArticle(n: number): Article {
  return {
    id: `art-${Math.random().toString(36).slice(2, 8)}`,
    doc: `Doc ${String(n).padStart(2, "0")}`,
    kind: "",
    title: "",
    description: "",
    href: "",
    meta1: "",
    meta2: "",
  };
}

function flagEmoji(cc: string): string {
  if (!/^[A-Za-z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(
    ...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  );
}

/* live session clock in the header */
function SessionClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-data text-sm tabular-nums text-silver">
      {now ?? "--:--:--"}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  textarea,
  span2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  span2?: boolean;
}) {
  return (
    <label className={`${labelCls} ${span2 ? "sm:col-span-2" : ""}`}>
      {label}
      {hint && <span className="ml-2 normal-case tracking-normal text-dim/60">{hint}</span>}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${inputCls} mt-1.5 resize-y`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputCls} mt-1.5`}
        />
      )}
    </label>
  );
}

/* one timing-tower row: position, sector tick, entry, controls */
function TimingRow({
  pos,
  accent, // "purple" | "yellow"
  title,
  timeRight,
  sub,
  onUp,
  onDown,
  onDelete,
  canUp,
  canDown,
  children,
}: {
  pos: number;
  accent: "purple" | "yellow";
  title: string;
  timeRight: string;
  sub: string;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  canUp: boolean;
  canDown: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tickColor = accent === "purple" ? "bg-race-purple" : "bg-race-yellow";
  const ctl =
    "grid h-7 w-7 place-items-center rounded-sm border border-line font-data text-xs text-dim transition hover:border-race-purple hover:text-silver disabled:opacity-25 disabled:hover:border-line disabled:hover:text-dim";
  return (
    <div
      className={`pw-row border-b border-line/70 bg-panel/40 ${
        open ? `bg-panel ${accent === "purple" ? "pw-open-purple" : "pw-open-yellow"}` : ""
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <span className="w-8 flex-none font-data text-sm font-bold text-silver">
          P{pos}
        </span>
        <span className={`pw-tick ${tickColor}`} aria-hidden="true" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-baseline gap-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[15px] font-bold uppercase italic tracking-wide">
              {title || (
                <em className="font-body font-normal normal-case not-italic text-dim">
                  New entry — open to edit
                </em>
              )}
            </span>
            <span className="block truncate font-data text-[11px] uppercase text-dim">
              {sub}
            </span>
          </span>
          <span className="hidden flex-none font-data text-xs tabular-nums text-dim sm:block">
            {timeRight}
          </span>
        </button>
        <div className="flex flex-none gap-1.5">
          <button type="button" onClick={onUp} disabled={!canUp} className={ctl} title="Move up the order" aria-label="Move up">
            ↑
          </button>
          <button type="button" onClick={onDown} disabled={!canDown} className={ctl} title="Move down the order" aria-label="Move down">
            ↓
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 w-7 place-items-center rounded-sm border border-race-red/40 font-data text-xs text-red-hot transition hover:bg-race-red/15"
            title="Delete entry"
            aria-label="Delete"
          >
            ✕
          </button>
        </div>
      </div>
      {open && (
        <div className="grid gap-4 border-t border-line/70 p-4 sm:grid-cols-2 sm:p-5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({
  initial,
  visits,
  storageReady,
}: {
  initial: SiteContent;
  visits: Visit[];
  storageReady: boolean;
}) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<Tab>("experiences");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function update(next: SiteContent) {
    setContent(next);
    setDirty(true);
    setStatus(null);
  }

  function move<T>(arr: T[], i: number, delta: number): T[] {
    const next = [...arr];
    const [item] = next.splice(i, 1);
    next.splice(i + delta, 0, item);
    return next;
  }

  function publish() {
    startTransition(async () => {
      const res = await saveContentAction(content);
      if (res.ok) {
        setDirty(false);
        setContent((c) => ({ ...c, updatedAt: res.updatedAt }));
        setStatus({ kind: "ok", msg: "Published — the live site now shows this version." });
      } else {
        setStatus({ kind: "err", msg: res.error ?? "Publish failed." });
      }
    });
  }

  const exps = content.experiences;
  const arts = content.articles;
  const uniqueIps = new Set(visits.map((v) => v.ip)).size;

  /* flag state drives the race-control bar */
  const flag = status?.kind === "err" ? "red" : dirty ? "yellow" : "green";
  const flagCls =
    flag === "red"
      ? "bg-race-red"
      : flag === "yellow"
        ? "bg-race-yellow"
        : "bg-race-green";

  const tabBtn = (t: Tab, label: string, count: number, tick: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      aria-current={tab === t}
      className={`group flex items-center gap-2 border-b-2 px-1 pb-2.5 pt-1 font-display text-sm font-bold uppercase italic tracking-wider transition sm:px-2 ${
        tab === t
          ? "border-race-red text-silver"
          : "border-transparent text-dim hover:text-silver"
      }`}
    >
      <span className={`pw-tick !w-3 ${tick} ${tab === t ? "" : "opacity-30 group-hover:opacity-60"}`} aria-hidden="true" />
      {label}
      <span className="font-data text-[11px] not-italic text-dim">{count}</span>
    </button>
  );

  return (
    <div className="pw-carbon min-h-screen pb-28 font-body text-silver">
      {/* console header */}
      <header className="sticky top-0 z-10 border-b border-line bg-carbon/90 backdrop-blur">
        <div className="pw-kerb" aria-hidden="true" />
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <p className="font-data text-[10px] uppercase tracking-[0.25em] text-dim">
              Car No. 09 · Content console
            </p>
            <h1 className="pw-title font-display font-bold uppercase italic">
              Pit wall
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-5">
            <div className="hidden flex-col items-end gap-1 sm:flex">
              <span className="flex items-center gap-2 font-data text-[10px] uppercase tracking-wider text-dim">
                <span className={`pw-lamp ${storageReady ? "on" : "off"}`} />
                {storageReady ? "Storage linked" : "Storage not linked"}
              </span>
              <SessionClock />
            </div>
            <a
              href="/"
              target="_blank"
              className="rounded-sm border border-line px-3 py-1.5 font-data text-[11px] uppercase tracking-wider text-dim transition hover:border-race-purple hover:text-silver"
            >
              View circuit ↗
            </a>
            <form action={logoutAction}>
              <button className="rounded-sm border border-line px-3 py-1.5 font-data text-[11px] uppercase tracking-wider text-dim transition hover:border-race-red hover:text-silver">
                Leave garage
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* div, not main/section — the site's globals restyle those tags */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <nav className="mt-7 flex gap-5 border-b border-line sm:gap-7" aria-label="Sections">
          {tabBtn("experiences", "Stint history", exps.length, "bg-race-purple")}
          {tabBtn("articles", "Press room", arts.length, "bg-race-yellow")}
          {tabBtn("visitors", "Timing", visits.length, "bg-race-green")}
        </nav>

        {tab === "experiences" && (
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-dim">
                P1 renders first on the site. A{" "}
                <b className="font-medium text-silver">circuit label</b> pins the
                stint to the circuit map.
              </p>
              <button
                type="button"
                onClick={() => update({ ...content, experiences: [newExperience(), ...exps] })}
                className="rounded-sm border border-race-purple/50 px-3 py-1.5 font-data text-[11px] uppercase tracking-wider text-race-purple transition hover:bg-race-purple/15 hover:text-silver"
              >
                + New stint
              </button>
            </div>
            <div className="overflow-hidden rounded-md border border-line">
              {exps.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-dim">
                  No stints on the board. Add your first experience to fill the
                  Stint history section.
                </p>
              )}
              {exps.map((e, i) => (
                <TimingRow
                  key={e.id}
                  pos={i + 1}
                  accent="purple"
                  title={e.title}
                  sub={e.team || "—"}
                  timeRight={e.period}
                  canUp={i > 0}
                  canDown={i < exps.length - 1}
                  onUp={() => update({ ...content, experiences: move(exps, i, -1) })}
                  onDown={() => update({ ...content, experiences: move(exps, i, 1) })}
                  onDelete={() => update({ ...content, experiences: exps.filter((_, j) => j !== i) })}
                >
                  <Field
                    label="Title"
                    value={e.title}
                    placeholder="ZashIt — Builder"
                    onChange={(v) =>
                      update({ ...content, experiences: exps.map((x, j) => (j === i ? { ...x, title: v } : x)) })
                    }
                  />
                  <Field
                    label="Period"
                    value={e.period}
                    placeholder="May 2025 — Dec 2025"
                    onChange={(v) =>
                      update({ ...content, experiences: exps.map((x, j) => (j === i ? { ...x, period: v } : x)) })
                    }
                  />
                  <Field
                    label="Team / role line"
                    value={e.team}
                    placeholder="Project · 8 months"
                    onChange={(v) =>
                      update({ ...content, experiences: exps.map((x, j) => (j === i ? { ...x, team: v } : x)) })
                    }
                  />
                  <Field
                    label="Circuit label"
                    hint="optional · short, e.g. FINT"
                    value={e.circuitLabel}
                    placeholder="Empty = off the map"
                    onChange={(v) =>
                      update({ ...content, experiences: exps.map((x, j) => (j === i ? { ...x, circuitLabel: v } : x)) })
                    }
                  />
                  <Field
                    label="Description"
                    span2
                    textarea
                    value={e.description}
                    placeholder="What you built, shipped, learned…"
                    onChange={(v) =>
                      update({ ...content, experiences: exps.map((x, j) => (j === i ? { ...x, description: v } : x)) })
                    }
                  />
                </TimingRow>
              ))}
            </div>
          </div>
        )}

        {tab === "articles" && (
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-dim">
                P1 renders first in Race reports. Leave the link empty for a
                card that isn&apos;t clickable yet.
              </p>
              <button
                type="button"
                onClick={() => update({ ...content, articles: [newArticle(arts.length + 1), ...arts] })}
                className="rounded-sm border border-race-yellow/50 px-3 py-1.5 font-data text-[11px] uppercase tracking-wider text-race-yellow transition hover:bg-race-yellow/15 hover:text-silver"
              >
                + New report
              </button>
            </div>
            <div className="overflow-hidden rounded-md border border-line">
              {arts.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-dim">
                  The press room is empty. Add your first article to fill the
                  Race reports section.
                </p>
              )}
              {arts.map((a, i) => (
                <TimingRow
                  key={a.id}
                  pos={i + 1}
                  accent="yellow"
                  title={a.title}
                  sub={`${a.doc}${a.kind ? ` · ${a.kind}` : ""}`}
                  timeRight={a.meta2}
                  canUp={i > 0}
                  canDown={i < arts.length - 1}
                  onUp={() => update({ ...content, articles: move(arts, i, -1) })}
                  onDown={() => update({ ...content, articles: move(arts, i, 1) })}
                  onDelete={() => update({ ...content, articles: arts.filter((_, j) => j !== i) })}
                >
                  <Field
                    label="Title"
                    span2
                    value={a.title}
                    placeholder="My next big write-up"
                    onChange={(v) => update({ ...content, articles: arts.map((x, j) => (j === i ? { ...x, title: v } : x)) })}
                  />
                  <Field
                    label="Description"
                    span2
                    textarea
                    value={a.description}
                    placeholder="One or two sentences on what it covers."
                    onChange={(v) => update({ ...content, articles: arts.map((x, j) => (j === i ? { ...x, description: v } : x)) })}
                  />
                  <Field
                    label="Link"
                    span2
                    hint="where the card points"
                    value={a.href}
                    placeholder="https://…"
                    onChange={(v) => update({ ...content, articles: arts.map((x, j) => (j === i ? { ...x, href: v } : x)) })}
                  />
                  <Field
                    label="Doc number"
                    hint="the badge"
                    value={a.doc}
                    placeholder="Doc 21"
                    onChange={(v) => update({ ...content, articles: arts.map((x, j) => (j === i ? { ...x, doc: v } : x)) })}
                  />
                  <Field
                    label="Category"
                    value={a.kind}
                    placeholder="Playbook / Case study / Fintech…"
                    onChange={(v) => update({ ...content, articles: arts.map((x, j) => (j === i ? { ...x, kind: v } : x)) })}
                  />
                  <Field
                    label="Tag, bottom-left"
                    value={a.meta1}
                    placeholder="Featured"
                    onChange={(v) => update({ ...content, articles: arts.map((x, j) => (j === i ? { ...x, meta1: v } : x)) })}
                  />
                  <Field
                    label="Tag, bottom-right"
                    value={a.meta2}
                    placeholder="2026"
                    onChange={(v) => update({ ...content, articles: arts.map((x, j) => (j === i ? { ...x, meta2: v } : x)) })}
                  />
                </TimingRow>
              ))}
            </div>
          </div>
        )}

        {tab === "visitors" && (
          <div className="mt-6">
            <div className="mb-4 grid grid-cols-3 gap-3">
              {(
                [
                  [visits.length, "Sessions"],
                  [uniqueIps, "Unique IPs"],
                  [
                    visits.filter((v) => Date.now() - Date.parse(v.ts) < 86_400_000).length,
                    "Last 24h",
                  ],
                ] as const
              ).map(([n, label]) => (
                <div key={label} className="rounded-md border border-line bg-panel/60 px-4 py-3">
                  <b className="font-data text-xl tabular-nums text-race-green">{n}</b>
                  <p className="font-data text-[10px] uppercase tracking-wider text-dim">{label}</p>
                </div>
              ))}
            </div>
            <p className="mb-3 text-sm text-dim">
              One entry per browser session landing on the site, newest first —
              last 1,000 kept. Reload this page to refresh.
              {visits.length === 0 &&
                " Nothing on the timing screens yet — open the homepage in another tab to log a lap."}
            </p>
            <div className="overflow-hidden rounded-md border border-line">
              {visits.map((v, i) => (
                <div
                  key={`${v.ts}-${i}`}
                  className="pw-row border-b border-line/70 bg-panel/40 px-3 py-2.5 sm:px-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
                    <span className="font-data text-sm text-race-green">{v.ip}</span>
                    <span className="font-data text-xs text-silver">
                      {flagEmoji(v.country)}{" "}
                      {[v.city, v.country].filter(Boolean).join(", ") || "location unknown"}
                    </span>
                    <span className="ml-auto font-data text-xs tabular-nums text-dim">
                      {new Date(v.ts).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-data text-[11px] text-dim">
                    {v.path}
                    {v.referer ? ` · from ${v.referer}` : ""}
                    {v.ua ? ` · ${v.ua}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* race control — publish bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 sm:px-6">
          <span className={`h-8 w-2.5 flex-none rounded-sm ${flagCls}`} aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate font-data text-xs text-dim">
            <span className="mr-2 hidden uppercase tracking-[0.2em] text-dim/70 sm:inline">
              Race control
            </span>
            {status ? (
              <span className={status.kind === "ok" ? "text-race-green" : "text-red-hot"}>
                {status.msg}
              </span>
            ) : dirty ? (
              <span className="text-race-yellow">
                Yellow flag — changes here aren&apos;t on the live site yet.
              </span>
            ) : content.updatedAt ? (
              `Track clear — live version from ${new Date(content.updatedAt).toLocaleString()}`
            ) : (
              "Track clear — showing the built-in starting content."
            )}
          </p>
          <button
            type="button"
            onClick={publish}
            disabled={pending || !dirty}
            className="flex-none rounded-sm bg-race-red px-7 py-2.5 font-display text-sm font-bold uppercase italic tracking-wider text-white transition hover:bg-red-hot disabled:opacity-40"
          >
            {pending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
