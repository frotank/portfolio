"use client";

import { useEffect } from "react";

/* the journey circuit: corners in page order; each one's track position is
   computed from where its section actually sits in the document */
const CORNERS = [
  { label: "GRID", target: "#grid-hero" },
  { label: "TELEMETRY", target: "#telemetry" },
  { label: "FPAY", target: "#p-fpay" },
  { label: "VALIDATE", target: "#p-validate" },
  { label: "ZASHIT", target: "#p-zashit" },
  { label: "SNEAKER SAGE", target: "#p-sneaker" },
  { label: "SANKHYA", target: "#p-sankhya" },
  { label: "STOCKAPP", target: "#p-stockapp" },
  { label: "FINT", target: "#s-fint" },
  { label: "COLLEGE", target: "#s-college" },
  { label: "RADIO", target: "#radio" },
];

export default function Home() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ac = new AbortController();
    const sig = ac.signal;

    /* 3D car: no auto-rotation for reduced-motion visitors */
    const car3d = document.getElementById("car3d");
    if (car3d && reduced) car3d.removeAttribute("auto-rotate");

    /* speed rush — fast scrolling reads as carrying pace down a straight */
    let lastY = scrollY,
      lastT = performance.now(),
      spTimer: ReturnType<typeof setTimeout> | null = null;
    addEventListener(
      "scroll",
      function () {
        const now = performance.now();
        const v = Math.abs(scrollY - lastY) / Math.max(1, now - lastT);
        lastY = scrollY;
        lastT = now;
        if (v > 2.4 && !reduced) {
          document.body.classList.add("speeding");
          if (spTimer) clearTimeout(spTimer);
          spTimer = setTimeout(function () {
            document.body.classList.remove("speeding");
          }, 240);
        }
      },
      { passive: true, signal: sig }
    );

    /* ============================================================
       ENGINE AUDIO — synthesized, no files
       ============================================================ */
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    let actx: AudioContext | null = null,
      master: GainNode | null = null,
      idleOsc: OscillatorNode | null = null,
      idleGain: GainNode | null = null,
      muted = false;
    const toggle = document.getElementById("sound-toggle")!;

    function initAudio() {
      if (actx || !AC) return;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(actx.destination);
    }
    function setMuted(m: boolean) {
      muted = m;
      toggle.textContent = m ? "🔇" : "🔊";
      if (master && actx)
        master.gain.setTargetAtTime(m ? 0 : 0.5, actx.currentTime, 0.05);
    }
    toggle.addEventListener(
      "click",
      function () {
        initAudio();
        setMuted(!muted);
      },
      { signal: sig }
    );

    function noiseBuf(dur: number) {
      const b = actx!.createBuffer(1, actx!.sampleRate * dur, actx!.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }
    function ignition() {
      if (!actx) return;
      const t = actx.currentTime;
      const src = actx.createBufferSource();
      src.buffer = noiseBuf(0.4);
      const f = actx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 500;
      f.Q.value = 1;
      const g = actx.createGain();
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      src.connect(f);
      f.connect(g);
      g.connect(master!);
      src.start(t);

      idleOsc = actx.createOscillator();
      idleOsc.type = "sawtooth";
      idleGain = actx.createGain();
      const lp = actx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 700;
      idleOsc.frequency.setValueAtTime(30, t);
      idleOsc.frequency.exponentialRampToValueAtTime(62, t + 0.5);
      idleGain.gain.setValueAtTime(0.0001, t);
      idleGain.gain.exponentialRampToValueAtTime(0.3, t + 0.5);
      idleOsc.connect(lp);
      lp.connect(idleGain);
      idleGain.connect(master!);
      idleOsc.start(t);
    }
    function revTo(freq: number) {
      if (!idleOsc || !actx) return;
      const t = actx.currentTime;
      idleOsc.frequency.cancelScheduledValues(t);
      idleOsc.frequency.setValueAtTime(idleOsc.frequency.value, t);
      idleOsc.frequency.exponentialRampToValueAtTime(freq, t + 0.28);
    }
    function killIdle() {
      if (!idleOsc || !actx) return;
      const t = actx.currentTime;
      idleGain!.gain.setTargetAtTime(0.0001, t, 0.08);
      idleOsc.stop(t + 0.5);
      idleOsc = null;
    }
    function flybySound() {
      if (!actx) return;
      const t = actx.currentTime;
      (
        [
          ["sawtooth", 1],
          ["square", 0.45],
        ] as [OscillatorType, number][]
      ).forEach(function (cfg) {
        const o = actx!.createOscillator(),
          g = actx!.createGain(),
          f = actx!.createBiquadFilter();
        o.type = cfg[0];
        f.type = "lowpass";
        f.frequency.setValueAtTime(3200, t);
        f.frequency.exponentialRampToValueAtTime(500, t + 1.25);
        o.frequency.setValueAtTime(85, t);
        o.frequency.exponentialRampToValueAtTime(640, t + 0.55); /* approach — pitch climbs */
        o.frequency.exponentialRampToValueAtTime(52, t + 1.25); /* doppler drop as it passes */
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.5 * cfg[1], t + 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
        o.connect(f);
        f.connect(g);
        g.connect(master!);
        o.start(t);
        o.stop(t + 1.35);
      });
      const src = actx.createBufferSource();
      src.buffer = noiseBuf(1.3);
      const bp = actx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(2600, t);
      bp.frequency.exponentialRampToValueAtTime(220, t + 1.25);
      const ng = actx.createGain();
      ng.gain.setValueAtTime(0.001, t);
      ng.gain.exponentialRampToValueAtTime(0.22, t + 0.55);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
      src.connect(bp);
      bp.connect(ng);
      ng.connect(master!);
      src.start(t);
    }

    /* ============================================================
       LAUNCH SEQUENCE
       ============================================================ */
    const gantry = document.getElementById("gantry")!;
    const msg = document.getElementById("gantry-msg")!;
    const pods = gantry.querySelectorAll(".pod");
    const flyby = document.getElementById("flyby")!;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let launched = false;

    function launchDone() {
      if (launched) return;
      launched = true;
      timers.forEach(clearTimeout);
      killIdle();
      gantry.classList.add("away");
      document.body.classList.add("launched");
      setTimeout(function () {
        gantry.classList.add("gone");
        document.body.style.overflow = "";
      }, 900);
    }

    function runSequence(silent: boolean) {
      initAudio();
      if (silent) setMuted(true);
      gantry.classList.add("armed");
      msg.textContent = "Engine running · lights in sequence";
      ignition();
      const base = 700,
        step = 420;
      pods.forEach(function (pod, i) {
        timers.push(
          setTimeout(function () {
            pod.classList.add("on");
            revTo(70 + i * 22);
          }, base + i * step)
        );
      });
      const outAt = base + 5 * step + 650;
      timers.push(
        setTimeout(function () {
          pods.forEach(function (p) {
            p.classList.remove("on");
          });
          msg.innerHTML = "It's <strong>lights out</strong> and away we go";
          gantry.classList.add("flying");
          killIdle();
          flybySound();
          flyby.classList.add("go");
        }, outAt)
      );
      timers.push(setTimeout(launchDone, outAt + 1300));
    }

    if (reduced) {
      document.body.classList.add("launched");
      gantry.classList.add("gone");
    } else if (!gantry.classList.contains("gone")) {
      document.body.style.overflow = "hidden";
      document.getElementById("start-engine")!.addEventListener(
        "click",
        function (e) {
          e.stopPropagation();
          runSequence(false);
        },
        { signal: sig }
      );
      document.getElementById("run-silent")!.addEventListener(
        "click",
        function (e) {
          e.stopPropagation();
          runSequence(true);
        },
        { signal: sig }
      );
      /* once armed, a later click anywhere skips */
      gantry.addEventListener(
        "click",
        function () {
          if (gantry.classList.contains("armed")) launchDone();
        },
        { signal: sig }
      );
    }

    /* ---- Scroll reveal ---- */
    const rv = document.querySelectorAll(".rv");
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduced) {
      io = new IntersectionObserver(
        function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io!.unobserve(e.target);
            }
          });
        },
        { threshold: 0.18 }
      );
      rv.forEach(function (el) {
        io!.observe(el);
      });
    } else {
      rv.forEach(function (el) {
        el.classList.add("in");
      });
    }

    /* ---- Timing-tower scrollspy ---- */
    const links = document.querySelectorAll("#tower a");
    const secs: { a: Element; t: Element }[] = [];
    links.forEach(function (a) {
      const t = document.querySelector(a.getAttribute("href")!);
      if (t) secs.push({ a: a, t: t });
    });
    const spy = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            links.forEach(function (a) {
              a.classList.remove("live");
            });
            const hit = secs.find(function (s) {
              return s.t === e.target;
            });
            if (hit) {
              hit.a.classList.add("live");
              paintMarks();
            }
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    secs.forEach(function (s) {
      spy.observe(s.t);
    });

    /* ============================================================
       CIRCUIT MAP — the career journey fills in as you drive the page
       ============================================================ */
    const prog = document.getElementById(
      "trk-prog"
    ) as unknown as SVGPathElement;
    const carDot = document.getElementById("trk-car")!;
    const marks = document.getElementById("trk-marks")!;
    const status = document.getElementById("lap-status");
    const dots: SVGCircleElement[] = [],
      labels: SVGTextElement[] = [],
      fracs: number[] = CORNERS.map(function () {
        return 0;
      });
    let L = 0,
      lapP = 0;

    function paintMarks() {
      let active = 0;
      fracs.forEach(function (f, i) {
        if (f <= lapP) active = i;
      });
      dots.forEach(function (d, i) {
        d.setAttribute(
          "class",
          "cp" + (i === active ? " active" : fracs[i] < lapP ? " passed" : "")
        );
        labels[i].setAttribute(
          "class",
          "cl" + (i === active ? " active" : fracs[i] < lapP ? " passed" : "")
        );
      });
      if (status)
        status.textContent =
          "T" +
          (active + 1) +
          " · " +
          CORNERS[active].label +
          " — " +
          Math.round(lapP * 100) +
          "% lap";
    }

    try {
      marks.innerHTML = "";
      L = prog.getTotalLength();
      prog.style.strokeDasharray = String(L);
      prog.style.strokeDashoffset = String(L);
      const SVGNS = "http://www.w3.org/2000/svg";
      CORNERS.forEach(function (cn) {
        const c = document.createElementNS(SVGNS, "circle");
        c.setAttribute("r", "5");
        c.setAttribute("class", "cp");
        const t = document.createElementNS(SVGNS, "text");
        t.setAttribute("class", "cl");
        t.textContent = cn.label;
        function goto() {
          const el = document.querySelector(cn.target);
          if (el)
            el.scrollIntoView({
              behavior: reduced ? "auto" : "smooth",
              block: "center",
            });
        }
        c.addEventListener("click", goto, { signal: sig });
        t.addEventListener("click", goto, { signal: sig });
        marks.appendChild(c);
        marks.appendChild(t);
        dots.push(c);
        labels.push(t);
      });

      /* each corner sits at the scroll fraction where its section is
         centered on screen, so the car dot and the lit label always
         agree with what the visitor is actually looking at */
      function layoutMarks() {
        const max = document.documentElement.scrollHeight - innerHeight;
        CORNERS.forEach(function (cn, i) {
          const el = document.querySelector(cn.target);
          if (el && max > 0) {
            const r = el.getBoundingClientRect();
            const mid = scrollY + r.top + r.height / 2 - innerHeight / 2;
            fracs[i] = Math.min(0.99, Math.max(0.02, mid / max));
          }
          const pt = prog.getPointAtLength(L * fracs[i]);
          const left = pt.x > 100;
          dots[i].setAttribute("cx", String(pt.x));
          dots[i].setAttribute("cy", String(pt.y));
          labels[i].setAttribute("x", String(left ? pt.x - 10 : pt.x + 10));
          labels[i].setAttribute("y", String(pt.y + 3));
          labels[i].setAttribute("text-anchor", left ? "end" : "start");
        });
      }
      layoutMarks();
      function relayout() {
        layoutMarks();
        paintMarks();
      }
      addEventListener("resize", relayout, { passive: true, signal: sig });
      addEventListener("load", relayout, { signal: sig });

      let ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          const max = document.documentElement.scrollHeight - innerHeight;
          lapP = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
          prog.style.strokeDashoffset = String(L * (1 - lapP));
          const pt = prog.getPointAtLength(L * lapP);
          carDot.setAttribute("cx", String(pt.x));
          carDot.setAttribute("cy", String(pt.y));
          paintMarks();
          if (lapP >= 0.98) lapComplete();
        });
      }
      addEventListener("scroll", onScroll, { passive: true, signal: sig });
      onScroll();
    } catch {
      /* circuit hidden (mobile) or unsupported — tab bar still works */
    }

    /* ============================================================
       LAP COMPLETE — race control notification
       ============================================================ */
    const toast = document.getElementById("lap-toast")!;
    let lapDone = false,
      toastTimer: ReturnType<typeof setTimeout> | null = null;
    function lapChime() {
      if (!actx || muted) return;
      const t = actx.currentTime;
      [
        [880, 0],
        [1174.7, 0.14],
      ].forEach(function (n) {
        const o = actx!.createOscillator(),
          g = actx!.createGain();
        o.type = "sine";
        o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t + n[1]);
        g.gain.exponentialRampToValueAtTime(0.25, t + n[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.22);
        o.connect(g);
        g.connect(master!);
        o.start(t + n[1]);
        o.stop(t + n[1] + 0.25);
      });
    }
    function lapComplete() {
      if (lapDone) return;
      lapDone = true;
      toast.classList.add("show");
      lapChime();
      toastTimer = setTimeout(hideToast, 9000);
    }
    function hideToast() {
      if (toastTimer) clearTimeout(toastTimer);
      toast.classList.remove("show");
    }
    document
      .getElementById("lap-close")!
      .addEventListener("click", hideToast, { signal: sig });
    document.getElementById("lap-again")!.addEventListener(
      "click",
      function () {
        hideToast();
        scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      },
      { signal: sig }
    );

    /* lap bar + fallback lap-complete trigger, all screen sizes */
    const lapbar = document.getElementById("lapbar")!;
    let barTick = false;
    function topBar() {
      if (barTick) return;
      barTick = true;
      requestAnimationFrame(function () {
        barTick = false;
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? Math.min(1, scrollY / max) : 0;
        lapbar.style.width = p * 100 + "%";
        if (p >= 0.98) lapComplete();
      });
    }
    addEventListener("scroll", topBar, { passive: true, signal: sig });
    topBar();

    /* park the 3D car when it leaves the viewport — no WebGL frames offscreen */
    let heroVis: IntersectionObserver | null = null;
    if (car3d && !reduced) {
      heroVis = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) car3d.setAttribute("auto-rotate", "");
          else car3d.removeAttribute("auto-rotate");
        });
      });
      heroVis.observe(car3d);
    }

    return () => {
      ac.abort();
      timers.forEach(clearTimeout);
      if (spTimer) clearTimeout(spTimer);
      if (toastTimer) clearTimeout(toastTimer);
      if (io) io.disconnect();
      if (heroVis) heroVis.disconnect();
      spy.disconnect();
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* CIRCUIT BACKDROP */}
      <svg
        id="track-bg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <path
            id="rib1"
            d="M-120 790 C240 764 430 630 528 434 C608 278 764 184 1004 172 C1188 162 1330 92 1580 34"
          />
          <path
            id="rib2"
            d="M-80 210 C140 260 240 380 260 560 C278 724 420 830 640 860 C860 890 1080 850 1520 880"
          />
          <linearGradient
            id="rlGrad"
            x1="0"
            y1="900"
            x2="1440"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#A855F7" />
            <stop offset=".55" stopColor="#E10600" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <filter id="asphalt">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="1"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.035 0"
            />
          </filter>
          <linearGradient id="trailR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#E10600" stopOpacity="0" />
            <stop offset="1" stopColor="#FF5A45" stopOpacity=".55" />
          </linearGradient>
          <linearGradient id="trailT" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#27F4D2" stopOpacity="0" />
            <stop offset="1" stopColor="#27F4D2" stopOpacity=".45" />
          </linearGradient>
          {/* detailed top-down car, recolorable via --c1/--c2 */}
          <g id="carTop">
            <rect x="-27" y="-9.5" width="5.5" height="19" rx="1.5" fill="var(--c2)" />
            <rect x="-25.6" y="-7.5" width="1.2" height="15" fill="#0A0D14" opacity=".5" />
            <rect x="-21" y="-11.5" width="8.5" height="5.5" rx="2.2" fill="#111318" />
            <rect x="-21" y="6" width="8.5" height="5.5" rx="2.2" fill="#111318" />
            <path d="M-22 -6.5 L-4 -7.5 L6 -6 L6 6 L-4 7.5 L-22 6.5 Z" fill="var(--c2)" />
            <path
              d="M-24 -3.4 L-8 -4.6 L4 -3.4 L22 -1.6 L26.5 0 L22 1.6 L4 3.4 L-8 4.6 L-24 3.4 Z"
              fill="var(--c1)"
            />
            <path d="M-24 0 L20 0" stroke="var(--c2)" strokeWidth="1" opacity=".7" />
            <circle cx="-6" cy="0" r="2" fill="var(--c2)" />
            <circle cx="0" cy="0" r="3.2" fill="none" stroke="#1A2030" strokeWidth="1.4" />
            <circle cx="0" cy="0" r="1.7" fill="#EDF1F8" />
            <rect x="9" y="-10" width="7.5" height="4.6" rx="2" fill="#111318" />
            <rect x="9" y="5.4" width="7.5" height="4.6" rx="2" fill="#111318" />
            <path
              d="M20 -10.5 L26 -10.5 L27.5 -1.5 L27.5 1.5 L26 10.5 L20 10.5 L21.5 0 Z"
              fill="var(--c2)"
            />
          </g>
        </defs>

        {/* tarmac grain over everything */}
        <rect width="1440" height="900" filter="url(#asphalt)" />

        {/* secondary ribbon, far side of the circuit */}
        <g fill="none" opacity=".6">
          <use href="#rib2" className="edge" strokeWidth="132" />
          <use href="#rib2" className="road" strokeWidth="124" />
          <use href="#rib2" className="mid" strokeWidth="1.6" />
        </g>

        {/* main ribbon, pit straight through the esses */}
        <g fill="none">
          <use href="#rib1" className="edge" strokeWidth="200" />
          <use href="#rib1" className="road" strokeWidth="190" />
          <use href="#rib1" className="mid" strokeWidth="2" />
          {/* kerbs on the inside of the curves */}
          <path
            className="kerbline"
            d="M420 560 C480 470 520 400 560 340"
            stroke="#E10600"
            strokeWidth="9"
            fill="none"
          />
          <path
            className="kerbline"
            d="M780 205 C860 185 940 176 1020 172"
            stroke="#E10600"
            strokeWidth="9"
            fill="none"
          />
          {/* racing line hugging the apexes */}
          <path
            className="rline"
            d="M-120 740 C260 710 470 590 560 400 C640 250 800 196 1010 190 C1200 184 1340 110 1580 60"
            strokeWidth="3"
            fill="none"
          />
        </g>

        {/* the duel: both cars on the main ribbon, red on a faster lap, hunting blue down */}
        <g
          className="bg-car car-teal"
          opacity=".75"
          style={{ "--c1": "#27F4D2", "--c2": "#0E5F55" } as React.CSSProperties}
        >
          <animateMotion dur="8.6s" begin="-2.4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#rib1" />
          </animateMotion>
          {/* defensive inside lane */}
          <g transform="translate(0,-13)">
            <rect x="-78" y="-2.4" width="52" height="4.8" rx="2.4" fill="url(#trailT)" />
            <g className="drift">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;0;13;5;0;-14;-6;0"
                keyTimes="0;.16;.3;.44;.55;.68;.84;1"
                dur="8.6s"
                repeatCount="indefinite"
              />
              <g className="smoke" opacity="0" fill="#C9CFDB">
                <circle cx="-24" cy="-9" r="4" />
                <circle cx="-28" cy="8" r="5" />
                <circle cx="-32" cy="0" r="6" opacity=".7" />
                <animate
                  attributeName="opacity"
                  values="0;0;.3;.12;0;.34;.12;0"
                  keyTimes="0;.16;.3;.44;.55;.68;.84;1"
                  dur="8.6s"
                  repeatCount="indefinite"
                />
              </g>
              <use href="#carTop" transform="scale(1.22)" />
            </g>
          </g>
        </g>
        <g
          className="bg-car car-red"
          opacity=".9"
          style={{ "--c1": "#E10600", "--c2": "#8F0300" } as React.CSSProperties}
        >
          <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
            <mpath href="#rib1" />
          </animateMotion>
          {/* attacking outside lane, longer trail: the faster car */}
          <g transform="translate(0,13)">
            <rect x="-104" y="-2.8" width="76" height="5.6" rx="2.8" fill="url(#trailR)" />
            <g className="drift">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;0;18;8;0;-20;-9;0"
                keyTimes="0;.16;.3;.44;.55;.68;.84;1"
                dur="7s"
                repeatCount="indefinite"
              />
              <g className="smoke" opacity="0" fill="#C9CFDB">
                <circle cx="-24" cy="-9" r="4" />
                <circle cx="-28" cy="8" r="5" />
                <circle cx="-32" cy="0" r="6" opacity=".7" />
                <animate
                  attributeName="opacity"
                  values="0;0;.4;.18;0;.45;.18;0"
                  keyTimes="0;.16;.3;.44;.55;.68;.84;1"
                  dur="7s"
                  repeatCount="indefinite"
                />
              </g>
              <use href="#carTop" transform="scale(1.35)" />
            </g>
          </g>
        </g>
      </svg>

      {/* INTRO: start engine → lights → fly-by */}
      <div id="gantry">
        <div className="streaks" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>
        <div className="gantry-bar" aria-hidden="true">
          <div className="pod">
            <span className="lamp"></span>
            <span className="lamp"></span>
          </div>
          <div className="pod">
            <span className="lamp"></span>
            <span className="lamp"></span>
          </div>
          <div className="pod">
            <span className="lamp"></span>
            <span className="lamp"></span>
          </div>
          <div className="pod">
            <span className="lamp"></span>
            <span className="lamp"></span>
          </div>
          <div className="pod">
            <span className="lamp"></span>
            <span className="lamp"></span>
          </div>
        </div>
        <button id="start-engine">
          <span>Start engine</span>
        </button>
        <p className="gantry-msg" id="gantry-msg">
          Press to launch · sound on
        </p>
        <button id="run-silent">Run silent — no sound</button>
        <div id="flyby" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/w15-quarter.webp" alt="" />
        </div>
      </div>

      {/* TIMING TOWER NAV */}
      <nav id="tower" aria-label="Sections">
        <div className="tower-head">
          <span className="flag"></span>Circuit map — Live
        </div>
        <div className="circuit" aria-hidden="true">
          <svg id="trk" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="chk" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="3" height="3" fill="#EDF1F8" />
                <rect x="3" y="3" width="3" height="3" fill="#EDF1F8" />
              </pattern>
            </defs>
            <path
              id="trk-base"
              d="M62 34 H138 C158 34 168 44 168 64 V104 C168 124 154 134 134 136 L112 138 C94 140 84 150 84 168 V200 C84 218 96 228 114 230 L142 232 C162 234 170 246 166 264 L148 316 C142 336 128 346 108 344 L66 340 C46 338 36 324 36 304 V64 C36 44 46 34 62 34 Z"
            />
            <path
              id="trk-mid"
              d="M62 34 H138 C158 34 168 44 168 64 V104 C168 124 154 134 134 136 L112 138 C94 140 84 150 84 168 V200 C84 218 96 228 114 230 L142 232 C162 234 170 246 166 264 L148 316 C142 336 128 346 108 344 L66 340 C46 338 36 324 36 304 V64 C36 44 46 34 62 34 Z"
            />
            <path
              id="trk-prog"
              d="M62 34 H138 C158 34 168 44 168 64 V104 C168 124 154 134 134 136 L112 138 C94 140 84 150 84 168 V200 C84 218 96 228 114 230 L142 232 C162 234 170 246 166 264 L148 316 C142 336 128 346 108 344 L66 340 C46 338 36 324 36 304 V64 C36 44 46 34 62 34 Z"
            />
            <rect x="56" y="26" width="10" height="16" fill="url(#chk)" opacity=".8" />
            <g id="trk-marks"></g>
            <circle id="trk-car" r="5" cx="62" cy="34" />
          </svg>
        </div>
        <ol>
          <li>
            <a href="#grid-hero" className="live">
              <span className="pos">P1</span>
              <span className="lbl">Grid</span>
              <span className="gap">LEADER</span>
            </a>
          </li>
          <li>
            <a href="#telemetry">
              <span className="pos">P2</span>
              <span className="lbl">Telemetry</span>
              <span className="gap">+0.4</span>
            </a>
          </li>
          <li>
            <a href="#classification">
              <span className="pos">P3</span>
              <span className="lbl">Results</span>
              <span className="gap">+1.2</span>
            </a>
          </li>
          <li>
            <a href="#stints">
              <span className="pos">P4</span>
              <span className="lbl">Career</span>
              <span className="gap">+3.8</span>
            </a>
          </li>
          <li>
            <a href="#articles">
              <span className="pos">P5</span>
              <span className="lbl">Articles</span>
              <span className="gap">+5.6</span>
            </a>
          </li>
          <li>
            <a href="#radio">
              <span className="pos">P6</span>
              <span className="lbl">Radio</span>
              <span className="gap">+7.1</span>
            </a>
          </li>
        </ol>
        <div className="tower-foot">
          <span id="lap-status">P1 · Grid — 0% lap</span>
          <br />
          DRS <em>Enabled</em>
        </div>
      </nav>

      <div id="speed" aria-hidden="true"></div>
      <div id="lapbar" aria-hidden="true"></div>
      <button id="sound-toggle" aria-label="Toggle sound" title="Toggle sound">
        🔊
      </button>

      <div id="lap-toast" role="status" aria-live="polite">
        <div className="lt-chk"></div>
        <div className="lt-body">
          <p className="lt-head">Race control · Message</p>
          <h4>Lap 1 complete</h4>
          <p>
            Full circuit covered — every sector seen. The pit wall is expecting
            your call.
          </p>
          <div className="lt-row">
            <button className="lt-again" id="lap-again">
              <span>Start lap 2</span>
            </button>
            <button className="lt-close" id="lap-close">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <main>
        {/* ===================== HERO / GRID ===================== */}
        <section id="grid-hero">
          <div className="race-no" aria-hidden="true">
            27
          </div>
          <div className="wrap">
            <p className="hero-eyebrow hin d1">
              <span className="dot"></span>Car No. 27 &nbsp;·&nbsp; Product
              Engineer · Fintech &amp; AI
            </p>
            <h1 className="hin d2">
              <span className="thin">Lights out —</span>
              Gunesh <span className="hollow">Munjal</span>
              <span className="accent">.</span>
            </h1>
            <p className="hero-sub hin d3">
              I build products the way a race team builds a car: obsessively
              researched, stripped of everything that doesn&apos;t make it
              faster, and shipped before the competition leaves the garage.
            </p>
            <div className="hero-cta hin d4">
              <a className="btn p" href="#classification">
                <span>View race results</span>
              </a>
              <a className="btn s" href="#radio">
                <span>Open team radio</span>
              </a>
            </div>
            <div className="hero-stats hin d4">
              <div>
                <b>05</b>
                <small>Seasons</small>
              </div>
              <div>
                <b>06</b>
                <small>Products shipped</small>
              </div>
              <div>
                <b>00</b>
                <small>DNFs</small>
              </div>
              <div>
                <b>P1</b>
                <small>Ambition</small>
              </div>
            </div>
            <div className="showcase hin d5">
              <div className="stage">
                <model-viewer
                  id="car3d"
                  src="/assets/f1-2022.glb"
                  alt="Formula One 2022 car, interactive 3D model"
                  camera-controls=""
                  disable-zoom=""
                  disable-pan=""
                  auto-rotate=""
                  rotation-per-second="20deg"
                  auto-rotate-delay="800"
                  interaction-prompt="none"
                  shadow-intensity="1.3"
                  shadow-softness="0.8"
                  exposure="1.15"
                  camera-orbit="30deg 80deg 105%"
                  min-camera-orbit="auto 65deg auto"
                  max-camera-orbit="auto 92deg auto"
                  loading="eager"
                ></model-viewer>
              </div>
              <div className="platform" aria-hidden="true"></div>
              <div className="scroll-cue">
                <span>Scroll to overtake</span>
                <span className="chev"></span>
              </div>
            </div>
          </div>
          <div className="ticker" aria-hidden="true">
            <div className="ticker-inner">
              <b className="tg">DRS enabled</b> — scroll to overtake
              &nbsp;·&nbsp; <b className="tp">5 seasons on the grid</b>{" "}
              &nbsp;·&nbsp; 1,000+ customer interviews &nbsp;·&nbsp;{" "}
              <b className="ty">0 DNFs in production</b> &nbsp;·&nbsp; currently
              open to new race seats &nbsp;·&nbsp;{" "}
              <b className="tg">DRS enabled</b> — scroll to overtake
              &nbsp;·&nbsp; <b className="tp">5 seasons on the grid</b>{" "}
              &nbsp;·&nbsp; 1,000+ customer interviews &nbsp;·&nbsp;{" "}
              <b className="ty">0 DNFs in production</b> &nbsp;·&nbsp; currently
              open to new race seats &nbsp;·&nbsp;
            </div>
          </div>
        </section>

        {/* ===================== TELEMETRY / SKILLS ===================== */}
        <section id="telemetry">
          <div className="wrap">
            <p className="sector s1 rv">
              <span className="tick"></span>Sector 1 — Telemetry
              <span className="stime">S1 · 28.442</span>
            </p>
            <h2 className="rv">What the data says</h2>
            <p className="lede rv">
              Every car setup is a compromise. This is mine — the compounds I
              run most, and the throttle traces to prove it.
            </p>

            <div className="compounds rv">
              <div className="compound">
                <span className="tyre soft">S</span>
                <small>
                  <b>Soft — daily stint</b>Product Strategy
                </small>
              </div>
              <div className="compound">
                <span className="tyre med">M</span>
                <small>
                  <b>Medium — long runs</b>Payments · UPI rails
                </small>
              </div>
              <div className="compound">
                <span className="tyre hard">H</span>
                <small>
                  <b>Hard — endurance</b>Software Development
                </small>
              </div>
              <div className="compound">
                <span className="tyre inter">I</span>
                <small>
                  <b>Inters — changing conditions</b>AI · OCR
                </small>
              </div>
            </div>

            <div className="telemetry">
              {(
                [
                  ["Product strategy", "94%"],
                  ["Payment systems", "92%"],
                  ["Customer research", "90%"],
                  ["Full-stack development", "88%"],
                  ["AI & OCR tooling", "84%"],
                  ["Product marketing", "80%"],
                ] as [string, string][]
              ).map(([nm, pc]) => (
                <div
                  key={nm}
                  className="trace rv"
                  style={{ "--v": pc } as React.CSSProperties}
                >
                  <div className="trace-top">
                    <span className="nm">{nm}</span>
                    <span className="pc">{pc}</span>
                  </div>
                  <div className="bar">
                    <i></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== CLASSIFICATION / PROJECTS ===================== */}
        <section id="classification">
          <div className="wrap">
            <p className="sector s2 rv">
              <span className="tick"></span>Sector 2 — Race results
              <span className="stime">S2 · 31.007</span>
            </p>
            <h2 className="rv">Final classification</h2>
            <p className="lede rv">
              Selected projects, ranked like a Sunday afternoon. Purple is the
              fastest lap, green a personal best — every one of these finished
              the race.
            </p>

            <div className="classification rv">
              <div className="class-head">
                <span>Pos</span>
                <span>Project / entrant</span>
                <span>Best lap</span>
                <span></span>
              </div>

              <a
                className="entry fastest"
                id="p-fpay"
                href="#"
                aria-label="ForeignerPay, project details"
              >
                <span className="pos">01</span>
                <span>
                  <h3>
                    ForeignerPay<span className="fl-tag">Fastest lap</span>
                  </h3>
                  <p>
                    UPI access for foreign tourists in India. 1,000+ customer
                    interviews, a KYC loophole spotted in RBI&apos;s Master
                    Direction, and a payment model that reached NPCI — becoming
                    the basis for one of the first two non-bank providers
                    authorized to serve foreign nationals.
                  </p>
                  <span className="stack">
                    <span>Payments</span>
                    <span>UPI / PPI</span>
                    <span>Regulatory strategy</span>
                  </span>
                </span>
                <span className="laptime">
                  <b>1,000+</b>customer interviews
                </span>
                <span className="go">→</span>
              </a>

              <a
                className="entry pb"
                id="p-validate"
                href="https://validateideaai.vercel.app/"
                target="_blank"
                rel="noopener"
                aria-label="ValidateIdea, project details"
              >
                <span className="pos">02</span>
                <span>
                  <h3>ValidateIdea</h3>
                  <p>
                    Validation reports for early-stage founders — automated
                    market research, GTM strategy and competitor analysis.
                    Guided prompt assistance sharpens the inputs; better inputs
                    sharpen the report.
                  </p>
                  <span className="stack">
                    <span>AI reports</span>
                    <span>Market research</span>
                    <span>GTM</span>
                  </span>
                </span>
                <span className="laptime">
                  <b>454</b>reports generated within first 7 days of launch
                </span>
                <span className="go">→</span>
              </a>

              <a
                className="entry set"
                id="p-zashit"
                href="https://www.zashit.live/waitlist"
                target="_blank"
                rel="noopener"
                aria-label="ZashIt, project details"
              >
                <span className="pos">03</span>
                <span>
                  <h3>ZashIt</h3>
                  <p>
                    Credit card recommendation engine that reads your real
                    spending patterns and matches you to the two cards that pay
                    you back the most — plus hands-on CC consulting for HENRYs.
                    Stop missing out on free money.
                  </p>
                  <span className="stack">
                    <span>OCR</span>
                    <span>Fintech</span>
                    <span>Product strategy</span>
                  </span>
                </span>
                <span className="laptime">
                  <b>Top 2</b>cards matched
                </span>
                <span className="go">→</span>
              </a>

              <a
                className="entry"
                id="p-sneaker"
                href="https://sneaker-sage.vercel.app/"
                target="_blank"
                rel="noopener"
                aria-label="Sneaker Sage, project details"
              >
                <span className="pos">04</span>
                <span>
                  <h3>Sneaker Sage</h3>
                  <p>
                    Real-time price predictions for sneaker resellers, built
                    from user spending data and market trends — so sellers know
                    exactly when to flip for maximum profit.
                  </p>
                  <span className="stack">
                    <span>Data analysis</span>
                    <span>Pricing</span>
                    <span>Web</span>
                  </span>
                </span>
                <span className="laptime">
                  <b>Live</b>price signal
                </span>
                <span className="go">→</span>
              </a>

              <a
                className="entry"
                id="p-sankhya"
                href="https://sankhya-sigma.vercel.app/"
                target="_blank"
                rel="noopener"
                aria-label="Sankhya, project details"
              >
                <span className="pos">05</span>
                <span>
                  <h3>Sankhya</h3>
                  <p>
                    A platform where people post their opinions and earn social
                    status for them — take a stance, back it up, and build your
                    reputation on the leaderboard.
                  </p>
                  <span className="stack">
                    <span>Social</span>
                    <span>Community</span>
                    <span>Web</span>
                  </span>
                </span>
                <span className="laptime">
                  <b>Live</b>on the grid
                </span>
                <span className="go">→</span>
              </a>

              <a
                className="entry"
                id="p-stockapp"
                href="https://github.com/frotank"
                target="_blank"
                rel="noopener"
                aria-label="Stock app, project details"
              >
                <span className="pos">06</span>
                <span>
                  <h3>Stock App</h3>
                  <p>
                    Full-stack React Native stock app clone built with Expo —
                    owned end-to-end, from UI/UX design through frontend
                    implementation to backend integration.
                  </p>
                  <span className="stack">
                    <span>React Native</span>
                    <span>Expo</span>
                    <span>Full-stack</span>
                  </span>
                </span>
                <span className="laptime">
                  <b>E2E</b>owned end-to-end
                </span>
                <span className="go">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* ===================== CAREER STINTS ===================== */}
        <section id="stints">
          <div className="wrap">
            <p className="sector s3 rv">
              <span className="tick"></span>Sector 3 — Career
              <span className="stime">S3 · 24.911</span>
            </p>
            <h2 className="rv">Stint history</h2>
            <p className="lede rv">
              Three teams, one trajectory. Each stint taught a different kind of
              racing.
            </p>

            <div className="stints">
              <div className="stint rv">
                <span className="yr">May 2025 — Dec 2025</span>
                <span className="node"></span>
                <div>
                  <h3>ZashIt — Builder</h3>
                  <p className="team">Project · 8 months</p>
                  <p>
                    Building a credit card recommendation engine — analyzing
                    real spending patterns to match users with the cards that
                    maximize their rewards. Stop missing out on free money.
                  </p>
                </div>
              </div>
              <div className="stint rv" id="s-fint">
                <span className="yr">Sep 2023 — Nov 2023</span>
                <span className="node"></span>
                <div>
                  <h3>Software Engineer Intern</h3>
                  <p className="team">FINT · Internship · Remote · 3 months</p>
                  <p>
                    A short, sharp stint in fintech engineering — shipping
                    production code on someone else&apos;s car teaches you to
                    read a new garage fast.
                  </p>
                </div>
              </div>
              <div className="stint rv">
                <span className="yr">Sep 2022 — Jun 2023</span>
                <span className="node"></span>
                <div>
                  <h3>ForeignerPay</h3>
                  <p className="team">Project · Full-time · 10 months</p>
                  <p>
                    From a Delhi street corner to NPCI&apos;s table: found the
                    problem, interviewed 1,000+ tourists, found the regulatory
                    line through the corner, and handed a working model to the
                    entity that became one of the first two non-bank UPI
                    providers for foreign nationals.
                  </p>
                </div>
              </div>
              <div className="stint rv" id="s-college">
                <span className="yr">Nov 2021 — Sep 2025</span>
                <span className="node"></span>
                <div>
                  <h3>BTech, Computer Science</h3>
                  <p className="team">
                    Inderprastha Engineering College · The academy years
                  </p>
                  <p>
                    The junior formula — fundamentals, all-nighters, and
                    learning to finish every race you start.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== ARTICLES / PRESS ROOM ===================== */}
        <section id="articles">
          <div className="wrap">
            <p className="sector s4 rv">
              <span className="tick"></span>Paddock — Press room
              <span className="stime">Doc · 44.2</span>
            </p>
            <h2 className="rv">Race reports</h2>
            <p className="lede rv">
              Written debriefs from the garage — what worked, what broke, and
              what the data said afterwards.
            </p>

            <div className="articles rv">
              <a
                className="article"
                href="https://validateideaai.vercel.app/"
                target="_blank"
                rel="noopener"
                aria-label="Read: Smart Decision-Making with AI for Entrepreneurs"
              >
                <span className="doc">
                  <b>Doc 12</b>
                  <span>Playbook</span>
                </span>
                <h3>Smart Decision-Making with AI for Entrepreneurs</h3>
                <p>
                  From idea to writing code to generating revenue — how founders
                  can put AI to work at every stage of the build.
                </p>
                <span className="meta">
                  <span>Featured</span>
                  <span>ValidateIdeaAI</span>
                </span>
              </a>
              <a
                className="article"
                href="#"
                aria-label="Read: Inside ForeignerPay"
              >
                <span className="doc">
                  <b>Doc 27</b>
                  <span>Case study</span>
                </span>
                <h3>Inside ForeignerPay</h3>
                <p>
                  Why tourists can&apos;t pay in India, the ₹20,000 wallet
                  loophole in RBI&apos;s KYC rules, and how the model ended up
                  in front of NPCI.
                </p>
                <span className="meta">
                  <span>Case study</span>
                  <span>2022–23</span>
                </span>
              </a>
              <a
                className="article"
                href="https://www.zashit.live/waitlist"
                target="_blank"
                rel="noopener"
                aria-label="Read: Stop missing out on free money"
              >
                <span className="doc">
                  <b>Doc 44</b>
                  <span>Fintech</span>
                </span>
                <h3>Stop missing out on free money</h3>
                <p>
                  What your spending patterns say about which credit cards you
                  should actually hold — the thinking behind ZashIt.
                </p>
                <span className="meta">
                  <span>Waitlist open</span>
                  <span>ZashIt</span>
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ===================== TEAM RADIO / CONTACT ===================== */}
        <section id="radio">
          <div className="wrap">
            <p className="sector s1 rv">
              <span className="tick"></span>Pit wall — Open channel
              <span className="stime">Lap 27 · Box</span>
            </p>
            <h2 className="rv">Team radio</h2>
            <p className="lede rv">
              Got a project that needs a driver? The channel is open.
            </p>

            <div className="radio rv" aria-label="Radio transcript">
              <div className="radio-head">
                <span className="wave">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                Radio — Car 27 · Pit wall
              </div>
              <div className="msg pit">
                <small>Pit wall</small>
                <p>
                  Gunesh, we&apos;ve got a new project on the timing screen.
                  Interested?
                </p>
              </div>
              <div className="msg driver">
                <small>Car 27</small>
                <p>Copy. Send the brief — let&apos;s get it on track.</p>
              </div>
            </div>

            <div className="contact-row rv">
              <a className="btn p" href="mailto:guneshmunjal09@gmail.com">
                <span>Box box</span>
              </a>
            </div>
            <div className="contact-links rv">
              <a
                href="https://www.linkedin.com/in/gunesh-munjal-616403224/"
                target="_blank"
                rel="noopener"
              >
                LinkedIn ↗
              </a>
              <a
                href="https://x.com/guneshmunjal09"
                target="_blank"
                rel="noopener"
              >
                X / Twitter ↗
              </a>
              <a
                href="https://github.com/frotank"
                target="_blank"
                rel="noopener"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </section>

        <div className="checker" aria-hidden="true"></div>
        {/* Assets: W15 photo © Mercedes-AMG Petronas F1 Team via Formula1.com · 3D model "Formula 1 2022" by TheoDevF1 via FetchCFD (CC BY-NC-ND 4.0) */}
        <footer>
          <div className="wrap foot-love">
            <span className="fl-line"></span>
            <p className="fl-tag2">
              Made with <span className="heart">♥</span> by the driver
            </p>
            <p className="fl-name">Gunesh Munjal</p>
            <span className="fl-line"></span>
          </div>
        </footer>
      </main>
    </>
  );
}
