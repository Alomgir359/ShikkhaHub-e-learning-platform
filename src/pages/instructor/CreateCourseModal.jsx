import React, { useState } from "react";
import { API_BASE, Modal } from "../../components/dashboard/common";

function generateEnrollmentKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "EK-";
  for (let i = 0; i < 8; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

const EMPTY_ELEARNING = {
  courseType: "LIVE", batchNumber: "", batchStartDate: "", classDays: "", classTime: "", supportClassSchedule: "",
  venue: "", totalClasses: "", language: "Bangla", originalPrice: "", promoVideoUrl: "", thumbnailUrl: "",
};

const blankCourse = (teacher, userId) => ({
  courseTitle: "", subTitle: "",
  instructorName: teacher.fullName || "", instructorExperience: teacher.experience || "",
  durationInWeeks: "", totalSeats: "", description: "", level: "Beginner", category: "",
  teacherId: parseInt(userId), teacherEmail: teacher.email || "",
  enrollmentKey: generateEnrollmentKey(), isApproved: 0, isPublished: 0,
  ...EMPTY_ELEARNING,
});

// Same "Create New Course" form as before (Live / Offline batch / Recorded), moved into its own component.
export default function CreateCourseModal({ teacher, userId, onClose, onCreated, showToast }) {
  const [newCourse, setNewCourse] = useState(() => blankCourse(teacher, userId));
  const [weeklyModules, setWeeklyModules] = useState([]);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setNewCourse({ ...newCourse, [e.target.name]: e.target.value });

  const addWeek = () => setWeeklyModules([...weeklyModules, { weekNumber: weeklyModules.length + 1, title: "", topics: [], quiz: "", assignment: "" }]);
  const updateTitle = (i, title) => { const u = [...weeklyModules]; u[i] = { ...u[i], title }; setWeeklyModules(u); };
  const updateTopics = (i, text) => { const u = [...weeklyModules]; u[i] = { ...u[i], topics: text.split(",").map((t) => t.trim()) }; setWeeklyModules(u); };
  const removeWeek = (i) => setWeeklyModules(weeklyModules.filter((_, idx) => idx !== i).map((m, idx) => ({ ...m, weekNumber: idx + 1 })));

  const submit = async (e) => {
    e.preventDefault();
    if (!newCourse.courseTitle || !newCourse.durationInWeeks || !newCourse.totalSeats) { showToast("Please fill all required fields", "error"); return; }
    const isBatch = newCourse.courseType === "LIVE" || newCourse.courseType === "OFFLINE";
    if (isBatch && (!newCourse.batchStartDate || !newCourse.classTime)) {
      showToast(`${newCourse.courseType === "OFFLINE" ? "Offline batches" : "Live courses"} need a batch start date and class time`, "error"); return;
    }
    if (newCourse.courseType === "OFFLINE" && !newCourse.venue?.trim()) { showToast("Offline batches need a venue / class address", "error"); return; }
    setLoading(true);
    const courseData = {
      courseTitle: newCourse.courseTitle, subTitle: newCourse.subTitle,
      instructorName: newCourse.instructorName, instructorExperience: newCourse.instructorExperience,
      durationInWeeks: parseInt(newCourse.durationInWeeks), price: 0, totalSeats: parseInt(newCourse.totalSeats),
      description: newCourse.description, level: newCourse.level, category: newCourse.category,
      teacherId: newCourse.teacherId, teacherEmail: newCourse.teacherEmail, enrollmentKey: newCourse.enrollmentKey,
      weeklyModules, isApproved: 0, isPublished: 0,
      courseType: newCourse.courseType,
      batchNumber: isBatch ? newCourse.batchNumber : "",
      batchStartDate: isBatch ? newCourse.batchStartDate : "",
      classDays: isBatch ? newCourse.classDays : "",
      classTime: isBatch ? newCourse.classTime : "",
      supportClassSchedule: newCourse.courseType === "LIVE" ? newCourse.supportClassSchedule : "",
      venue: newCourse.courseType === "OFFLINE" ? newCourse.venue : "",
      totalClasses: newCourse.totalClasses, originalPrice: newCourse.originalPrice,
      promoVideoUrl: newCourse.promoVideoUrl, thumbnailUrl: newCourse.thumbnailUrl, language: newCourse.language,
    };
    try {
      const res = await fetch(`${API_BASE}/courses/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(courseData) });
      const data = await res.json();
      if (res.ok && data.success) { showToast("Course created successfully! 🎉"); onCreated(); onClose(); }
      else showToast(data.message || "Failed to create course", "error");
    } catch {
      showToast("Network error. Please check if backend server is running.", "error");
    } finally {
      setLoading(false);
    }
  };

  const batchFields =
    newCourse.courseType === "LIVE"
      ? [
          { name: "batchNumber", label: "Batch number", type: "number", placeholder: "e.g. 13" },
          { name: "batchStartDate", label: "Batch start date", type: "date", required: true },
          { name: "classDays", label: "Live class days", placeholder: "e.g. Sat, Wed" },
          { name: "classTime", label: "Live class time", placeholder: "e.g. 9:00 PM - 10:30 PM", required: true },
          { name: "supportClassSchedule", label: "Support class schedule", placeholder: "e.g. Sun, Tue, Thu · 10:30 PM - 11:30 PM", full: true },
        ]
      : newCourse.courseType === "OFFLINE"
      ? [
          { name: "batchNumber", label: "Batch number", type: "number", placeholder: "e.g. 3" },
          { name: "batchStartDate", label: "Batch start date", type: "date", required: true },
          { name: "classDays", label: "Class days", placeholder: "e.g. Fri, Sat" },
          { name: "classTime", label: "Class time", placeholder: "e.g. 10:00 AM - 1:00 PM", required: true },
          { name: "venue", label: "Venue / class address", placeholder: "e.g. House 12, Road 5, Dhanmondi, Dhaka", required: true, full: true },
        ]
      : [];

  const mediaFields = [
    { name: "totalClasses", label: newCourse.courseType !== "RECORDED" ? "Total classes" : "Total video lessons", type: "number", placeholder: "e.g. 36" },
    { name: "language", label: "Language", placeholder: "e.g. Bangla" },
    { name: "originalPrice", label: "Regular price before discount (৳, optional)", type: "number", placeholder: "Admin sets the final price" },
    { name: "promoVideoUrl", label: "Preview / demo class video URL", placeholder: "https://www.youtube.com/watch?v=..." },
    { name: "thumbnailUrl", label: "Thumbnail image URL", placeholder: "https://.../cover.jpg", full: true },
  ];

  const inp = "w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500";

  return (
    <Modal title="Create New Course" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">📋 Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "courseTitle", label: "Course Title", placeholder: "e.g., Java Backend Bootcamp", required: true },
              { name: "subTitle", label: "Sub Title", placeholder: "e.g., Build real-world REST APIs" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                <input type="text" name={f.name} placeholder={f.placeholder} className={inp} value={newCourse[f.name]} onChange={onChange} required={f.required} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
              <input type="text" className={`${inp} bg-gray-100`} value={newCourse.instructorName} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Experience</label>
              <input type="text" className={`${inp} bg-gray-100`} value={newCourse.instructorExperience || ""} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Weeks) <span className="text-red-500">*</span></label>
              <input type="number" name="durationInWeeks" placeholder="e.g., 6" className={inp} value={newCourse.durationInWeeks} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats <span className="text-red-500">*</span></label>
              <input type="number" name="totalSeats" placeholder="e.g., 50" className={inp} value={newCourse.totalSeats} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Level</label>
              <select name="level" className={inp} value={newCourse.level} onChange={onChange}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" className={inp} value={newCourse.category} onChange={onChange}>
                <option value="">Select Category</option>
                {["Islamic Banking", "Risk Management", "Digital Banking", "Leadership", "Compliance", "Programming"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
            <textarea name="description" rows="3" placeholder="Describe what students will learn..." className={inp} value={newCourse.description} onChange={onChange} />
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">🎥 Course format, batch &amp; preview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4" role="radiogroup" aria-label="Course type">
            {[
              { v: "LIVE", t: "🔴 Live course", d: "Online batch with a start date and live classes" },
              { v: "OFFLINE", t: "📍 Offline batch", d: "Upcoming in-person batch at a venue" },
              { v: "RECORDED", t: "▶ Recorded course", d: "Pre-recorded videos, self-paced" },
            ].map((o) => (
              <button type="button" key={o.v} role="radio" aria-checked={newCourse.courseType === o.v} onClick={() => setNewCourse({ ...newCourse, courseType: o.v })}
                className={`text-left p-3 rounded-lg border-2 transition ${newCourse.courseType === o.v ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                <span className="block font-semibold text-gray-800">{o.t}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{o.d}</span>
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {batchFields.concat(mediaFields).map((f) => (
              <div key={f.name} className={f.full ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                <input type={f.type || "text"} name={f.name} placeholder={f.placeholder} className={inp} value={newCourse[f.name] ?? ""} onChange={onChange} required={f.required} />
              </div>
            ))}
          </div>
        </div>

        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">🗓 Weekly modules (optional)</h3>
            <button type="button" onClick={addWeek} className="text-sm text-green-700 font-semibold hover:underline">+ Add week</button>
          </div>
          {weeklyModules.map((m, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg mb-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-green-700">Week {m.weekNumber}</h4>
                <button type="button" onClick={() => removeWeek(idx)} className="text-red-500 text-sm hover:text-red-700">Remove</button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input type="text" placeholder="Week title" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={m.title} onChange={(e) => updateTitle(idx, e.target.value)} />
                <input type="text" placeholder="Topics (comma separated)" className="w-full border border-gray-300 rounded-lg p-2 text-sm" onChange={(e) => updateTopics(idx, e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-800">ℹ️ Your course will be saved as FREE. Admin approval required for publishing.</p></div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold">{loading ? "Creating..." : "Create Course"}</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition font-semibold">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
