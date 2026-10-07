import React, { useCallback, useEffect, useState } from "react";
import {
  Card, EmptyState, Modal, PageTitle, ProgressBar, apiForm, apiGet, apiSend, fmtBytes, fmtDate, fmtDuration,
  ghostBtn, inputCls, labelCls, primaryBtn, readVideoDuration, useConfirm,
} from "../../components/dashboard/common";

const emptyForm = (courseId = "") => ({ courseId: courseId ? String(courseId) : "", title: "", description: "", classNumber: "", source: "FILE", videoUrl: "", video: null, thumbnail: null, durationSeconds: null });

// Recorded Classes: upload (course, title, description, class number, video, thumbnail) and manage
export default function InstructorRecorded({ userId, courses, presetCourseId, onChanged, showToast }) {
  const [form, setForm] = useState(emptyForm(presetCourseId));
  const [filter, setFilter] = useState(presetCourseId ? String(presetCourseId) : "ALL");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(null);
  const [confirmDialog, askConfirm] = useConfirm();

  const load = useCallback(async () => {
    try { setItems(await apiGet(`/recorded-classes/teacher/${userId}`)); }
    catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [userId, showToast]);
  useEffect(() => { load(); }, [load]);

  // suggest the next class number for the chosen course
  const pickCourse = (courseId) => {
    const next = items.filter((i) => String(i.courseId) === courseId).reduce((m, i) => Math.max(m, i.classNumber || 0), 0) + 1;
    setForm((f) => ({ ...f, courseId, classNumber: courseId ? String(next) : "" }));
  };

  const pickVideo = async (file) => {
    if (!file) { setForm((f) => ({ ...f, video: null, durationSeconds: null })); return; }
    const durationSeconds = await readVideoDuration(file);
    setForm((f) => ({ ...f, video: file, durationSeconds }));
  };

  const upload = async () => {
    if (!form.courseId) return showToast("Please select a course", "error");
    if (!form.title.trim()) return showToast("Please enter a class title", "error");
    if (form.source === "FILE" && !form.video) return showToast("Please choose a video file", "error");
    if (form.source === "LINK" && !/^https?:\/\//i.test(form.videoUrl.trim())) return showToast("Please paste a valid video link", "error");
    const fd = new FormData();
    fd.append("teacherId", userId);
    fd.append("courseId", form.courseId);
    fd.append("title", form.title.trim());
    fd.append("description", form.description);
    if (form.classNumber) fd.append("classNumber", form.classNumber);
    if (form.durationSeconds) fd.append("durationSeconds", form.durationSeconds);
    if (form.source === "FILE") fd.append("video", form.video); else fd.append("videoUrl", form.videoUrl.trim());
    if (form.thumbnail) fd.append("thumbnail", form.thumbnail);
    setBusy(true); setProgress(0);
    try {
      const res = await apiForm("/recorded-classes/upload", fd, setProgress);
      showToast(res.message);
      setForm(emptyForm(form.courseId));
      await load();
      onChanged();
    } catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };

  const remove = async (item) => {
    if (!(await askConfirm(`Delete "${item.title}"? Students will no longer be able to watch it.`))) return;
    try { await apiSend(`/recorded-classes/${item.id}?teacherId=${userId}`, "DELETE"); showToast("Recorded class deleted"); await load(); onChanged(); }
    catch (err) { showToast(err.message, "error"); }
  };

  const visible = items.filter((i) => filter === "ALL" || String(i.courseId) === filter);

  return (
    <>
      {confirmDialog}
      <PageTitle>🎬 Recorded Classes</PageTitle>

      <Card title="Upload a new recorded class" className="mb-8">
        {courses.length === 0 ? (
          <p className="text-sm text-gray-500">You need a course before you can upload classes.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Course *</label>
              <select className={inputCls} value={form.courseId} onChange={(e) => pickCourse(e.target.value)}>
                <option value="">Select a course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.courseTitle}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Class number</label>
              <input type="number" min="1" className={inputCls} value={form.classNumber} onChange={(e) => setForm({ ...form, classNumber: e.target.value })} placeholder="e.g. 12" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Class title *</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduction to Spring Security" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea rows="3" className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is covered in this class?" />
            </div>

            <div className="md:col-span-2">
              <div className="flex gap-2 mb-2">
                {[["FILE", "⬆️ Upload video"], ["LINK", "🔗 Video link"]].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setForm({ ...form, source: k })} className={`px-4 py-2 rounded-lg text-sm font-semibold ${form.source === k ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{l}</button>
                ))}
              </div>
              {form.source === "FILE" ? (
                <>
                  <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.m4v" onChange={(e) => pickVideo(e.target.files[0])} className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.video ? `${form.video.name} · ${fmtBytes(form.video.size)}${form.durationSeconds ? ` · ${fmtDuration(form.durationSeconds)}` : ""}` : "MP4 / WebM / MOV, up to 1 GB. MP4 (H.264) plays everywhere."}
                  </p>
                </>
              ) : (
                <input className={inputCls} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=... (unlisted YouTube / Vimeo / direct .mp4)" />
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Thumbnail (optional)</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm({ ...form, thumbnail: e.target.files[0] || null })} className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" />
            </div>

            {busy && <div className="md:col-span-2"><ProgressBar value={progress} /><p className="text-xs text-gray-500 mt-1">Uploading… {progress}% — please keep this page open.</p></div>}

            <div className="md:col-span-2">
              <button onClick={upload} disabled={busy} className={`w-full ${primaryBtn}`}>{busy ? "Uploading..." : "Upload recorded class"}</button>
              <p className="text-xs text-gray-500 mt-2">Enrolled students of the selected course will see it in their Recorded Classes automatically.</p>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-lg font-bold text-green-800">Uploaded classes ({visible.length})</h2>
        <select className={`${inputCls} max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All Courses</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.courseTitle}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : visible.length === 0 ? (
        <EmptyState icon="🎬" title="No recorded classes yet" text="Upload your first class above." />
      ) : (
        <div className="space-y-3">
          {visible.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-4 items-center flex-wrap">
              <div className="w-36 aspect-video rounded-lg bg-gradient-to-br from-green-600 to-emerald-800 overflow-hidden relative flex items-center justify-center text-white text-2xl flex-shrink-0">
                {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : "▶"}
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-semibold text-green-700">{v.courseTitle}</p>
                <h3 className="font-bold text-gray-800">{v.classNumber ? `#${v.classNumber} · ` : ""}{v.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{v.videoSource === "FILE" ? "Uploaded video" : "Video link"}{v.durationSeconds ? ` · ${fmtDuration(v.durationSeconds)}` : ""} · {fmtDate(v.uploadedAt)}</p>
              </div>
              <div className="flex gap-2">
                <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Preview</a>
                <button onClick={() => setEditing(v)} className="px-3 py-2 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">✏️ Edit</button>
                <button onClick={() => remove(v)} className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50">🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <EditModal item={editing} userId={userId} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} showToast={showToast} />}
    </>
  );
}

function EditModal({ item, userId, onClose, onSaved, showToast }) {
  const [f, setF] = useState({ title: item.title, description: item.description || "", classNumber: item.classNumber || "", videoUrl: item.videoSource === "LINK" ? item.videoUrl : "", video: null, thumbnail: null, durationSeconds: null });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const save = async () => {
    if (!f.title.trim()) return showToast("Title is required", "error");
    const fd = new FormData();
    fd.append("teacherId", userId);
    fd.append("title", f.title.trim());
    fd.append("description", f.description);
    if (f.classNumber) fd.append("classNumber", f.classNumber);
    if (f.video) { fd.append("video", f.video); if (f.durationSeconds) fd.append("durationSeconds", f.durationSeconds); }
    else if (f.videoUrl.trim() && f.videoUrl.trim() !== item.videoUrl) fd.append("videoUrl", f.videoUrl.trim());
    if (f.thumbnail) fd.append("thumbnail", f.thumbnail);
    setBusy(true);
    try {
      const res = await apiForm(`/recorded-classes/${item.id}/update`, fd, setProgress);
      showToast(res.message);
      await onSaved();
    } catch (err) { showToast(err.message, "error"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Edit recorded class" onClose={onClose}>
      <div className="space-y-4">
        <div><label className={labelCls}>Class title *</label><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><label className={labelCls}>Class number</label><input type="number" min="1" className={inputCls} value={f.classNumber} onChange={(e) => setF({ ...f, classNumber: e.target.value })} /></div>
        <div><label className={labelCls}>Description</label><textarea rows="3" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div>
          <label className={labelCls}>Replace video file (optional)</label>
          <input type="file" accept="video/*" className="w-full border border-gray-300 rounded-lg p-2 text-sm" onChange={async (e) => { const file = e.target.files[0] || null; setF({ ...f, video: file, durationSeconds: file ? await readVideoDuration(file) : null }); }} />
        </div>
        {!f.video && (
          <div><label className={labelCls}>…or video link</label><input className={inputCls} value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} placeholder="https://" /></div>
        )}
        <div><label className={labelCls}>Replace thumbnail (optional)</label><input type="file" accept="image/png,image/jpeg,image/webp" className="w-full border border-gray-300 rounded-lg p-2 text-sm" onChange={(e) => setF({ ...f, thumbnail: e.target.files[0] || null })} /></div>
        {busy && f.video && <ProgressBar value={progress} />}
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={busy} className={`flex-1 ${primaryBtn}`}>{busy ? "Saving..." : "Save changes"}</button>
          <button onClick={onClose} disabled={busy} className={`flex-1 ${ghostBtn}`}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
