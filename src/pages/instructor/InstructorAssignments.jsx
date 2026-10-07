import React, { useCallback, useEffect, useState } from "react";
import {
  Card, EmptyState, Modal, PageTitle, apiForm, apiGet, apiSend, fmtDateTime, ghostBtn, inputCls, labelCls, primaryBtn, useConfirm,
} from "../../components/dashboard/common";

const emptyForm = (courseId = "") => ({ courseId: courseId ? String(courseId) : "", title: "", instructions: "", deadline: "", maxMarks: "100", attachment: null });

// Assignments: course, title, instructions, deadline, attachment → students of that course can submit
export default function InstructorAssignments({ userId, courses, presetCourseId, onChanged, onViewSubmissions, showToast }) {
  const [form, setForm] = useState(emptyForm(presetCourseId));
  const [filter, setFilter] = useState(presetCourseId ? String(presetCourseId) : "ALL");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [confirmDialog, askConfirm] = useConfirm();

  const load = useCallback(async () => {
    try { setItems(await apiGet(`/assignments/teacher/${userId}`)); }
    catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [userId, showToast]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.courseId) return showToast("Please select a course", "error");
    if (!form.title.trim()) return showToast("Please enter an assignment title", "error");
    const fd = new FormData();
    fd.append("teacherId", userId);
    fd.append("courseId", form.courseId);
    fd.append("title", form.title.trim());
    fd.append("instructions", form.instructions);
    if (form.deadline) fd.append("deadline", form.deadline);
    if (form.maxMarks) fd.append("maxMarks", form.maxMarks);
    if (form.attachment) fd.append("attachment", form.attachment);
    setBusy(true);
    try {
      const res = await apiForm("/assignments/create", fd);
      showToast(res.message);
      setForm(emptyForm(form.courseId));
      setFileKey((k) => k + 1);
      await load();
      onChanged();
    } catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };

  const remove = async (a) => {
    if (!(await askConfirm(`Delete "${a.title}" and all ${a.submittedCount} submission(s)?`))) return;
    try { await apiSend(`/assignments/${a.id}?teacherId=${userId}`, "DELETE"); showToast("Assignment deleted"); await load(); onChanged(); }
    catch (err) { showToast(err.message, "error"); }
  };

  const visible = items.filter((i) => filter === "ALL" || String(i.courseId) === filter);

  return (
    <>
      {confirmDialog}
      <PageTitle>📝 Assignments</PageTitle>

      <Card title="Create assignment" className="mb-8">
        {courses.length === 0 ? <p className="text-sm text-gray-500">You need a course before you can create assignments.</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Course *</label>
              <select className={inputCls} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Select a course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.courseTitle}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Total marks</label>
              <input type="number" min="1" className={inputCls} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Assignment title *</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a REST API for a library" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description / instructions</label>
              <textarea rows="4" className={inputCls} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="What should students do? What should they submit?" />
            </div>
            <div>
              <label className={labelCls}>Deadline</label>
              <input type="datetime-local" className={inputCls} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Attachment / PDF (optional)</label>
              <input key={fileKey} type="file" className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" onChange={(e) => setForm({ ...form, attachment: e.target.files[0] || null })} />
            </div>
            <div className="md:col-span-2">
              <button onClick={create} disabled={busy} className={`w-full ${primaryBtn}`}>{busy ? "Creating..." : "Create assignment"}</button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-lg font-bold text-green-800">Your assignments ({visible.length})</h2>
        <select className={`${inputCls} max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All Courses</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.courseTitle}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : visible.length === 0 ? (
        <EmptyState icon="📝" title="No assignments yet" text="Create your first assignment above." />
      ) : (
        <div className="space-y-4">
          {visible.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-green-500 shadow-sm p-4">
              <div className="flex justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-700">{a.courseTitle}</p>
                  <h3 className="font-bold text-gray-800">{a.title}</h3>
                  <p className="text-xs mt-1 text-gray-500">
                    <span className={a.overdue ? "text-red-600 font-semibold" : ""}>📅 {a.deadline ? fmtDateTime(a.deadline) : "No deadline"}{a.overdue ? " (closed)" : ""}</span> · 🏆 {a.maxMarks} marks
                    {a.attachmentName && <> · 📎 <a className="text-blue-700 underline" href={a.attachmentUrl} target="_blank" rel="noopener noreferrer">{a.attachmentName}</a></>}
                  </p>
                </div>
                <div className="flex gap-2 items-start flex-wrap">
                  <button onClick={() => onViewSubmissions(a)} className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">
                    Submissions {a.submittedCount}/{a.enrolledCount}{a.toReviewCount > 0 && ` · ${a.toReviewCount} new`}
                  </button>
                  <button onClick={() => setEditing(a)} className="px-3 py-2 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">✏️ Edit</button>
                  <button onClick={() => remove(a)} className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50">🗑️ Delete</button>
                </div>
              </div>
              {a.instructions && <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap line-clamp-3">{a.instructions}</p>}
            </div>
          ))}
        </div>
      )}

      {editing && <EditModal item={editing} userId={userId} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} showToast={showToast} />}
    </>
  );
}

function EditModal({ item, userId, onClose, onSaved, showToast }) {
  const [f, setF] = useState({ title: item.title, instructions: item.instructions || "", deadline: item.deadline ? item.deadline.slice(0, 16) : "", maxMarks: String(item.maxMarks || 100), attachment: null, removeAttachment: false });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.title.trim()) return showToast("Title is required", "error");
    const fd = new FormData();
    fd.append("teacherId", userId);
    fd.append("title", f.title.trim());
    fd.append("instructions", f.instructions);
    fd.append("deadline", f.deadline); // empty string clears the deadline
    fd.append("maxMarks", f.maxMarks);
    if (f.attachment) fd.append("attachment", f.attachment);
    else if (f.removeAttachment) fd.append("removeAttachment", "true");
    setBusy(true);
    try { const res = await apiForm(`/assignments/${item.id}/update`, fd); showToast(res.message); await onSaved(); }
    catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Edit assignment" onClose={onClose}>
      <div className="space-y-4">
        <div><label className={labelCls}>Title *</label><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><label className={labelCls}>Description / instructions</label><textarea rows="4" className={inputCls} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Deadline</label><input type="datetime-local" className={inputCls} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></div>
          <div><label className={labelCls}>Total marks</label><input type="number" min="1" className={inputCls} value={f.maxMarks} onChange={(e) => setF({ ...f, maxMarks: e.target.value })} /></div>
        </div>
        <div>
          <label className={labelCls}>Attachment {item.attachmentName && `(current: ${item.attachmentName})`}</label>
          <input type="file" className="w-full border border-gray-300 rounded-lg p-2 text-sm" onChange={(e) => setF({ ...f, attachment: e.target.files[0] || null })} />
          {item.attachmentName && !f.attachment && (
            <label className="flex items-center gap-2 text-sm text-gray-600 mt-2"><input type="checkbox" checked={f.removeAttachment} onChange={(e) => setF({ ...f, removeAttachment: e.target.checked })} /> Remove current attachment</label>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={busy} className={`flex-1 ${primaryBtn}`}>{busy ? "Saving..." : "Save changes"}</button>
          <button onClick={onClose} disabled={busy} className={`flex-1 ${ghostBtn}`}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
