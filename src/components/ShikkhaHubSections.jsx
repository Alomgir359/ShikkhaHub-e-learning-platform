import React, { useState } from "react";

/* =====================================================================
   ShikkhaHub unique landing-page sections (original green theme)
   ===================================================================== */

const LANGUAGES = ["Python", "JavaScript", "C++", "Java", "Go"];

const CONCEPTS = [
  {
    id: "recursion",
    name: "Recursion",
    idea: "A problem that contains a smaller copy of itself. Solve the smallest case, then trust the smaller copy to do the rest.",
    bn: "বড় সমস্যার ভেতরে একই রকম ছোট সমস্যা। সবচেয়ে ছোটটা সমাধান করো, বাকিটা নিজেই মিলে যায়।",
    code: {
      Python: `def factorial(n):
    if n <= 1:            # base case
        return 1
    return n * factorial(n - 1)`,
      JavaScript: `function factorial(n) {
  if (n <= 1) return 1;     // base case
  return n * factorial(n - 1);
}`,
      "C++": `long factorial(int n) {
    if (n <= 1) return 1;   // base case
    return n * factorial(n - 1);
}`,
      Java: `static long factorial(int n) {
    if (n <= 1) return 1;   // base case
    return n * factorial(n - 1);
}`,
      Go: `func factorial(n int) int {
    if n <= 1 { return 1 }  // base case
    return n * factorial(n-1)
}`,
    },
  },
  {
    id: "references",
    name: "Value vs Reference",
    idea: "A variable holds either a value or a way to reach a value. Know which one, and a whole class of bugs disappears.",
    bn: "ভেরিয়েবল কখনো জিনিসটা নিজেই রাখে, কখনো শুধু ঠিকানা। কোনটা — সেটা বুঝলেই অর্ধেক bug শেষ।",
    code: {
      Python: `a = [1, 2, 3]
b = a              # same list, two names
b.append(4)
print(a)           # [1, 2, 3, 4]`,
      JavaScript: `const a = [1, 2, 3];
const b = a;       // same array, two names
b.push(4);
console.log(a);    // [1, 2, 3, 4]`,
      "C++": `std::vector<int> a = {1, 2, 3};
std::vector<int>& b = a;  // reference
b.push_back(4);
std::cout << a.size();    // 4`,
      Java: `int[] a = {1, 2, 3};
int[] b = a;       // same array object
b[0] = 9;
System.out.println(a[0]); // 9`,
      Go: `a := []int{1, 2, 3}
b := a             // shares the array
b[0] = 9
fmt.Println(a[0])  // 9`,
    },
  },
  {
    id: "hashing",
    name: "Hash Lookup",
    idea: "Turn the key into an address, and finding something stops being a search through every item.",
    bn: "চাবি থেকে সরাসরি ঠিকানা — তাই খুঁজতে পুরো তালিকা ঘুরতে হয় না।",
    code: {
      Python: `counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1`,
      JavaScript: `const counts = new Map();
for (const w of words) {
  counts.set(w, (counts.get(w) ?? 0) + 1);
}`,
      "C++": `std::unordered_map<std::string, int> counts;
for (const auto& w : words) {
    counts[w]++;
}`,
      Java: `Map<String, Integer> counts = new HashMap<>();
for (String w : words) {
    counts.merge(w, 1, Integer::sum);
}`,
      Go: `counts := map[string]int{}
for _, w := range words {
    counts[w]++
}`,
    },
  },
];

/* ---------- 1. One concept, any language (interactive) ---------- */
export function ConceptExplorerSection() {
  const [conceptId, setConceptId] = useState(CONCEPTS[0].id);
  const [lang, setLang] = useState(LANGUAGES[0]);
  const concept = CONCEPTS.find((c) => c.id === conceptId);

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">The ShikkhaHub Way</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
            One concept. Any language.
          </h2>
          <p className="text-gray-600 mt-4 text-lg leading-relaxed">
            Most courses teach you <b>syntax</b>. We teach you the <b>idea underneath</b> — so when you
            switch from Python to Java or Go, you don't start from zero. You only learn new syntax.
          </p>
          <p className="text-gray-700 mt-3">
            একবার গভীরভাবে বুঝলে, যেকোনো ল্যাঙ্গুয়েজে লিখতে পারবে।
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {CONCEPTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setConceptId(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  c.id === conceptId
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">👉 Try it: pick a concept, then switch languages on the right.</p>
        </div>

        <div className="rounded-2xl shadow-2xl overflow-hidden border border-green-100">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-5">
            <p className="text-xs uppercase tracking-wide text-green-100">Concept: {concept.name}</p>
            <p className="font-semibold text-lg mt-1 leading-snug">{concept.idea}</p>
            <p className="text-sm text-green-100 mt-2">{concept.bn}</p>
          </div>
          <div className="flex overflow-x-auto bg-gray-50 border-b">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-2.5 text-sm font-mono whitespace-nowrap border-b-2 transition ${
                  l === lang
                    ? "border-green-600 text-green-700 font-bold bg-white"
                    : "border-transparent text-gray-500 hover:text-green-700"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <pre className="bg-gray-900 text-green-100 p-5 text-sm leading-relaxed overflow-x-auto min-h-[150px]">
            <code>{concept.code[lang]}</code>
          </pre>
          <div className="bg-white px-5 py-3 text-sm text-gray-600">
            ✅ The idea stays the same — only the syntax changes.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. Typical course vs ShikkhaHub ---------- */
const COMPARISON = [
  { typical: "Memorize how a for-loop looks in Python", ours: "Understand what repetition is, and when a loop or recursion fits" },
  { typical: "Copy the tutorial project line by line", ours: "Rebuild the idea from a blank page — on paper first" },
  { typical: "Start from zero when the job needs Java", ours: "Carry the concept over and learn only the new syntax" },
  { typical: "Watch ten videos, remember none", ours: "Explain it back in your own words until there are no gaps" },
];

export function DifferenceSection() {
  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">What Makes Us Different</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
            Others teach you to type. We teach you to think.
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">মুখস্থ নয়, বোঝা — syntax পুরনো হয়ে যায়, কিন্তু ভেতরের idea কখনো পুরনো হয় না।</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold">
            <div className="p-4 bg-gray-700">❌ Typical Course</div>
            <div className="p-4">✅ ShikkhaHub</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} className="grid grid-cols-2 border-t border-gray-100">
              <div className="p-4 text-gray-500 line-through decoration-red-400">{row.typical}</div>
              <div className="p-4 text-gray-800 font-medium bg-green-50/50">{row.ours}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. 5-step learning method ---------- */
const METHOD = [
  { icon: "❓", title: "Why It Exists", bn: "কেন", body: "Every topic starts with the problem people faced before the idea existed. Feel the problem, and the solution makes sense." },
  { icon: "🧠", title: "Mental Model", bn: "ছবি আঁকো", body: "Boxes, arrows, memory, time. If you can't draw what the computer is doing, you don't understand it yet." },
  { icon: "🛠️", title: "Build From Scratch", bn: "নিজে বানাও", body: "Rebuild the idea yourself — on paper, then in code — before using a library that hides it." },
  { icon: "🔄", title: "Translate It", bn: "অনুবাদ করো", body: "Write it in at least two languages to see what's the idea and what's only syntax." },
  { icon: "🗣️", title: "Teach It Back", bn: "বুঝিয়ে বলো", body: "Explain it in Bangla or English. The gaps in your understanding show up fast — and get fixed." },
];

export function MethodSection() {
  return (
    <div id="method" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Our Teaching Method</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">How Every Lesson Works</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            The same 5 steps for every concept. Slower on day one — much faster by month three.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-green-400 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {METHOD.map((m, i) => (
            <div key={m.title} className="relative bg-green-50 rounded-2xl p-6 border border-green-100 hover:shadow-lg transition">
              <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-green-600 text-white font-bold flex items-center justify-center shadow">
                {i + 1}
              </div>
              <div className="text-4xl mb-3">{m.icon}</div>
              <h3 className="text-lg font-bold text-gray-800">{m.title}</h3>
              <p className="text-sm font-semibold text-green-600">{m.bn}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 4. Deep-theory syllabus ---------- */
const SYLLABUS = [
  { icon: "💾", topic: "How Memory Works", detail: "Stack, heap and references — and why your variable changed when you didn't touch it." },
  { icon: "⚙️", topic: "How Code Actually Runs", detail: "Interpreters, compilers and runtimes: what happens between pressing run and seeing output." },
  { icon: "📈", topic: "Thinking in Complexity", detail: "Why one solution finishes in a second and another takes an hour on the same data." },
  { icon: "🌳", topic: "Data Structures as Decisions", detail: "Arrays, maps, trees and graphs — chosen by trade-off, not habit." },
  { icon: "🧩", topic: "Types & Abstraction", detail: "What a type really promises, from Python's duck typing to Java's interfaces." },
  { icon: "🔀", topic: "Concurrency Without Fear", detail: "Threads, async and events, explained from what the CPU is really doing." },
];

export function SyllabusSection() {
  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-green-200 font-semibold text-sm uppercase tracking-wide">সূচিপত্র · Deep Theory</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">What We Teach Underneath Every Language</h2>
          <p className="text-green-100 mt-4 max-w-2xl mx-auto">
            These ideas show up in every language you'll ever use. Learn them once — each new language becomes
            a weekend of syntax, not a semester.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SYLLABUS.map((s) => (
            <div key={s.topic} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition">
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="text-lg font-bold">{s.topic}</h3>
              <p className="text-sm text-green-100 mt-2 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
