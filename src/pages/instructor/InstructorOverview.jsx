import React from "react";
import { Card, Greeting, StatCard, StatusPill, fmtDateTime } from "../../components/dashboard/common";

export default function InstructorOverview({ name, summary, onNavigate }) {
  const s = summary || {};
  const recent = s.recentSubmissions || [];
  return (
    <>
      <Greeting name={name} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📚" value={s.assignedCourses ?? 0} label="Assigned Courses" tone="green" onClick={() => onNavigate("courses")} />
        <StatCard icon="👨‍🎓" value={s.totalStudents ?? 0} label="Total Students" tone="purple" onClick={() => onNavigate("courses")} />
        <StatCard icon="📝" value={s.activeAssignments ?? 0} label="Active Assignments" tone="orange" onClick={() => onNavigate("assignments")} />
        <StatCard icon="🎥" value={s.upcomingLiveClasses ?? 0} label="Upcoming Live Classes" tone="blue" onClick={() => onNavigate("live")} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[
          ["recorded", "🎬 Upload recorded class"],
          ["assignments", "📝 Create assignment"],
          ["live", "🎥 Schedule live class"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => onNavigate(key)} className="bg-white border border-green-200 text-green-800 font-semibold rounded-xl py-3 hover:bg-green-50 transition">{label}</button>
        ))}
      </div>

      <Card
        title="📥 Recent Submissions"
        right={<button onClick={() => onNavigate("submissions")} className="text-sm text-green-700 font-semibold hover:underline">{s.toReview > 0 ? `${s.toReview} to review → ` : "View all →"}</button>}
      >
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 border-b">
                <tr><th className="py-2 pr-4">Student</th><th className="pr-4">Assignment</th><th className="pr-4">Course</th><th className="pr-4">Submitted</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((r) => (
                  <tr key={r.id} className="hover:bg-green-50/40 cursor-pointer" onClick={() => onNavigate("submissions")}>
                    <td className="py-3 pr-4 font-medium text-gray-800">{r.studentName}</td>
                    <td className="pr-4">{r.assignmentTitle}</td>
                    <td className="pr-4 text-gray-500">{r.courseTitle}</td>
                    <td className="pr-4 text-gray-500 whitespace-nowrap">{fmtDateTime(r.submittedAt)}</td>
                    <td><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
