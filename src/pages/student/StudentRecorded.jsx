import React, { useEffect, useMemo, useState } from "react";
import { EmptyState, PageTitle, VideoPlayer, fmtDate, fmtDuration, inputCls } from "../../components/dashboard/common";

const byClassNumber = (a, b) =>
  (a.classNumber ?? 1e9) - (b.classNumber ?? 1e9) || String(a.uploadedAt).localeCompare(String(b.uploadedAt));

// Recorded Classes: course dropdown + video cards, and a player on the same page
export default function StudentRecorded({ courses, recorded, initialCourseId, initialVideoId, onConsumeInitial }) {
  const [courseId, setCourseId] = useState(initialCourseId ? String(initialCourseId) : "ALL");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState(initialVideoId || null);

  // Opened from the dashboard (a course card or a latest-class card)
  useEffect(() => {
    if (initialCourseId) setCourseId(String(initialCourseId));
    if (initialVideoId) setPlayingId(initialVideoId);
    if (initialCourseId || initialVideoId) onConsumeInitial?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = recorded.filter(
      (v) => (courseId === "ALL" || String(v.courseId) === courseId) && (!q || `${v.title} ${v.courseTitle}`.toLowerCase().includes(q))
    );
    // one course → class order; all courses → latest first
    return courseId === "ALL" ? list : [...list].sort(byClassNumber);
  }, [recorded, courseId, search]);

  const playing = playingId ? recorded.find((v) => v.id === playingId) : null;

  /* ───── player view ───── */
  if (playing) {
    const playlist = recorded.filter((v) => v.courseId === playing.courseId).sort(byClassNumber);
    const idx = playlist.findIndex((v) => v.id === playing.id);
    const next = idx >= 0 ? playlist[idx + 1] : null;
    return (
      <>
        <button onClick={() => setPlayingId(null)} className="mb-4 text-sm font-semibold text-green-700 hover:underline">← Back to recorded classes</button>
        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
              <VideoPlayer video={playing} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4">
              <p className="text-sm font-semibold text-green-700">{playing.courseTitle}</p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{playing.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {playing.classNumber ? `Class ${playing.classNumber}` : ""}
                {playing.durationSeconds ? ` · ${fmtDuration(playing.durationSeconds)}` : ""}
                {playing.teacherName ? ` · 👨‍🏫 ${playing.teacherName}` : ""}
                {` · ${fmtDate(playing.uploadedAt)}`}
              </p>
              {playing.description && <p className="text-gray-700 mt-4 whitespace-pre-wrap">{playing.description}</p>}
              {next && (
                <button onClick={() => setPlayingId(next.id)} className="mt-5 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-semibold">
                  Next class: {next.title} →
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-fit">
            <h3 className="font-bold text-green-800 mb-3">More from this course</h3>
            <ul className="space-y-2 max-h-[520px] overflow-y-auto">
              {playlist.map((v) => (
                <li key={v.id}>
                  <button onClick={() => setPlayingId(v.id)} className={`w-full text-left p-3 rounded-xl border transition ${v.id === playing.id ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-green-300"}`}>
                    <p className="text-xs text-gray-500">{v.classNumber ? `Class ${v.classNumber}` : "Class"}{v.durationSeconds ? ` · ${fmtDuration(v.durationSeconds)}` : ""}</p>
                    <p className="font-semibold text-sm text-gray-800">{v.id === playing.id ? "▶ " : ""}{v.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    );
  }

  /* ───── list view ───── */
  return (
    <>
      <PageTitle>🎬 Recorded Classes</PageTitle>

      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <select className={inputCls} value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="Filter by course">
          <option value="ALL">All Courses</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.courseTitle}</option>)}
        </select>
        <input className={inputCls} placeholder="Search class title…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {courses.length === 0 ? (
        <EmptyState icon="📚" title="No courses enrolled" text="Enroll in a course to watch its recorded classes." />
      ) : visible.length === 0 ? (
        <EmptyState icon="🎬" title="No recorded classes found" text={search ? "Try a different search." : "Your instructor hasn't uploaded a recorded class for this selection yet."} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((v) => (
            <article key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition flex flex-col">
              <button onClick={() => setPlayingId(v.id)} className="relative aspect-video bg-gradient-to-br from-green-600 to-emerald-800 text-white flex items-center justify-center group" aria-label={`Watch ${v.title}`}>
                {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <span className="relative w-14 h-14 rounded-full bg-black/50 group-hover:bg-green-600 transition flex items-center justify-center text-2xl pl-1">▶</span>
                {v.classNumber && <span className="absolute top-2 left-2 bg-white/90 text-green-800 text-xs font-bold px-2 py-1 rounded-full">Class {v.classNumber}</span>}
                {v.durationSeconds && <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{fmtDuration(v.durationSeconds)}</span>}
              </button>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs font-semibold text-green-700 truncate">{v.courseTitle}</p>
                <h3 className="font-bold text-gray-800 line-clamp-2 mt-1">{v.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {v.classNumber ? `Class ${v.classNumber}` : "Recorded class"}
                  {v.durationSeconds ? ` · ${fmtDuration(v.durationSeconds)}` : ""}
                </p>
                <button onClick={() => setPlayingId(v.id)} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">▶ Watch Class</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
