// components/LandingHighlights.jsx
// 1) HeroCodeWindow       — hero-র ডান পাশে টাইপ হতে থাকা code editor (একই ধারণা, তিন ভাষায়)
// 2) WhyShikkhaHubSection — 1-to-1 Mentorship হাইলাইট + ডান থেকে বামে স্লাইড হওয়া ফিচার কার্ড
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* ---------------------------------------------------------------------
   প্রয়োজনে এখান থেকে সংখ্যা বদলান
   --------------------------------------------------------------------- */
const MENTEES_PER_MENTOR = 10; // প্রতি মেন্টরের অধীনে সর্বোচ্চ কতজন শিক্ষার্থী
const SLIDE_EVERY_MS = 2800;   // কত সময় পর পর একটি কার্ড সরবে

/* ---------------------------------------------------------------------
   Shared helpers
   --------------------------------------------------------------------- */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener(update);
    };
  }, []);
  return reduced;
}

const ICON_PATHS = {
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  code: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  infinity: (
    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
  ),
  trending: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  video: (
    <>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </>
  ),
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </>
  ),
  fileCode: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </>
  ),
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
};

function Icon({ name, className = "w-6 h-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* =====================================================================
   1) HERO CODE WINDOW
   ===================================================================== */
const SNIPPETS = [
  {
    lang: "Python",
    file: "search.py",
    comment: "#",
    code: `# একই ধারণা, যেকোনো ভাষায়
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target: return mid
        if arr[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1`,
  },
  {
    lang: "JavaScript",
    file: "search.js",
    comment: "//",
    code: `// একই ধারণা, যেকোনো ভাষায়
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
  },
  {
    lang: "C++",
    file: "search.cpp",
    comment: "//",
    code: `// একই ধারণা, যেকোনো ভাষায়
int binarySearch(vector<int>& a, int t) {
    int lo = 0, hi = a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == t) return mid;
        if (a[mid] < t) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
  },
];

const KEYWORDS = new Set([
  "def", "return", "while", "if", "else", "function", "let", "const",
  "int", "for", "in", "vector", "len",
]);

// খুব ছোট একটি syntax highlighter (শুধু এই snippet-গুলোর জন্য যথেষ্ট)
function highlight(line, commentMark) {
  const ci = line.indexOf(commentMark);
  const codePart = ci === -1 ? line : line.slice(0, ci);
  const commentPart = ci === -1 ? "" : line.slice(ci);

  const out = [];
  const re = /([A-Za-z_]\w*)(\s*\()?|(\d+)|([^A-Za-z_\d]+)/g;
  let m;
  let k = 0;
  while ((m = re.exec(codePart)) !== null) {
    if (m[1]) {
      const word = m[1];
      let cls = "text-slate-100";
      if (KEYWORDS.has(word)) cls = "text-pink-400";
      else if (m[2]) cls = "text-sky-300";
      out.push(<span key={k++} className={cls}>{word}</span>);
      if (m[2]) out.push(<span key={k++} className="text-slate-300">{m[2]}</span>);
    } else if (m[3]) {
      out.push(<span key={k++} className="text-amber-300">{m[3]}</span>);
    } else {
      out.push(<span key={k++} className="text-slate-400">{m[4]}</span>);
    }
  }
  if (commentPart) {
    out.push(<span key={k++} className="text-emerald-400/80 italic">{commentPart}</span>);
  }
  return out;
}

export function HeroCodeWindow() {
  const reduced = usePrefersReducedMotion();
  const [snip, setSnip] = useState(0);
  const [chars, setChars] = useState(0);
  const current = SNIPPETS[snip];
  const done = chars >= current.code.length;

  useEffect(() => {
    if (reduced) {
      setChars(current.code.length);
      const t = setTimeout(() => {
        setSnip((s) => (s + 1) % SNIPPETS.length);
      }, 5000);
      return () => clearTimeout(t);
    }
    if (!done) {
      const next = current.code[chars];
      const delay = next === "\n" ? 140 : next === " " ? 12 : 30;
      const t = setTimeout(() => setChars((c) => c + 1), delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setSnip((s) => (s + 1) % SNIPPETS.length);
      setChars(0);
    }, 2600);
    return () => clearTimeout(t);
  }, [chars, done, current, reduced]);

  const lines = current.code.slice(0, chars).split("\n");

  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto">
      {/* soft glow */}
      <div className="absolute -inset-6 bg-yellow-300/20 rounded-[2rem] blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative rounded-2xl bg-slate-900/95 ring-1 ring-white/15 shadow-2xl overflow-hidden text-left">
        {/* title bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/10">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-red-400/90" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/90" />
            <span className="w-3 h-3 rounded-full bg-green-400/90" />
          </div>
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Code language">
            {SNIPPETS.map((s, i) => (
              <button
                key={s.file}
                type="button"
                role="tab"
                aria-selected={i === snip}
                onClick={() => {
                  setSnip(i);
                  setChars(0);
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono whitespace-nowrap transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
                  i === snip ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {s.file}
              </button>
            ))}
          </div>
          <span className="ml-auto hidden sm:inline-flex text-[11px] font-mono text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded">
            O(log n)
          </span>
        </div>

        {/* code */}
        <div className="px-4 py-4 h-[17rem] sm:h-[19rem] overflow-x-auto">
          <pre className="font-mono text-[12px] sm:text-[13px] leading-6">
            {lines.map((ln, i) => (
              <div key={i} className="flex">
                <span className="w-7 shrink-0 text-right pr-3 text-slate-600 select-none">{i + 1}</span>
                <code className="whitespace-pre">
                  {highlight(ln, current.comment)}
                  {i === lines.length - 1 && !done && (
                    <span className="inline-block w-[7px] h-4 align-middle bg-yellow-300 ml-px animate-caret" />
                  )}
                </code>
              </div>
            ))}
          </pre>
        </div>

        {/* terminal output */}
        <div className="px-4 py-3 bg-black/30 border-t border-white/10 font-mono text-[12px] min-h-[2.75rem]" aria-live="polite">
          {done ? (
            <span className="text-slate-300">
              <span className="text-emerald-400">$</span> run {current.file}
              <span className="text-slate-500"> → </span>
              <span className="text-yellow-300">found 23 at index 5</span>
              <span className="text-slate-500"> (3 steps, 10 items)</span>
            </span>
          ) : (
            <span className="text-slate-500">{current.lang} লেখা হচ্ছে…</span>
          )}
        </div>
      </div>

      <p className="relative mt-4 text-sm text-white/80 text-center lg:text-left">
        Binary Search: প্রতি ধাপে অর্ধেক বাদ। ধারণাটা একবার বুঝলে Python, JavaScript, C++ সবখানে একই।
      </p>

      <style>{`
        @keyframes caret-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .animate-caret { animation: caret-blink 1s step-end infinite; }
      `}</style>
    </div>
  );
}

/* =====================================================================
   2) WHY LEARN WITH SHIKKHAHUB
   ===================================================================== */
const MENTORSHIP_PERKS = [
  {
    icon: "fileCode",
    title: "Code Review",
    desc: "আপনার কোড লাইন ধরে রিভিউ, কোথায় ভালো আর কোথায় বদলাতে হবে তার কারণসহ।",
  },
  {
    icon: "bulb",
    title: "Live Problem Solving",
    desc: "আটকে গেলে মেন্টরের সাথে স্ক্রিন শেয়ার করে একসাথে সমাধান।",
  },
  {
    icon: "folder",
    title: "Project Guidance",
    desc: "আইডিয়া থেকে ডিপ্লয় পর্যন্ত নিজের প্রজেক্টে ধাপে ধাপে দিকনির্দেশনা।",
  },
  {
    icon: "briefcase",
    title: "Career Guidance",
    desc: "CV, পোর্টফোলিও আর ইন্টারভিউ প্রস্তুতিতে ব্যক্তিগত পরামর্শ।",
  },
];

const FEATURES = [
  {
    icon: "chat",
    title: "1-to-1 Mentorship",
    desc: "ছোট ব্যাচ, তাই মেন্টর আপনার কোড, প্রশ্ন আর দুর্বল জায়গা আলাদাভাবে চেনেন।",
    highlight: true,
  },
  {
    icon: "users",
    title: "Expert Mentors",
    desc: "ইন্ডাস্ট্রিতে কাজ করা ইঞ্জিনিয়াররা শেখান, কী লিখতে হবে শুধু না, কেন লিখতে হবে।",
  },
  {
    icon: "code",
    title: "Project-Based Learning",
    desc: "প্রতিটি ধারণা শেষ হয় এমন কিছু বানিয়ে, যা আপনি পোর্টফোলিওতে দেখাতে পারবেন।",
  },
  {
    icon: "calendar",
    title: "Flexible Learning",
    desc: "লাইভ ক্লাস, রেকর্ডিং আর নোট মিলিয়ে নিজের সময়মতো শিখুন।",
  },
  {
    icon: "infinity",
    title: "Lifetime Access",
    desc: "একবার এনরোল করলে লেসন, নোট আর আপডেট সারাজীবন দেখতে পারবেন।",
  },
  {
    icon: "trending",
    title: "Career Support",
    desc: "CV রিভিউ, মক ইন্টারভিউ আর প্রথম বা পরের চাকরির জন্য গাইডেন্স।",
  },
  {
    icon: "video",
    title: "Live Interactive Classes",
    desc: "রিয়েল-টাইম ক্লাসে সরাসরি প্রশ্ন করুন, সাথে সাথে উত্তর পান।",
  },
  {
    icon: "layers",
    title: "Concept Visualization",
    desc: "মেমরি, ডেটা ফ্লো আর execution ডায়াগ্রামে দেখুন, বিমূর্ত ধারণা চোখের সামনে।",
  },
  {
    icon: "award",
    title: "Certification",
    desc: "কোর্স সফলভাবে শেষ করলে ভেরিফাইড ডিজিটাল সার্টিফিকেট।",
  },
];

function FeatureCard({ item }) {
  if (item.highlight) {
    return (
      <div className="h-full rounded-2xl p-6 bg-gradient-to-br from-green-600 to-green-800 text-white shadow-lg ring-2 ring-yellow-300/70">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon name={item.icon} className="w-6 h-6 text-yellow-300" />
          </div>
          <span className="text-[11px] font-semibold bg-yellow-300 text-green-900 px-2.5 py-1 rounded-full">
            ছোট ব্যাচ
          </span>
        </div>
        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
        <p className="text-sm leading-relaxed text-green-50/90">{item.desc}</p>
      </div>
    );
  }
  return (
    <div className="h-full rounded-2xl p-6 bg-white border border-green-100 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center mb-5">
        <Icon name={item.icon} className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{item.desc}</p>
    </div>
  );
}

function FeatureCarousel({ items }) {
  const n = items.length;
  const loop = [...items, ...items]; // শেষে পৌঁছালে নিঃশব্দে শুরুতে ফিরে যাওয়ার জন্য
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);

  // এক কার্ড সরার দূরত্ব = কার্ডের width + gap
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track || !track.children[0]) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      setStep(track.children[0].getBoundingClientRect().width + gap);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // auto slide: ডান থেকে বামে, একটা একটা করে
  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setAnimate(true);
      setIndex((i) => Math.min(i + 1, n + 1));
    }, SLIDE_EVERY_MS);
    return () => clearInterval(id);
  }, [paused, reduced, n]);

  // transition ছাড়া জাম্প করার পর আবার animation চালু
  useEffect(() => {
    if (animate) return;
    let r2;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      if (r2) cancelAnimationFrame(r2);
    };
  }, [animate]);

  const onTransitionEnd = (e) => {
    if (e.target !== trackRef.current || e.propertyName !== "transform") return;
    if (index >= n) {
      setAnimate(false);
      setIndex(index - n);
    }
  };

  const next = () => {
    setAnimate(true);
    setIndex((i) => Math.min(i + 1, n + 1));
  };

  const prev = () => {
    if (index === 0) {
      setAnimate(false);
      setIndex(n);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setAnimate(true);
          setIndex(n - 1);
        })
      );
    } else {
      setAnimate(true);
      setIndex((i) => i - 1);
    }
  };

  const goTo = (i) => {
    setAnimate(true);
    setIndex(i);
  };

  const active = index % n;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="ShikkhaHub features"
    >
      <div className="overflow-hidden py-2 -my-2">
        <div
          ref={trackRef}
          onTransitionEnd={onTransitionEnd}
          className="flex gap-6"
          style={{
            transform: `translate3d(${-index * step}px, 0, 0)`,
            transition: animate && !reduced ? "transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1)" : "none",
          }}
        >
          {loop.map((item, i) => (
            <div
              key={i}
              className="shrink-0 w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              aria-hidden={i >= n ? "true" : undefined}
            >
              <FeatureCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label="Choose slide">
          {items.map((it, i) => (
            <button
              key={it.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${it.title}`}
              aria-current={i === active ? "true" : undefined}
              className={`h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ${
                i === active ? "w-8 bg-green-600" : "w-2 bg-green-200 hover:bg-green-300"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous feature"
            className="w-10 h-10 rounded-full border border-green-200 bg-white text-green-700 flex items-center justify-center hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            <Icon name="chevronLeft" className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next feature"
            className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
          >
            <Icon name="chevronRight" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MentorshipSpotlight() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-green-900 text-white shadow-xl">
      <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-green-600/40 blur-3xl" aria-hidden="true" />
      <div className="relative grid lg:grid-cols-5 gap-10 p-8 md:p-12">
        {/* left: the promise */}
        <div className="lg:col-span-2 flex flex-col">
          <span className="self-start text-xs font-semibold bg-yellow-300 text-green-900 px-3 py-1 rounded-full mb-5">
            ছোট ব্যাচ, সীমিত আসন
          </span>
          <h3 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            1-to-1 Mentorship
          </h3>
          <p className="text-green-100/90 leading-relaxed mb-8">
            প্রতিটি ব্যাচে আমরা ইচ্ছে করেই অল্প শিক্ষার্থী নিই। তাতে মেন্টর প্রত্যেকের কোড, প্রশ্ন আর অগ্রগতি আলাদাভাবে দেখতে পারেন, কেউ ভিড়ে হারিয়ে যায় না।
          </p>

          {/* seat visual */}
          <div className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-5 mb-8">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-yellow-300">{MENTEES_PER_MENTOR}</span>
              <span className="text-sm text-green-100/90">জন পর্যন্ত, প্রতি মেন্টরের অধীনে</span>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-hidden="true">
              {Array.from({ length: MENTEES_PER_MENTOR }).map((_, i) => (
                <span key={i} className="w-5 h-5 rounded-full bg-yellow-300/90 ring-2 ring-green-900" />
              ))}
            </div>
          </div>

          <Link
            to="/courses"
            className="mt-auto self-start inline-flex items-center gap-2 bg-yellow-300 text-green-900 font-semibold px-6 py-3 rounded-xl hover:bg-yellow-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            মেন্টরশিপসহ কোর্স দেখুন
          </Link>
        </div>

        {/* right: what you get */}
        <div className="lg:col-span-3">
          <p className="text-sm text-green-200 mb-4">আপনি যা পাবেন</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {MENTORSHIP_PERKS.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-5">
                <div className="w-11 h-11 rounded-xl bg-yellow-300/15 text-yellow-300 flex items-center justify-center mb-4">
                  <Icon name={p.icon} className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{p.title}</h4>
                <p className="text-sm text-green-100/80 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhyShikkhaHubSection() {
  return (
    <section className="bg-gradient-to-br from-green-100 via-white to-green-200 py-20" aria-labelledby="why-shikkhahub-title">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Benefits</span>
          <h2 id="why-shikkhahub-title" className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
            Why Learn with ShikkhaHub?
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Built for learners who want to truly understand — not just pass an exam
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-green-400 mx-auto mt-4 rounded-full" />
        </div>

        <MentorshipSpotlight />

        <div className="mt-14">
          <FeatureCarousel items={FEATURES} />
        </div>
      </div>

    </section>
  );
}
