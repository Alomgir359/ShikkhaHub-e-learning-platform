// Shared building blocks for the Student and Instructor dashboards.
// Same green theme as the rest of ShikkhaHub (green sidebar, white cards).
import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import { API_BASE, getVideoSource } from "../../utils/courseMeta";

export { API_BASE };

/* ───────────────────────── API helpers ───────────────────────── */

const readJson = async (res) => {
  try { return await res.json(); } catch { return null; }
};

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export async function apiSend(path, method, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await readJson(res);
  if (!res.ok || data?.success === false) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

// multipart upload with progress (XMLHttpRequest, because fetch cannot report upload progress)
export function apiForm(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && data?.success !== false) resolve(data);
      else reject(new Error(data?.message || (xhr.status === 413 ? "The file is too large." : `Upload failed (${xhr.status})`)));
    };
    xhr.onerror = () => reject(new Error("Network error. Please check that the backend server is running."));
    xhr.send(formData);
  });
}

/* ───────────────────────── Formatters ───────────────────────── */

const pad = (n) => String(n).padStart(2, "0");

// Browser-local "today" as YYYY-MM-DD
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fmtDate = (value) => {
  if (!value) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const fmtDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

// "21:00:00" -> "9:00 PM"
export const fmtTime = (value) => {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

// seconds -> "1:05:30" / "12:30"
export const fmtDuration = (sec) => {
  if (!sec || sec <= 0) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export const fmtBytes = (n) => {
  if (!n && n !== 0) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const liveStart = (cls) => new Date(`${cls.classDate}T${(cls.startTime || "00:00").slice(0, 5)}:00`);

// UPCOMING → LIVE (from the start time, for 3 hours) → ENDED
export const liveState = (cls, now = new Date()) => {
  const start = liveStart(cls);
  if (now < start) return "UPCOMING";
  return now - start < 3 * 60 * 60 * 1000 ? "LIVE" : "ENDED";
};

// Reads the length of a local video file in the browser (so the instructor does not type it)
export const readVideoDuration = (file) =>
  new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Number.isFinite(v.duration) ? Math.round(v.duration) : null); };
      v.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      v.src = url;
    } catch {
      resolve(null);
    }
  });

export const inputCls =
  "w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none";
export const labelCls = "block text-sm font-medium text-gray-700 mb-1";
export const primaryBtn =
  "bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed";
export const ghostBtn =
  "bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-semibold";

/* ───────────────────────── Toasts & confirm ───────────────────────── */

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);
  return { toasts, showToast, removeToast };
}

export function ToastStack({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-[110] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium min-w-[260px] max-w-[380px] ${
            t.type === "success"
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : t.type === "error"
              ? "bg-gradient-to-r from-red-500 to-rose-600"
              : "bg-gradient-to-r from-blue-500 to-indigo-600"
          }`}
          style={{ animation: "dashSlideIn .3s ease" }}
        >
          <span className="text-xl flex-shrink-0">{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      ))}
      <style>{`@keyframes dashSlideIn { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

// const [confirmDialog, askConfirm] = useConfirm();  ...  if (!(await askConfirm("Delete?"))) return;
export function useConfirm() {
  const [state, setState] = useState(null);
  const ask = useCallback((message) => new Promise((resolve) => setState({ message, resolve })), []);
  const answer = (result) => { state?.resolve(result); setState(null); };
  const dialog = state ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-gray-700 font-medium">{state.message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => answer(true)} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-semibold transition">Confirm</button>
          <button onClick={() => answer(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-semibold transition">Cancel</button>
        </div>
      </div>
    </div>
  ) : null;
  return [dialog, ask];
}

/* ───────────────────────── Small UI pieces ───────────────────────── */

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon = "📭", title, text, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {text && <p className="text-gray-500 text-sm mt-1">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function PageTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">{children}</h1>
      {right}
    </div>
  );
}

// "Hello, Md.Alomgir! 👋 — Welcome back, let's pick up where you left off."
export function Greeting({ name }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        Hello, {name || "there"}! <span aria-hidden>👋</span>
      </h1>
      <p className="text-gray-500 text-sm mt-1">Welcome back — let's pick up where you left off.</p>
    </div>
  );
}

const STAT_TONES = {
  green: "bg-green-50 border-green-100 text-green-700",
  blue: "bg-blue-50 border-blue-100 text-blue-700",
  orange: "bg-orange-50 border-orange-100 text-orange-700",
  purple: "bg-purple-50 border-purple-100 text-purple-700",
};

export function StatCard({ icon, value, label, tone = "green", onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`text-left rounded-2xl border p-5 flex items-center gap-4 transition ${STAT_TONES[tone]} ${onClick ? "hover:shadow-md hover:-translate-y-0.5" : ""}`}
    >
      <span className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0">{icon}</span>
      <span>
        <span className="block text-3xl font-bold leading-none">{value}</span>
        <span className="block text-sm mt-1 text-gray-600">{label}</span>
      </span>
    </Tag>
  );
}

export function Card({ title, right, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-green-800">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES = {
  PENDING: ["Pending", "bg-yellow-100 text-yellow-800"],
  SUBMITTED: ["Submitted", "bg-blue-100 text-blue-700"],
  UNDER_REVIEW: ["Under review", "bg-purple-100 text-purple-700"],
  GRADED: ["Graded", "bg-green-100 text-green-700"],
  RESUBMIT_REQUESTED: ["Resubmit requested", "bg-orange-100 text-orange-700"],
};

export const STATUS_LABEL = Object.fromEntries(Object.entries(STATUS_STYLES).map(([k, v]) => [k, v[0]]));

export function StatusPill({ status }) {
  const [label, cls] = STATUS_STYLES[status] || [status, "bg-gray-100 text-gray-700"];
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>{label}</span>;
}

export function Avatar({ src, name, size = 80, className = "" }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const initials = (name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const style = { width: size, height: size, fontSize: size / 2.6 };
  if (!src || broken) {
    return (
      <div style={style} className={`rounded-full bg-green-600 text-white font-bold flex items-center justify-center ${className}`}>
        {initials || "?"}
      </div>
    );
  }
  return <img src={src} alt={name || "profile"} style={style} onError={() => setBroken(true)} className={`rounded-full object-cover ${className}`} />;
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl w-full ${wide ? "max-w-3xl" : "max-w-xl"} p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-700">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-green-500 transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

// Plays an uploaded video file, or a YouTube / Vimeo / direct link
export function VideoPlayer({ video }) {
  if (!video?.videoUrl) return null;
  if (video.videoSource === "FILE") {
    return (
      <video
        key={video.videoUrl}
        src={video.videoUrl}
        poster={video.thumbnailUrl || undefined}
        controls
        autoPlay
        controlsList="nodownload"
        className="w-full h-full bg-black"
      />
    );
  }
  const src = getVideoSource(video.videoUrl);
  if (!src) return null;
  return src.kind === "video" ? (
    <video key={src.src} src={src.src} poster={video.thumbnailUrl || undefined} controls autoPlay className="w-full h-full bg-black" />
  ) : (
    <iframe
      key={src.src}
      src={src.src}
      title={video.title}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}

/* ───────────────────────── Profile hook ───────────────────────── */

export function useProfile(userId, showToast) {
  const [profile, setProfile] = useState({
    id: userId,
    fullName: localStorage.getItem("userName") || "",
    email: localStorage.getItem("userEmail") || "",
  });
  const [uploading, setUploading] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(Date.now());

  const reload = useCallback(async () => {
    try {
      const data = await apiGet(`/teachers/${userId}`);
      setProfile(data);
    } catch (err) {
      console.error("Could not load profile", err);
    }
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  const photoUrl = profile.profilePhotoPath ? `${API_BASE}/teachers/profile-pic/${profile.id}?v=${photoVersion}` : null;

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("profilePhoto", file);
      const res = await fetch(`${API_BASE}/teachers/upload-profile-pic/${userId}`, { method: "POST", body: fd });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.message || "Failed to upload profile picture");
      setProfile((p) => ({ ...p, profilePhotoPath: data.profilePhotoPath }));
      setPhotoVersion(Date.now());
      showToast("Profile picture updated 📸");
    } catch (err) {
      showToast(err.message || "Network error", "error");
    } finally {
      setUploading(false);
    }
  };

  return { profile, setProfile, reload, photoUrl, uploading, uploadPhoto };
}

/* ───────────────────────── Page shell (sidebar + content) ───────────────────────── */

export function DashboardShell({ menu, active, onSelect, profile, photoUrl, uploading, onPhoto, subtitle, footerNote, sidebarExtra, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
        {/* SIDEBAR (desktop) */}
        <aside className="hidden md:flex w-72 bg-gradient-to-b from-green-700 to-emerald-800 text-white flex-col shadow-2xl overflow-y-auto h-[calc(100vh-64px)] sticky top-16 flex-shrink-0">
          <div className="p-6 flex flex-col h-full">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <Avatar src={photoUrl} name={profile.fullName} size={80} className="border-4 border-white shadow-lg mx-auto" />
                <label className="absolute bottom-0 right-0 bg-green-600 rounded-full p-1 cursor-pointer hover:bg-green-700 transition" title="Change profile picture">
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { onPhoto(e.target.files[0]); e.target.value = ""; }} />
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </label>
              </div>
              <h2 className="mt-3 font-bold">{profile.fullName || subtitle}</h2>
              <p className="text-xs text-white/70 break-all">{profile.email || subtitle}</p>
            </div>

            <nav className="space-y-1.5 text-sm flex-1">
              {menu.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition flex items-center justify-between gap-2 ${active === item.key ? "bg-white/20 font-semibold" : "hover:bg-white/10"}`}
                >
                  <span>{item.label}</span>
                  {item.badge > 0 && <span className="bg-yellow-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
                </button>
              ))}
              {sidebarExtra}
            </nav>

            <div className="mt-6 pt-4 border-t border-white/20 text-xs text-white/60">
              ShikkhaHub
              <p className="mt-1">{footerNote}</p>
            </div>
          </div>
        </aside>

        {/* MENU (mobile) */}
        <div className="md:hidden bg-gradient-to-r from-green-700 to-emerald-800 text-white overflow-x-auto flex gap-2 p-2 sticky top-16 z-30">
          {menu.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm flex-shrink-0 ${active === item.key ? "bg-white/25 font-semibold" : "bg-white/5"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <main className="flex-1 md:overflow-y-auto md:h-[calc(100vh-64px)] min-w-0">
          <div className="p-4 md:p-6">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
