// pages/UpcomingLive.jsx — upcoming LIVE + OFFLINE batches, grouped by the month they start
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";
import { API_BASE, toDate, daysUntil, formatShortDate, seatsLeft, courseTypeOf } from "../utils/courseMeta";

const MODE_TABS = [
  { key: "all", label: "All batches" },
  { key: "live", label: "🔴 Live (online)" },
  { key: "offline", label: "📍 Offline (in-person)" },
];

const monthKey = (course) => {
  const d = toDate(course.batchStartDate);
  return d ? d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "Date to be announced";
};

export default function UpcomingLive() {
  const [allCourses, setAllCourses] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = (searchParams.get("mode") || "all").toLowerCase();
  const mode = ["live", "offline"].includes(modeParam) ? modeParam : "all";
  const setMode = (key) => {
    if (key === "all") searchParams.delete("mode");
    else searchParams.set("mode", key);
    setSearchParams(searchParams, { replace: true });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUpcoming = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses/published/upcoming-batches`);
      if (!res.ok) throw new Error();
      setAllCourses(await res.json());
    } catch {
      setError("Couldn't load upcoming batches. Check that the server is running, then try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUpcoming(); }, []);

  const courses = useMemo(
    () => (mode === "all" ? allCourses : allCourses.filter((c) => courseTypeOf(c) === mode.toUpperCase())),
    [allCourses, mode]
  );
  const modeCount = (key) =>
    key === "all" ? allCourses.length : allCourses.filter((c) => courseTypeOf(c) === key.toUpperCase()).length;

  const groups = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      const k = monthKey(c);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(c);
    });
    return Array.from(map.entries());
  }, [courses]);

  const next = courses.find((c) => c.batchStartDate);
  const nextDays = next ? daysUntil(next.batchStartDate) : null;
  const nextSeats = next ? seatsLeft(next) : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-20 py-12 grid lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3">
            <p className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-sm mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
              </span>
              Admissions open
            </p>
            <h1 className="text-3xl md:text-5xl font-bold mb-3">Upcoming batches</h1>
            <p className="text-green-50 text-lg max-w-xl">
              Join a batch before it starts — live online classes or in-person offline batches, with support sessions and practice.
            </p>
            <div role="tablist" aria-label="Batch type" className="mt-6 inline-flex flex-wrap bg-white/10 p-1 rounded-2xl md:rounded-full">
              {MODE_TABS.map((t) => (
                <button key={t.key} role="tab" aria-selected={mode === t.key} onClick={() => setMode(t.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${mode === t.key ? "bg-white text-green-700 shadow" : "text-white hover:bg-white/10"}`}>
                  {t.label} <span className="opacity-70">({modeCount(t.key)})</span>
                </button>
              ))}
            </div>
          </div>

          {next && (
            <Link
              to={`/course/${next.id}`}
              className="lg:col-span-2 block bg-white text-gray-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
            >
              <p className="text-sm text-gray-500 mb-1">
                Next batch to start · <span className={courseTypeOf(next) === "OFFLINE" ? "text-indigo-700 font-semibold" : "text-red-600 font-semibold"}>
                  {courseTypeOf(next) === "OFFLINE" ? "Offline" : "Live"}</span>
              </p>
              <p className="font-bold text-lg leading-snug mb-3">{next.courseTitle}</p>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-extrabold text-green-700 leading-none">
                    {nextDays === 0 ? "Today" : nextDays}
                  </p>
                  {nextDays !== 0 && <p className="text-sm text-gray-500 mt-1">{nextDays === 1 ? "day to go" : "days to go"}</p>}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>{formatShortDate(next.batchStartDate)}</p>
                  {next.batchNumber ? <p>Batch {next.batchNumber}</p> : null}
                  {nextSeats !== null && <p className={nextSeats <= 10 ? "text-red-600 font-semibold" : ""}>{nextSeats} seats left</p>}
                </div>
              </div>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-20 py-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchUpcoming} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Try again</button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-3">📡</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {mode === "offline" ? "No offline batches are scheduled right now" : mode === "live" ? "No live batches are scheduled right now" : "No batches are scheduled right now"}
            </h2>
            <p className="text-gray-500 mb-6">Recorded courses are available any time.</p>
            <Link to="/courses?type=recorded" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              Browse recorded courses
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map(([month, list]) => (
              <section key={month} aria-labelledby={`m-${month}`}>
                <div className="flex items-center gap-4 mb-5">
                  <h2 id={`m-${month}`} className="text-xl font-bold text-gray-800 whitespace-nowrap">{month}</h2>
                  <span className="h-px flex-1 bg-gray-200"></span>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{list.length} {list.length === 1 ? "batch" : "batches"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {list.map((c) => <CourseCard key={c.id} course={c} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
