import React, { useMemo, useState } from "react";
import { EmptyState, PageTitle, ProgressBar, StatusPill, apiForm, fmtDateTime, fmtBytes, inputCls, labelCls, primaryBtn, ghostBtn } from "../../components/dashboard/common";
import { FILE_HINT, MAX_SUBMISSION_BYTES, deadlineInfo } from "./studentUtils";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "GRADED", label: "Graded" },
];

// Assignments of the enrolled courses: read the task, submit a file or a link, see marks & feedback
export default function StudentAssignments({ userId, courses, assignments, onChanged, showToast }) {
  const [tab, setTab] = useState("ALL");
  const [courseId, setCourseId] = useState("ALL");
  const [openId, setOpenId] = useState(null);

  const visible = useMemo(
    () =>
      assignments.filter((a) => {
        if (courseId !== "ALL" && String(a.courseId) !== courseId) return false;
        if (tab === "ALL") return true;
        if (tab === "PENDING") return a.status === "PENDING" || a.status === "RESUBMIT_REQUESTED";
        if (tab === "SUBMITTED") return a.status === "SUBMITTED" || a.status === "UNDER_REVIEW";
        return a.status === "GRADED";
      }),
    [assignments, tab, courseId]
  );

  const count = (key) =>
    assignments.filter((a) =>
      key === "ALL" ? true : key === "PENDING" ? a.status === "PENDING" || a.status === "RESUBMIT_REQUESTED" : key === "SUBMITTED" ? a.status === "SUBMITTED" || a.status === "UNDER_REVIEW" : a.status === "GRADED"
    ).length;

  return (
    <>
      <PageTitle>📝 Assignments</PageTitle>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${tab === t.key ? "bg-green-600 text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {t.label} <span className="opacity-70">({count(t.key)})</span>
            </button>
          ))}
        </div>
        <select className={`${inputCls} md:max-w-xs md:ml-auto`} value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="Filter by course">
          <option value="ALL">All Courses</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.courseTitle}</option>)}
        </select>
      </div>

      {assignments.length === 0 ? (
        <EmptyState icon="📝" title="No assignments yet" text="No assignments have been posted for your enrolled courses." />
      ) : visible.length === 0 ? (
        <EmptyState icon="🔎" title="Nothing here" text="No assignments match this filter." />
      ) : (
        <div className="space-y-5">
          {visible.map((a) => (
            <AssignmentCard
              key={a.id}
              a={a}
              userId={userId}
              open={openId === a.id}
              onToggle={() => setOpenId(openId === a.id ? null : a.id)}
              onChanged={onChanged}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </>
  );
}

function AssignmentCard({ a, userId, open, onToggle, onChanged, showToast }) {
  const sub = a.submission;
  const info = deadlineInfo(a.deadline);
  const canSubmit = a.status !== "GRADED";
  const border = a.status === "GRADED" ? "border-green-500" : a.status === "PENDING" ? "border-yellow-400" : a.status === "RESUBMIT_REQUESTED" ? "border-orange-500" : "border-blue-400";

  return (
    <article className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${border} p-5`}>
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-green-700">{a.courseTitle}</p>
          <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
        </div>
        <StatusPill status={a.status} />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mt-2">
        <span className={info.className}>📅 {a.deadline ? `${fmtDateTime(a.deadline)} · ${info.text}` : "No deadline"}</span>
        <span className="text-gray-600">🏆 {a.maxMarks} marks</span>
      </div>

      {a.instructions && <p className="text-gray-700 mt-3 whitespace-pre-wrap text-sm">{a.instructions}</p>}

      {a.attachmentUrl && (
        <a href={a.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 hover:bg-green-100">
          📎 {a.attachmentName || "Instructor's file"} <span className="font-normal text-green-600">— download</span>
        </a>
      )}

      {/* what the student already handed in */}
      {sub && (
        <div className={`mt-4 rounded-xl p-4 text-sm ${a.status === "GRADED" ? "bg-green-50" : a.status === "RESUBMIT_REQUESTED" ? "bg-orange-50" : "bg-blue-50"}`}>
          <p className="font-semibold text-gray-800 mb-1">
            Your submission {sub.late && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Late</span>}
          </p>
          {sub.fileUrl && <p>📄 <a className="text-blue-700 underline break-all" href={sub.fileUrl} target="_blank" rel="noopener noreferrer">{sub.fileName}</a></p>}
          {sub.link && <p>🔗 <a className="text-blue-700 underline break-all" href={sub.link} target="_blank" rel="noopener noreferrer">{sub.link}</a></p>}
          {sub.note && <p className="text-gray-600 mt-1">“{sub.note}”</p>}
          <p className="text-xs text-gray-500 mt-1">Submitted {fmtDateTime(sub.submittedAt)}</p>

          {a.status === "GRADED" && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="font-bold text-green-800">
                ⭐ {sub.marks != null ? `${sub.marks} / ${a.maxMarks}` : ""}{sub.marks != null && sub.grade ? " · " : ""}{sub.grade ? `Grade ${sub.grade}` : ""}
              </p>
              {sub.feedback && <p className="text-gray-700 mt-1 whitespace-pre-wrap"><span className="font-semibold">Instructor feedback:</span> {sub.feedback}</p>}
            </div>
          )}
          {a.status === "RESUBMIT_REQUESTED" && (
            <div className="mt-3 pt-3 border-t border-orange-200 text-orange-900">
              <p className="font-semibold">The instructor asked you to submit again.</p>
              {sub.feedback && <p className="mt-1 whitespace-pre-wrap">{sub.feedback}</p>}
            </div>
          )}
          {(a.status === "SUBMITTED" || a.status === "UNDER_REVIEW") && (
            <p className="text-xs text-blue-700 mt-2">Your instructor will review it soon. You can replace it until it is graded.</p>
          )}
        </div>
      )}

      {canSubmit && !open && (
        <button onClick={onToggle} className={`mt-4 ${primaryBtn}`}>{sub ? "Replace submission" : "Submit assignment"}</button>
      )}
      {canSubmit && open && <SubmitForm a={a} userId={userId} onClose={onToggle} onChanged={onChanged} showToast={showToast} />}
    </article>
  );
}

function SubmitForm({ a, userId, onClose, onChanged, showToast }) {
  const [mode, setMode] = useState("FILE"); // FILE | LINK
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickFile = (f) => {
    if (f && f.size > MAX_SUBMISSION_BYTES) { showToast("File is larger than 50 MB. Please upload it to Google Drive and paste the link.", "error"); return; }
    setFile(f || null);
  };

  const submit = async () => {
    if (mode === "FILE" && !file) { showToast("Please choose a file to submit", "error"); return; }
    if (mode === "LINK" && !/^https?:\/\//i.test(link.trim())) { showToast("Please paste a valid link (starting with https://)", "error"); return; }
    const fd = new FormData();
    fd.append("studentId", userId);
    if (mode === "FILE") fd.append("file", file); else fd.append("link", link.trim());
    if (note.trim()) fd.append("note", note.trim());
    setBusy(true);
    setProgress(0);
    try {
      await apiForm(`/assignments/${a.id}/submit`, fd, setProgress);
      showToast("Assignment submitted ✅");
      await onChanged();
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex gap-2 mb-4">
        {[["FILE", "📎 Upload file"], ["LINK", "🔗 GitHub / Drive link"]].map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === key ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{label}</button>
        ))}
      </div>

      {mode === "FILE" ? (
        <div>
          <label className={labelCls}>Your file</label>
          <input type="file" onChange={(e) => pickFile(e.target.files[0])} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm" />
          <p className="text-xs text-gray-500 mt-1">{file ? `${file.name} · ${fmtBytes(file.size)}` : FILE_HINT}</p>
        </div>
      ) : (
        <div>
          <label className={labelCls}>Link</label>
          <input className={inputCls} placeholder="https://github.com/you/project  or  https://drive.google.com/..." value={link} onChange={(e) => setLink(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Make sure the link is shared so your instructor can open it.</p>
        </div>
      )}

      <div className="mt-3">
        <label className={labelCls}>Note to instructor (optional)</label>
        <textarea rows="2" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {busy && mode === "FILE" && <div className="mt-3"><ProgressBar value={progress} /><p className="text-xs text-gray-500 mt-1">Uploading… {progress}%</p></div>}

      <div className="flex gap-3 mt-4">
        <button onClick={submit} disabled={busy} className={primaryBtn}>{busy ? "Submitting..." : "Submit"}</button>
        <button onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
      </div>
    </div>
  );
}
