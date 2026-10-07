import React, { useEffect, useState } from "react";
import { Card, PageTitle, fmtDate, fmtTime, liveState, todayStr } from "../../components/dashboard/common";

// Today's Live Classes (enrolled courses only) + what's coming next
export default function StudentLive({ live }) {
  // re-evaluate "Live now / Ended" every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const today = todayStr();
  const todayLive = live.filter((c) => c.classDate === today);
  const upcoming = live.filter((c) => c.classDate > today);

  return (
    <>
      <PageTitle>🎥 Today's Live Classes</PageTitle>

      {todayLive.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h3 className="text-lg font-bold text-gray-800">আজ কোনো live class নেই</h3>
          <p className="text-sm text-gray-500 mt-1">এই সময়ে পূর্ববর্তী ক্লাস ও এসাইনমেন্টগুলো নিয়ে প্র্যাকটিস করুন।</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {todayLive.map((c) => {
            const state = liveState(c);
            return (
              <div key={c.id} className="bg-white border-l-4 border-green-500 rounded-2xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {state === "LIVE" && <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">🔴 LIVE NOW</span>}
                    {state === "UPCOMING" && <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">📅 UPCOMING</span>}
                    {state === "ENDED" && <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">ENDED</span>}
                    <span className="text-sm text-gray-600">🕒 {fmtTime(c.startTime)}</span>
                  </div>
                  <p className="text-sm font-semibold text-green-700">{c.courseTitle}</p>
                  <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
                  {c.description && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{c.description}</p>}
                  {c.teacherName && <p className="text-xs text-gray-500 mt-1">👨‍🏫 {c.teacherName}</p>}
                </div>
                <a
                  href={c.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3 rounded-xl font-semibold shadow transition ${state === "ENDED" ? "bg-gray-200 text-gray-600 hover:bg-gray-300" : "bg-green-600 text-white hover:bg-green-700"}`}
                >
                  Join Live Class →
                </a>
              </div>
            );
          })}
        </div>
      )}

      {upcoming.length > 0 && (
        <Card title="📅 Upcoming live classes">
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.map((c) => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-700">{c.courseTitle}</p>
                <h4 className="font-bold text-gray-800">{c.title}</h4>
                <p className="text-sm text-gray-500 mt-1">📅 {fmtDate(c.classDate)} · 🕒 {fmtTime(c.startTime)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
