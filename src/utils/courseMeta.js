// utils/courseMeta.js
// Shared helpers for the e-learning course UI (cards, details hero, upcoming live page)
import { useEffect, useState } from "react";

export const API_BASE = `${process.env.REACT_APP_API_URL || "http://localhost:8080"}/api`;
// Old courses (created before courseType existed) come back as null → treat them as LIVE
export const courseTypeOf = (course) => {
  const t = ((course?.courseType || "LIVE") + "").toUpperCase();
  return ["LIVE", "OFFLINE", "RECORDED"].includes(t) ? t : "LIVE";
};

export const isLiveCourse = (course) => courseTypeOf(course) === "LIVE";
export const isOfflineCourse = (course) => courseTypeOf(course) === "OFFLINE";
export const isRecordedCourse = (course) => courseTypeOf(course) === "RECORDED";
// LIVE and OFFLINE both run as a batch with a start date, class days/time and seats
export const isBatchCourse = (course) => !isRecordedCourse(course);

export const courseTypeLabel = (course) =>
  isOfflineCourse(course) ? "Offline batch" : isLiveCourse(course) ? "Live course" : "Recorded course";

export const formatTaka = (n) =>
  n === null || n === undefined || n === "" ? "" : `৳${Number(n).toLocaleString("en-IN")}`;

export const isFreeCourse = (course) => !course?.price || Number(course.price) === 0;

// Discount % only when an original price higher than the selling price exists
export const discountPercent = (course) => {
  const price = Number(course?.price || 0);
  const original = Number(course?.originalPrice || 0);
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
};

export const seatsLeft = (course) => {
  if (!course?.totalSeats) return null;
  return Math.max(0, Number(course.totalSeats) - Number(course.enrolledStudents || 0));
};

const parseDate = (value) => {
  if (!value) return null;
  // "2026-10-31" → local midnight (avoid UTC shift)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
};

export const toDate = parseDate;

// "Sat, 31 Oct"
export const formatShortDate = (value) => {
  const d = parseDate(value);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

// "31 Oct 2026"
export const formatLongDate = (value) => {
  const d = parseDate(value);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const daysUntil = (value) => {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

// Batch hasn't started yet (or no date set) → still open for this batch
export const isUpcoming = (course) => {
  const days = daysUntil(course?.batchStartDate);
  return days === null || days >= 0;
};

export const offerDaysLeft = (course) => {
  const end = parseDate(course?.offerEndsAt);
  if (!end) return null;
  const diff = end - new Date();
  if (diff <= 0) return null;
  return Math.max(1, Math.ceil(diff / 86400000));
};

// "Sat, Wed · 9:00 PM - 10:30 PM" — falls back to the older free-text `schedule`
export const liveScheduleText = (course) => {
  const parts = [course?.classDays, course?.classTime].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return course?.schedule || "";
};

// YouTube / Vimeo / direct file → { kind: "iframe" | "video", src }
export const getVideoSource = (url) => {
  if (!url) return null;
  const u = url.trim();
  const yt =
    u.match(/youtu\.be\/([\w-]{6,})/) ||
    u.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?rel=0&autoplay=1` };
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return { kind: "video", src: u };
  return { kind: "iframe", src: u };
};

// YouTube thumbnail for the video poster when no course thumbnail exists
export const getVideoPoster = (url) => {
  if (!url) return null;
  const yt =
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)([\w-]{6,})/);
  return yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : null;
};

// Live countdown → { days, hours, minutes, seconds, done }
export const useCountdown = (target) => {
  const targetTime = parseDate(target)?.getTime() || null;
  const calc = () => {
    if (!targetTime) return null;
    const diff = Math.max(0, targetTime - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      done: diff === 0,
    };
  };
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    if (!targetTime) { setLeft(null); return; }
    setLeft(calc());
    const t = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTime]);
  return left;
};

// Open the Navbar's login / sign-up modal from anywhere
export const openAuthModal = (mode = "login", options = {}) => {
  window.dispatchEvent(new CustomEvent("shikkhahub:open-auth", { detail: { mode, ...options } }));
};
