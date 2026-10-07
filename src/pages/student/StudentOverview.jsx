import React from "react";
import { Link } from "react-router-dom";
import { Card, EmptyState, Greeting, StatCard, StatusPill, fmtDateTime, fmtDuration, fmtTime, liveState, todayStr } from "../../components/dashboard/common";
import { deadlineInfo } from "./studentUtils";

// Dashboard: enrolled courses, today's live classes, pending assignments, latest recorded classes
export default function StudentOverview({ name, courses, pendingEnrollments, live, assignments, recorded, onNavigate }) {
  const today = todayStr();
  const todayLive = live.filter((c) => c.classDate === today);
  const pending = assignments
    .filter((a) => a.status === "PENDING" || a.status === "RESUBMIT_REQUESTED")
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
  const latest = recorded.slice(0, 6);

  return (
    <>
      <Greeting name={name} />

      {/* Payment verification status (manual bKash / Nagad enrollments) */}
      {pendingEnrollments.length > 0 && (
        <div className="mb-6 space-y-3">
          {pendingEnrollments.map((e) => (
            <div key={e.id} className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${e.status === "PENDING" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <span className="text-2xl" aria-hidden>{e.status === "PENDING" ? "⏳" : "❌"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{e.courseTitle}</p>
                {e.status === "PENDING" ? (
                  <p className="text-sm text-amber-900">এনরোলমেন্ট সম্পন্ন হয়েছে — অ্যাডমিন পেমেন্ট যাচাই করছেন। অ্যাপ্রুভ হলেই কোর্সটি এখানে চালু হবে।</p>
                ) : (
                  <p className="text-sm text-red-800">পেমেন্ট অ্যাপ্রুভ হয়নি{e.adminNote ? `: ${e.adminNote}` : "।"} সঠিক Transaction ID দিয়ে আবার এনরোল করুন।</p>
                )}
                <p className="text-xs text-gray-500 mt-1 font-mono">{e.paymentMethod} · TrxID {e.transactionId} · ৳{Number(e.amount || 0).toLocaleString("en-IN")}</p>
              </div>
              {e.status === "REJECTED" && (
                <Link to={`/course/${e.courseId}`} className="shrink-0 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 text-center">
                  আবার এনরোল করুন
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📚" value={courses.length} label="Enrolled Courses" tone="green" />
        <StatCard icon="🔴" value={todayLive.length} label="Today's Live Classes" tone="orange" onClick={() => onNavigate("live")} />
        <StatCard icon="📝" value={pending.length} label="Pending Assignments" tone="purple" onClick={() => onNavigate("assignments")} />
        <StatCard icon="🎬" value={recorded.length} label="Recorded Classes" tone="blue" onClick={() => onNavigate("recorded")} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mb-6">
        {/* Today's live classes */}
        <Card title="🎯 Today's Live Classes" className="xl:col-span-2" right={<button onClick={() => onNavigate("live")} className="text-sm text-green-700 font-semibold hover:underline">View all →</button>}>
          {todayLive.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🌿</div>
              <p className="font-semibold text-gray-700">আজ কোনো live class নেই</p>
              <p className="text-sm text-gray-500 mt-1">এই সময়ে পূর্ববর্তী ক্লাস ও এসাইনমেন্টগুলো নিয়ে প্র্যাকটিস করুন।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayLive.map((c) => {
                const state = liveState(c);
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 justify-between border border-green-100 bg-green-50/50 rounded-xl p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-green-700">{c.courseTitle}</p>
                      <p className="font-bold text-gray-800">{c.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">🕒 {fmtTime(c.startTime)} {state === "LIVE" && <span className="ml-2 text-red-600 font-semibold animate-pulse">● Live now</span>}</p>
                    </div>
                    <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-semibold transition">
                      Join Live Class →
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pending assignments */}
        <Card title="📝 Pending Assignments" right={<button onClick={() => onNavigate("assignments")} className="text-sm text-green-700 font-semibold hover:underline">View all →</button>}>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">🎉 কোনো pending assignment নেই।</p>
          ) : (
            <ul className="space-y-3">
              {pending.slice(0, 4).map((a) => {
                const info = deadlineInfo(a.deadline);
                return (
                  <li key={a.id}>
                    <button onClick={() => onNavigate("assignments")} className="w-full text-left border border-gray-100 rounded-xl p-3 hover:border-green-300 hover:bg-green-50/40 transition">
                      <p className="text-xs text-green-700 font-semibold">{a.courseTitle}</p>
                      <p className="font-semibold text-gray-800 truncate">{a.title}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className={`text-xs ${info.className}`}>{a.deadline ? `📅 ${fmtDateTime(a.deadline)}` : "No deadline"}</span>
                        {a.status === "RESUBMIT_REQUESTED" && <StatusPill status="RESUBMIT_REQUESTED" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Enrolled courses */}
      <Card title="📚 Enrolled Courses" className="mb-6">
        {courses.length === 0 ? (
          <EmptyState icon="📚" title="No courses enrolled yet" text="You haven't enrolled in any course yet.">
            <Link to="/courses" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold">Browse courses</Link>
          </EmptyState>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map((c) => (
              <div key={c.id} className="rounded-2xl border border-gray-100 overflow-hidden bg-white hover:shadow-lg transition flex flex-col">
                <div className="aspect-video bg-gradient-to-br from-green-600 to-emerald-800 relative">
                  {c.thumbnailUrl ? (
                    <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : null}
                  <span className="absolute top-2 left-2 bg-white/90 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">{c.enrollmentStatus === "COMPLETED" ? "Completed" : "Active"}</span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-800 line-clamp-2">{c.courseTitle}</h3>
                  <p className="text-xs text-gray-500 mt-1">{c.level || "Beginner"} · 🎬 {c.recordedCount} recorded</p>
                  <div className="mt-auto pt-4 flex gap-2">
                    <Link to={`/course/${c.id}`} className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Latest recorded classes */}
      <Card title="🎬 Latest Recorded Classes" right={recorded.length > 6 && <button onClick={() => onNavigate("recorded")} className="text-sm text-green-700 font-semibold hover:underline">View all →</button>}>
        {latest.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No recorded classes have been uploaded for your courses yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {latest.map((v) => (
              <button key={v.id} onClick={() => onNavigate("recorded", { courseId: v.courseId, videoId: v.id })} className="text-left flex gap-3 border border-gray-100 rounded-xl p-3 hover:border-green-300 hover:bg-green-50/40 transition">
                <div className="w-28 aspect-video rounded-lg bg-gradient-to-br from-green-600 to-emerald-800 flex-shrink-0 overflow-hidden relative flex items-center justify-center text-white text-2xl">
                  {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : "▶"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-green-700 font-semibold truncate">{v.courseTitle}</p>
                  <p className="font-semibold text-gray-800 line-clamp-2 text-sm">{v.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{v.classNumber ? `Class ${v.classNumber}` : ""}{v.classNumber && v.durationSeconds ? " · " : ""}{fmtDuration(v.durationSeconds)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
