// components/CourseCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  isLiveCourse,
  isOfflineCourse,
  isBatchCourse,
  isFreeCourse,
  formatTaka,
  discountPercent,
  seatsLeft,
  formatShortDate,
  isUpcoming,
  offerDaysLeft,
  liveScheduleText,
  getVideoPoster,
} from "../utils/courseMeta";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const liveOnly = isLiveCourse(course);
  const offline = isOfflineCourse(course);
  const live = isBatchCourse(course); // LIVE or OFFLINE → batch with start date & seats
  const free = isFreeCourse(course);
  const discount = discountPercent(course);
  const seats = seatsLeft(course);
  const offerDays = offerDaysLeft(course);
  const upcoming = isUpcoming(course);
  const schedule = liveScheduleText(course);
  const learners = Number(course.enrolledStudents || course.totalStudents || 0);
  const poster = course.thumbnailUrl || getVideoPoster(course.promoVideoUrl);
  const [imageFailed, setImageFailed] = useState(false);

  const goToDetails = () => navigate(`/course/${course.id}`);

  return (
    <article className="group bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:border-green-300 hover:shadow-xl transition-shadow duration-300">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={goToDetails}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-green-600 to-green-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
        aria-label={`Open ${course.courseTitle}`}
      >
        {poster && !imageFailed ? (
          <img src={poster} alt="" loading="lazy" onError={() => setImageFailed(true)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-start justify-end p-4 text-left">
            <span className="text-green-100 text-xs font-medium">{course.category || "ShikkhaHub"}</span>
            <span className="text-white font-bold text-lg leading-snug line-clamp-2">{course.courseTitle}</span>
          </div>
        )}

        {/* Course type */}
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shadow ${
            offline ? "bg-white text-indigo-700" : liveOnly ? "bg-white text-red-600" : "bg-white text-green-700"
          }`}
        >
          {offline ? (
            <span aria-hidden>📍</span>
          ) : liveOnly ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          ) : (
            <span aria-hidden>▶</span>
          )}
          {offline ? "Offline" : liveOnly ? "Live" : "Recorded"}
        </span>

        {course.level && (
          <span className="absolute top-3 right-3 text-[11px] font-semibold px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
            {course.level}
          </span>
        )}
      </button>

      {/* Learners + start date */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-100 text-xs">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-800">{learners.toLocaleString("en-IN")}</span> learners
        </span>
        {live && course.batchStartDate ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${
              upcoming ? "border-yellow-400 bg-yellow-50 text-yellow-800" : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${upcoming ? "bg-yellow-500" : "bg-gray-400"}`}></span>
            {upcoming ? `Starts ${formatShortDate(course.batchStartDate)}` : `Started ${formatShortDate(course.batchStartDate)}`}
          </span>
        ) : !live ? (
          <span className="text-green-700 font-medium">Learn at your own pace</span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2 mb-3">
          <button type="button" onClick={goToDetails} className="text-left hover:text-green-700 focus:outline-none focus-visible:underline">
            {course.courseTitle}
          </button>
        </h3>

        <div className="flex flex-wrap gap-2 mb-3">
          {live && course.batchNumber ? (
            <span className="text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
              🎓 Batch {course.batchNumber}
            </span>
          ) : null}
          {live && seats !== null ? (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-md border ${
                seats <= 10 ? "text-red-700 bg-red-50 border-red-200" : "text-gray-700 bg-gray-100 border-gray-200"
              }`}
            >
              💺 {seats} seats left
            </span>
          ) : null}
          {!live && course.totalClasses ? (
            <span className="text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
              🎬 {course.totalClasses} lessons
            </span>
          ) : null}
          {course.durationInWeeks ? (
            <span className="text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
              📅 {course.durationInWeeks} weeks
            </span>
          ) : null}
        </div>

        {live && schedule && (
          <p className="text-xs text-gray-600 mb-2 flex items-start gap-1.5">
            <span aria-hidden>🕘</span>
            <span>{schedule}</span>
          </p>
        )}
        {offline && course.venue && (
          <p className="text-xs text-gray-600 mb-3 flex items-start gap-1.5">
            <span aria-hidden>📍</span>
            <span className="line-clamp-1">{course.venue}</span>
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-dashed border-gray-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">{free ? "Free" : formatTaka(course.price)}</span>
              {!free && discount > 0 && (
                <span className="text-sm text-gray-400 line-through">{formatTaka(course.originalPrice)}</span>
              )}
            </div>
            {!free && discount > 0 && (
              <span className="text-xs font-bold text-green-900 bg-yellow-400 px-2 py-1 rounded-md">{discount}% off</span>
            )}
          </div>

          {offerDays && discount > 0 && (
            <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1.5 mb-3">
              ⏳ Offer ends in {offerDays} {offerDays === 1 ? "day" : "days"}
            </p>
          )}

          <button
            onClick={goToDetails}
            className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300 transition-colors"
          >
            View details
          </button>
        </div>
      </div>
    </article>
  );
}
