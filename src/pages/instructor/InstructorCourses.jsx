import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, Modal, PageTitle, apiGet, fmtDate, primaryBtn } from "../../components/dashboard/common";

// My Courses: only the courses this instructor is in charge of, with shortcuts into each workflow
export default function InstructorCourses({ userId, courses, onNavigate, onCreate, showToast }) {
  const navigate = useNavigate();
  const [studentsOf, setStudentsOf] = useState(null); // { course, list }
  const [loadingStudents, setLoadingStudents] = useState(false);

  const openStudents = async (course) => {
    setLoadingStudents(true);
    setStudentsOf({ course, list: [] });
    try {
      setStudentsOf({ course, list: await apiGet(`/dashboard/instructor/${userId}/courses/${course.id}/students`) });
    } catch (err) {
      showToast(err.message, "error");
      setStudentsOf(null);
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <>
      <PageTitle right={<button onClick={onCreate} className={primaryBtn}>+ Create New Course</button>}>My Courses</PageTitle>

      {courses.length === 0 ? (
        <EmptyState icon="📚" title="No courses assigned yet" text="Create your first course, or ask the admin to assign one to you.">
          <button onClick={onCreate} className={primaryBtn}>Create Your First Course</button>
        </EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition flex flex-col">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg line-clamp-2">{c.courseTitle}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${c.isApproved === 1 ? "bg-green-500" : "bg-yellow-500"}`}>{c.isApproved === 1 ? "Approved" : "Pending"}</span>
                </div>
                <p className="text-xs opacity-90 mt-1">{c.level} · {c.durationInWeeks} weeks{c.batchNumber ? ` · Batch ${c.batchNumber}` : ""}</p>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  {[
                    ["👨‍🎓", c.studentCount, "Students"],
                    ["🎬", c.recordedCount, "Recorded"],
                    ["📝", c.assignmentCount, "Assignments"],
                    ["🎥", c.liveCount, "Live classes"],
                  ].map(([icon, n, label]) => (
                    <div key={label} className="bg-gray-50 rounded-lg px-3 py-2"><span className="font-bold text-green-700">{icon} {n}</span> <span className="text-gray-500">{label}</span></div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button onClick={() => onNavigate("recorded", c.id)} className="border border-green-200 text-green-800 text-sm font-semibold rounded-lg py-2 hover:bg-green-50">Recorded</button>
                  <button onClick={() => onNavigate("assignments", c.id)} className="border border-green-200 text-green-800 text-sm font-semibold rounded-lg py-2 hover:bg-green-50">Assignments</button>
                  <button onClick={() => onNavigate("live", c.id)} className="border border-green-200 text-green-800 text-sm font-semibold rounded-lg py-2 hover:bg-green-50">Live classes</button>
                  <button onClick={() => openStudents(c)} className="border border-green-200 text-green-800 text-sm font-semibold rounded-lg py-2 hover:bg-green-50">Students</button>
                </div>
                <button onClick={() => navigate(`/course/${c.id}`)} className="mt-2 w-full bg-blue-600 text-white text-sm font-semibold rounded-lg py-2 hover:bg-blue-700">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {studentsOf && (
        <Modal title={`Students — ${studentsOf.course.courseTitle}`} onClose={() => setStudentsOf(null)} wide>
          {loadingStudents ? (
            <p className="text-center text-gray-500 py-8">Loading…</p>
          ) : studentsOf.list.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students are enrolled in this course yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-gray-500 border-b"><tr><th className="py-2 pr-4">Name</th><th className="pr-4">Email</th><th className="pr-4">Phone</th><th>Enrolled</th></tr></thead>
                <tbody className="divide-y">
                  {studentsOf.list.map((s) => (
                    <tr key={s.studentId}><td className="py-2 pr-4 font-medium">{s.name}</td><td className="pr-4 text-gray-600">{s.email}</td><td className="pr-4 text-gray-600">{s.phone || "—"}</td><td className="text-gray-500 whitespace-nowrap">{fmtDate(s.enrolledAt)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
