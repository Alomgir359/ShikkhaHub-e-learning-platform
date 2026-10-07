import React, { useCallback, useEffect, useState } from "react";
import {
  EmptyState, Modal, PageTitle, STATUS_LABEL, StatusPill, apiGet, apiSend, fmtDateTime, ghostBtn, inputCls, labelCls, primaryBtn,
} from "../../components/dashboard/common";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "GRADED", "RESUBMIT_REQUESTED"];

// Submissions: who submitted what, download it, give marks / grade / feedback and update the status
export default function InstructorSubmissions({ userId, courses, presetFilter, onChanged, showToast }) {
  const [courseId, setCourseId] = useState(presetFilter?.courseId ? String(presetFilter.courseId) : "ALL");
  const [assignmentId, setAssignmentId] = useState(presetFilter?.assignmentId ? String(presetFilter.assignmentId) : "ALL");
  const [status, setStatus] = useState("ALL");
  const [all, setAll] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [subs, asg] = await Promise.all([apiGet(`/assignments/submissions/teacher/${userId}`), apiGet(`/assignments/teacher/${userId}`)]);
      setAll(subs); setAssignments(asg);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [userId, showToast]);
  useEffect(() => { load(); }, [load]);

  const visible = all.filter(
    (s) => (courseId === "ALL" || String(s.courseId) === courseId) && (assignmentId === "ALL" || String(s.assignmentId) === assignmentId) && (status === "ALL" || s.status === status)
  );
  const assignmentChoices = assignments.filter((a) => courseId === "ALL" || String(a.courseId) === courseId);

  return (
    <>
      <PageTitle>📥 Submissions</PageTitle>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <select className={inputCls} value={courseId} onChange={(e) => { setCourseId(e.target.value); setAssignmentId("ALL"); }}>
          <option value="ALL">All Courses</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.courseTitle}</option>)}
        </select>
        <select className={inputCls} value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
          <option value="ALL">All Assignments</option>
          {assignmentChoices.map((a) => <option key={a.id} value={String(a.id)}>{a.title}</option>)}
        </select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : visible.length === 0 ? (
        <EmptyState icon="📥" title="No submissions found" text="Submissions appear here as soon as students hand in their work." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr><th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Assignment</th><th className="p-3">Submitted</th><th className="p-3">Work</th><th className="p-3">Status</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((s) => (
                <tr key={s.id} className="hover:bg-green-50/30">
                  <td className="p-3"><p className="font-semibold text-gray-800">{s.studentName}</p><p className="text-xs text-gray-500">{s.studentEmail}</p></td>
                  <td className="p-3 text-gray-600">{s.courseTitle}</td>
                  <td className="p-3">{s.assignmentTitle}</td>
                  <td className="p-3 whitespace-nowrap text-gray-600">{fmtDateTime(s.submittedAt)}{s.late && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Late</span>}</td>
                  <td className="p-3 space-y-1">
                    {s.fileUrl && <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-700 underline max-w-[180px] truncate" title={s.fileName}>📄 {s.fileName}</a>}
                    {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" className="block text-blue-700 underline max-w-[180px] truncate" title={s.link}>🔗 Open link</a>}
                  </td>
                  <td className="p-3"><StatusPill status={s.status} />{s.status === "GRADED" && <p className="text-xs text-gray-600 mt-1">{s.marks != null ? `${s.marks}/${s.maxMarks}` : ""}{s.grade ? ` ${s.grade}` : ""}</p>}</td>
                  <td className="p-3"><button onClick={() => setReviewing(s)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700">{s.status === "GRADED" ? "Edit grade" : "Review"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewing && <ReviewModal sub={reviewing} userId={userId} onClose={() => setReviewing(null)} onSaved={async () => { setReviewing(null); await load(); onChanged(); }} showToast={showToast} />}
    </>
  );
}

function ReviewModal({ sub, userId, onClose, onSaved, showToast }) {
  const [marks, setMarks] = useState(sub.marks ?? "");
  const [grade, setGrade] = useState(sub.grade || "");
  const [feedback, setFeedback] = useState(sub.feedback || "");
  const [status, setStatus] = useState(sub.status === "SUBMITTED" ? "GRADED" : sub.status);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (status === "GRADED" && marks === "" && !grade.trim()) return showToast("Enter marks or a grade to mark this as Graded", "error");
    setBusy(true);
    try {
      const res = await apiSend(`/assignments/submissions/${sub.id}/review`, "PUT", { teacherId: userId, marks, grade, feedback, status });
      showToast(res.message);
      await onSaved();
    } catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={`Review — ${sub.studentName}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <p className="text-xs font-semibold text-green-700">{sub.courseTitle}</p>
          <p className="font-bold text-gray-800">{sub.assignmentTitle}</p>
          <p className="text-gray-500">Submitted {fmtDateTime(sub.submittedAt)}{sub.late && " · Late"}</p>
          {sub.fileUrl && <p>📄 <a className="text-blue-700 underline break-all" href={sub.fileUrl} target="_blank" rel="noopener noreferrer">View / download {sub.fileName}</a></p>}
          {sub.link && <p>🔗 <a className="text-blue-700 underline break-all" href={sub.link} target="_blank" rel="noopener noreferrer">{sub.link}</a></p>}
          {sub.note && <p className="text-gray-700 pt-1">Student's note: “{sub.note}”</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Marks (out of {sub.maxMarks})</label><input type="number" min="0" max={sub.maxMarks} step="0.5" className={inputCls} value={marks} onChange={(e) => setMarks(e.target.value)} /></div>
          <div><label className={labelCls}>Grade (optional)</label><input className={inputCls} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. A+" /></div>
        </div>
        <div><label className={labelCls}>Feedback</label><textarea rows="4" className={inputCls} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What went well? What should be improved?" /></div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">Students see marks and feedback in their dashboard once the status is Graded. “Resubmit requested” lets them submit again.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={busy} className={`flex-1 ${primaryBtn}`}>{busy ? "Saving..." : "Save review"}</button>
          <button onClick={onClose} disabled={busy} className={`flex-1 ${ghostBtn}`}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
