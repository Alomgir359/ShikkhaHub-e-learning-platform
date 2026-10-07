import React, { useCallback, useEffect, useState } from "react";
import {
  Card, EmptyState, Modal, PageTitle, apiGet, apiSend, fmtDate, fmtTime, ghostBtn, inputCls, labelCls, primaryBtn, todayStr, useConfirm,
} from "../../components/dashboard/common";

const emptyForm = (courseId = "") => ({ courseId: courseId ? String(courseId) : "", title: "", classDate: "", startTime: "", meetingLink: "", description: "" });

// Live Classes: schedule a Zoom class for a course; enrolled students see it on the day
export default function InstructorLive({ userId, courses, presetCourseId, onChanged, showToast }) {
  const [form, setForm] = useState(emptyForm(presetCourseId));
  const [filter, setFilter] = useState(presetCourseId ? String(presetCourseId) : "ALL");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDialog, askConfirm] = useConfirm();

  const load = useCallback(async () => {
    try { setItems(await apiGet(`/live-classes/teacher/${userId}`)); }
    catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [userId, showToast]);
  useEffect(() => { load(); }, [load]);

  const validate = (f) => {
    if (!f.courseId && !f.id) return "Please select a course";
    if (!f.title.trim()) return "Please enter a class title";
    if (!f.classDate) return "Please choose a date";
    if (!f.startTime) return "Please choose a start time";
    if (!/^https?:\/\//i.test(f.meetingLink.trim())) return "Please paste the Zoom meeting link (https://…)";
    return null;
  };

  const create = async () => {
    const problem = validate(form);
    if (problem) return showToast(problem, "error");
    setBusy(true);
    try {
      const res = await apiSend("/live-classes/create", "POST", { ...form, teacherId: userId, courseId: form.courseId });
      showToast(res.message);
      setForm(emptyForm(form.courseId));
      await load();
      onChanged();
    } catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };

  const remove = async (c) => {
    if (!(await askConfirm(`Delete the live class "${c.title}"?`))) return;
    try { await apiSend(`/live-classes/${c.id}?teacherId=${userId}`, "DELETE"); showToast("Live class deleted"); await load(); onChanged(); }
    catch (err) { showToast(err.message, "error"); }
  };

  const today = todayStr();
  const visible = items.filter((i) => filter === "ALL" || String(i.courseId) === filter);
  const upcoming = visible.filter((i) => i.classDate >= today).sort((a, b) => (a.classDate + a.startTime).localeCompare(b.classDate + b.startTime));
  const past = visible.filter((i) => i.classDate < today);

  const Row = ({ c }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-green-700">{c.courseTitle}</p>
        <h3 className="font-bold text-gray-800">{c.title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">📅 {fmtDate(c.classDate)} · 🕒 {fmtTime(c.startTime)}{c.classDate === today && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">Today</span>}</p>
        {c.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description}</p>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Start / open Zoom</a>
        <button onClick={() => setEditing(c)} className="px-3 py-2 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">✏️ Edit</button>
        <button onClick={() => remove(c)} className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50">🗑️ Delete</button>
      </div>
    </div>
  );

  return (
    <>
      {confirmDialog}
      <PageTitle>🎥 Live Classes</PageTitle>

      <Card title="Schedule a live class" className="mb-8">
        {courses.length === 0 ? <p className="text-sm text-gray-500">You need a course before you can schedule live classes.</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Course *</label>
              <select className={inputCls} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Select a course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.courseTitle}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Class title *</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Class 14 — JPA relationships" />
            </div>
            <div><label className={labelCls}>Date *</label><input type="date" min={today} className={inputCls} value={form.classDate} onChange={(e) => setForm({ ...form, classDate: e.target.value })} /></div>
            <div><label className={labelCls}>Start time *</label><input type="time" className={inputCls} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            <div className="md:col-span-2">
              <label className={labelCls}>Zoom meeting link *</label>
              <input className={inputCls} value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://zoom.us/j/123456789?pwd=..." />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description (optional)</label>
              <textarea rows="2" className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2"><button onClick={create} disabled={busy} className={`w-full ${primaryBtn}`}>{busy ? "Scheduling..." : "Create live class"}</button></div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-lg font-bold text-green-800">Upcoming ({upcoming.length})</h2>
        <select className={`${inputCls} max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All Courses</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.courseTitle}</option>)}
        </select>
      </div>
      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : upcoming.length === 0 ? (
        <EmptyState icon="🎥" title="No upcoming live classes" text="Schedule one above." />
      ) : <div className="space-y-3 mb-8">{upcoming.map((c) => <Row key={c.id} c={c} />)}</div>}

      {past.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-gray-500 mb-3 mt-8">Past ({past.length})</h2>
          <div className="space-y-3 opacity-80">{past.map((c) => <Row key={c.id} c={c} />)}</div>
        </>
      )}

      {editing && <EditModal item={editing} userId={userId} validate={validate} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} showToast={showToast} />}
    </>
  );
}

function EditModal({ item, userId, validate, onClose, onSaved, showToast }) {
  const [f, setF] = useState({ id: item.id, title: item.title, classDate: item.classDate, startTime: item.startTime.slice(0, 5), meetingLink: item.meetingLink, description: item.description || "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const problem = validate(f);
    if (problem) return showToast(problem, "error");
    setBusy(true);
    try { const res = await apiSend(`/live-classes/${item.id}`, "PUT", { ...f, teacherId: userId }); showToast(res.message); await onSaved(); }
    catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Edit live class" onClose={onClose}>
      <div className="space-y-4">
        <div><label className={labelCls}>Class title *</label><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Date *</label><input type="date" className={inputCls} value={f.classDate} onChange={(e) => setF({ ...f, classDate: e.target.value })} /></div>
          <div><label className={labelCls}>Start time *</label><input type="time" className={inputCls} value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></div>
        </div>
        <div><label className={labelCls}>Zoom meeting link *</label><input className={inputCls} value={f.meetingLink} onChange={(e) => setF({ ...f, meetingLink: e.target.value })} /></div>
        <div><label className={labelCls}>Description</label><textarea rows="2" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={busy} className={`flex-1 ${primaryBtn}`}>{busy ? "Saving..." : "Save changes"}</button>
          <button onClick={onClose} disabled={busy} className={`flex-1 ${ghostBtn}`}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
