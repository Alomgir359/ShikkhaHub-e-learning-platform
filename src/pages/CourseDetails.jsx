

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EnrollmentModal from "../components/EnrollmentModal";
import { API_BASE } from "../utils/courseMeta";
import {
  isLiveCourse,
  isOfflineCourse,
  isBatchCourse,
  isFreeCourse,
  formatTaka,
  discountPercent,
  seatsLeft,
  formatShortDate,
  toDate,
  daysUntil,
  isUpcoming,
  offerDaysLeft,
  getVideoSource,
  getVideoPoster,
  useCountdown,
 
} from "../utils/courseMeta";

// Batch start date + the start time written in classTime ("9:00 PM - 10:30 PM" / "21:00")
const batchStartsAt = (course) => {
  const d = toDate(course?.batchStartDate);
  if (!d) return null;
  const m = (course.classTime || "").match(/(\d{1,2})(?:[:.](\d{2}))?\s*(AM|PM)?/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2] || "0", 10);
    const ap = (m[3] || "").toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    d.setHours(h, min, 0, 0);
  }
  return d.toISOString();
};

const pad2 = (n) => String(n).padStart(2, "0");

// "শনিবার, ৩১ অক্টোবর ২০২৬"
const formatBanglaDate = (value) => {
  const d = toDate(value);
  if (!d) return "";
  try {
    return d.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return formatShortDate(value);
  }
};
const toBanglaDigits = (n) => String(n).replace(/\d/g, (x) => "০১২৩৪৫৬৭৮৯"[x]);

// Big highlighted "class starts" card in the hero
function BatchStartHighlight({ course, offline, countdown }) {
  const days = course.batchStartDate ? daysUntil(course.batchStartDate) : null;
  const started = days !== null && days < 0;
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 text-green-950 shadow-xl ring-2 ring-yellow-200/70">
      <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/25" aria-hidden></span>
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 md:p-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-green-900 text-yellow-300 text-2xl shadow" aria-hidden>🚀</span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-green-900/80">
              {started ? "ক্লাস শুরু হয়েছে" : offline ? "অফলাইন ক্লাস শুরু" : "লাইভ ক্লাস শুরু"}
              {course.batchNumber ? ` · ব্যাচ ${toBanglaDigits(course.batchNumber)}` : ""}
            </p>
            {course.batchStartDate ? (
              <p className="text-xl md:text-md font-extrabold leading-tight">{formatBanglaDate(course.batchStartDate)}</p>
            ) : (
              <p className="text-lg font-extrabold leading-tight">শুরুর তারিখ শীঘ্রই জানানো হবে</p>
            )}
            {(course.classTime || course.classDays) && (
              <p className="text-sm font-semibold text-green-900 mt-0.5">
                🕘 {[course.classDays, course.classTime].filter(Boolean).join(" · ")}
              </p>
            )}
            {offline && course.venue && <p className="text-sm text-green-900 mt-0.5">📍 {course.venue}</p>}
          </div>
        </div>
        {!started && days !== null && (
          <div className="shrink-0 rounded-xl bg-green-900 text-white px-4 py-2.5 text-center">
            {days === 0 ? (
              <p className="text-lg font-extrabold text-yellow-300">আজই শুরু!</p>
            ) : (
              <>
                <p className="text-[11px] text-white/70">আর মাত্র</p>
                <p className="text-lg font-extrabold text-yellow-300 leading-none tabular-nums">{toBanglaDigits(days)} দিন</p>
                {countdown && !countdown.done && (
                  <p className="text-[11px] text-white/70 mt-1 font-mono tabular-nums">
                    {pad2(countdown.hours)}:{pad2(countdown.minutes)}:{pad2(countdown.seconds)}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Course preview video: poster first, the player loads only after a click
function PreviewVideo({ url, poster, title }) {
  const [playing, setPlaying] = useState(false);
  const source = getVideoSource(url);
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageFailed ? null : poster || getVideoPoster(url);

  if (!source) {
    return (
      <div className="relative aspect-video min-h-[190px] w-full rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center text-center p-6">
        {image ? (
          <img src={image} alt="" onError={() => setImageFailed(true)} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-40" />
        ) : null}
        <span className="relative text-4xl mb-2" aria-hidden>🎬</span>
        <p className="relative text-white font-semibold">Preview class coming soon</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <div className="flex items-center gap-2 bg-gray-900 text-white text-sm px-3 py-2">
        <span className="inline-flex items-center justify-center w-6 h-5 rounded bg-red-600 text-[10px]" aria-hidden>▶</span>
        <span className="font-medium">Watch a free demo class</span>
      </div>
      {/* 16:9 via padding-top (works on old mobile browsers that ignore aspect-ratio) */}
      <div className="relative w-full h-0" style={{ paddingTop: "56.25%" }}>
        {playing ? (
          source.kind === "video" ? (
            <video src={source.src} controls autoPlay className="absolute inset-0 w-full h-full" />
          ) : (
            <iframe
              src={source.src}
              title={`${title} – preview`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
            aria-label="Play demo class"
          >
            {image ? (
              <img src={image} alt="" onError={() => setImageFailed(true)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-900"></div>
            )}
            <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></span>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 shadow-2xl group-hover:scale-105 transition-transform">
              <span className="ml-1 w-0 h-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-red-600 md:border-y-[14px] md:border-l-[24px]"></span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploading, setUploading] = useState(false);

  const [courseMaterials, setCourseMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editCourse, setEditCourse] = useState({
    courseTitle: "",
    subTitle: "",
    description: "",
    durationInWeeks: "",
    totalSeats: "",
    level: "",
    category: "",
    schedule: "",
    language: "",
    courseType: "LIVE",
    batchNumber: "",
    batchStartDate: "",
    classDays: "",
    classTime: "",
    supportClassSchedule: "",
    originalPrice: "",
    offerEndsAt: "",
    promoVideoUrl: "",
    thumbnailUrl: "",
    totalClasses: "",
    venue: "",
    motivationalText: ""
  });

  const [content, setContent] = useState({
    contentType: "PDF",
    title: "",
    description: "",
    pdfFile: null,
    videoUrl: "",
    assignmentDetails: "",
    dueDate: ""
  });

  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [editMaterialData, setEditMaterialData] = useState({
    title: "",
    description: "",
    assignmentDetails: "",
    dueDate: "",
    videoUrl: ""
  });

  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [audience, setAudience] = useState([]);
  const [modules, setModules] = useState([]);
  const [whatsIncluded, setWhatsIncluded] = useState([]);

  // ── Modal visibility ──────────────────────────────────────────────────────
  // bKash / Nagad enrollment (instructions → form → done)
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [sectionType, setSectionType] = useState("");

  const [publishRequestLoading, setPublishRequestLoading] = useState(false);
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);

  const [moduleForm, setModuleForm] = useState({
    weekNumber: "",
    title: "",
    duration: "",
    details: ""
  });
  const [editingModuleIndex, setEditingModuleIndex] = useState(null);

  const [newItem, setNewItem] = useState("");

  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  const isLoggedIn = !!userId;
  const teacherId = localStorage.getItem("userId");
  const teacherName = localStorage.getItem("userName");

  const [isEnrolled, setIsEnrolled] = useState(false);

  // PENDING (payment under review) / REJECTED / ACTIVE / null — for the logged-in student
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [enrollmentNote, setEnrollmentNote] = useState(null);

  // Re-render when the Navbar logs someone in / out
  const [, setAuthTick] = useState(0);
  useEffect(() => {
    const onAuth = () => setAuthTick((t) => t + 1);
    window.addEventListener("shikkhahub:auth-changed", onAuth);
    return () => window.removeEventListener("shikkhahub:auth-changed", onAuth);
  }, []);

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    const filename = filePath.split("/").pop();
    return `${API_BASE}/files/view/${filename}`;
  };

  // ── Fetch course ──────────────────────────────────────────────────────────
  const fetchCourse = async () => {
    setLoading(true);
    try {
      const url =
        userRole === "TEACHER"
          ? `${API_BASE}/courses/${id}`
          : `${API_BASE}/courses/published/${id}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);

        setEditCourse({
          courseTitle: data.courseTitle || "",
          subTitle: data.subTitle || "",
          description: data.description || "",
          durationInWeeks: data.durationInWeeks || "",
          totalSeats: data.totalSeats || "",
          level: data.level || "Beginner",
          category: data.category || "",
          schedule: data.schedule || "Sun & Tue - 8 PM",
          language: data.language || "Bengali",
          courseType: (data.courseType || "LIVE").toUpperCase(),
          batchNumber: data.batchNumber ?? "",
          batchStartDate: data.batchStartDate || "",
          classDays: data.classDays || "",
          classTime: data.classTime || "",
          supportClassSchedule: data.supportClassSchedule || "",
          originalPrice: data.originalPrice ?? "",
          offerEndsAt: data.offerEndsAt ? String(data.offerEndsAt).slice(0, 16) : "",
          promoVideoUrl: data.promoVideoUrl || "",
          thumbnailUrl: data.thumbnailUrl || "",
          totalClasses: data.totalClasses ?? "",
          venue: data.venue || "",
          motivationalText: data.motivationalText || ""
        });

        const parseField = (field) => {
          if (!field) return [];
          try { return JSON.parse(field); }
          catch { return field.split(","); }
        };

        setLearningOutcomes(parseField(data.learningOutcomes));
        setRequirements(parseField(data.requirements));
        setAudience(parseField(data.audience));
        setWhatsIncluded(parseField(data.whatsIncluded));

        if (data.weeklyModules) {
          try { setModules(JSON.parse(data.weeklyModules)); }
          catch { setModules([]); }
        } else {
          setModules([]);
        }
      } else {
        setError("Course not found");
      }
    } catch (err) {
      console.error("Error fetching course:", err);
      setError("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseMaterials = async () => {
    if (!isLoggedIn) return;
    try {
      const response = await fetch(`${API_BASE}/materials/course/${id}`);
      if (response.ok) {
        const materials = await response.json();
        setCourseMaterials(materials);
        setAssignments(materials.filter((m) => m.type === "ASSIGNMENT"));
      }
    } catch (err) {
      console.error("Error fetching course materials:", err);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (isLoggedIn && userRole === "STUDENT") {
      try {
        const response = await fetch(`${API_BASE}/enrollments/check/${userId}/${id}`);
        if (response.ok) {
          const data = await response.json();
          setIsEnrolled(!!data.enrolled);
          setEnrollmentStatus(data.status || null);
          setEnrollmentNote(data.adminNote || null);
        }
      } catch (err) {
        console.error("Error checking enrollment:", err);
      }
    }
  };

  useEffect(() => {
    fetchCourse();
    if (isLoggedIn) {
      fetchCourseMaterials();
      checkEnrollmentStatus();
    }
  }, [id, userId, isLoggedIn]);

  // ── Publish request ───────────────────────────────────────────────────────
  const handleSendPublishRequest = async () => {
    setPublishRequestLoading(true);
    try {
      const response = await fetch(`${API_BASE}/courses/${id}/send-publish-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("✅ Publish request sent successfully! Admin will review and publish your course soon.");
        setShowPublishConfirmModal(false);
        fetchCourse();
      } else {
        alert(data.message || "Failed to send publish request");
      }
    } catch (err) {
      console.error("Publish request error:", err);
      alert("Network error. Please try again.");
    } finally {
      setPublishRequestLoading(false);
    }
  };

  const toggleModule = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // ── Module CRUD ───────────────────────────────────────────────────────────
  const openAddModuleModal = () => {
    setModuleForm({ weekNumber: modules.length + 1, title: "", duration: "2 hours", details: "" });
    setEditingModuleIndex(null);
    setShowModuleModal(true);
  };

  const openEditModuleModal = (index) => {
    const module = modules[index];
    setModuleForm({
      weekNumber: module.week || module.weekNumber || index + 1,
      title: module.title || "",
      duration: module.duration || "2 hours",
      details: module.details ? module.details.join(", ") : ""
    });
    setEditingModuleIndex(index);
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleForm.title) { alert("Please enter module title"); return; }

    const newModule = {
      week: moduleForm.weekNumber,
      weekNumber: moduleForm.weekNumber,
      title: moduleForm.title,
      duration: moduleForm.duration,
      details: moduleForm.details.split(",").map((d) => d.trim()).filter((d) => d)
    };

    let updatedModules;
    if (editingModuleIndex !== null) {
      updatedModules = [...modules];
      updatedModules[editingModuleIndex] = newModule;
    } else {
      updatedModules = [...modules, newModule];
    }
    updatedModules.forEach((mod, idx) => { mod.week = idx + 1; mod.weekNumber = idx + 1; });

    try {
      const response = await fetch(`${API_BASE}/courses/${id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyModules: JSON.stringify(updatedModules) })
      });
      if (response.ok) {
        setModules(updatedModules);
        setShowModuleModal(false);
        alert(editingModuleIndex !== null ? "Module updated successfully!" : "Module added successfully!");
        fetchCourse();
      } else {
        alert("Failed to save module");
      }
    } catch (err) {
      console.error("Save module error:", err);
      alert("Network error");
    }
  };

  const deleteModule = async (index) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    const updatedModules = modules.filter((_, i) => i !== index);
    updatedModules.forEach((mod, idx) => { mod.week = idx + 1; mod.weekNumber = idx + 1; });

    try {
      const response = await fetch(`${API_BASE}/courses/${id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyModules: JSON.stringify(updatedModules) })
      });
      if (response.ok) {
        setModules(updatedModules);
        alert("Module deleted successfully!");
        fetchCourse();
      } else {
        alert("Failed to delete module");
      }
    } catch (err) {
      console.error("Delete module error:", err);
      alert("Network error");
    }
  };

  // ── Material upload ───────────────────────────────────────────────────────
  const handleUploadContent = async () => {
    if (!content.title) { alert("Please enter a title"); return; }
    setUploading(true);

    try {
      let response;

      if (content.contentType === "PDF") {
        if (!content.pdfFile) { alert("Please select a PDF file"); setUploading(false); return; }
        const formData = new FormData();
        formData.append("file", content.pdfFile);
        formData.append("courseId", id.toString());
        formData.append("courseTitle", course.courseTitle);
        formData.append("teacherId", teacherId.toString());
        formData.append("teacherName", teacherName);
        formData.append("title", content.title);
        formData.append("description", content.description || "");
        response = await fetch(`${API_BASE}/materials/upload/pdf`, { method: "POST", body: formData });
      } else if (content.contentType === "VIDEO") {
        if (!content.videoUrl) { alert("Please enter a video URL"); setUploading(false); return; }
        response = await fetch(`${API_BASE}/materials/upload/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: id.toString(), courseTitle: course.courseTitle,
            teacherId: teacherId.toString(), teacherName,
            title: content.title, description: content.description || "",
            videoUrl: content.videoUrl
          })
        });
      } else if (content.contentType === "ASSIGNMENT") {
        if (!content.assignmentDetails) { alert("Please enter assignment details"); setUploading(false); return; }
        response = await fetch(`${API_BASE}/materials/upload/assignment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: id.toString(), courseTitle: course.courseTitle,
            teacherId: teacherId.toString(), teacherName,
            title: content.title, description: content.description || "",
            assignmentDetails: content.assignmentDetails, dueDate: content.dueDate || null
          })
        });
      }

      const data = await response.json();
      if (response.ok && data.success) {
        alert(`${content.contentType} uploaded successfully!`);
        setContent({ contentType: "PDF", title: "", description: "", pdfFile: null, videoUrl: "", assignmentDetails: "", dueDate: "" });
        await fetchCourseMaterials();
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const openEditMaterialModal = (material) => {
    setEditingMaterial(material);
    setEditMaterialData({
      title: material.title,
      description: material.description || "",
      assignmentDetails: material.assignmentDetails || "",
      dueDate: material.dueDate ? material.dueDate.slice(0, 16) : "",
      videoUrl: material.videoUrl || ""
    });
    setShowEditMaterialModal(true);
  };

  const handleEditMaterialSubmit = async () => {
    if (!editMaterialData.title) { alert("Please enter a title"); return; }
    setUploading(true);

    try {
      const updateData = { title: editMaterialData.title, description: editMaterialData.description };

      if (editingMaterial.type === "ASSIGNMENT") {
        if (!editMaterialData.assignmentDetails) { alert("Please enter assignment details"); setUploading(false); return; }
        updateData.assignmentDetails = editMaterialData.assignmentDetails;
        updateData.dueDate = editMaterialData.dueDate || null;
      } else if (editingMaterial.type === "VIDEO") {
        if (!editMaterialData.videoUrl) { alert("Please enter video URL"); setUploading(false); return; }
        updateData.videoUrl = editMaterialData.videoUrl;
      }

      const response = await fetch(`${API_BASE}/materials/update/${editingMaterial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        alert(`${editingMaterial.type} updated successfully!`);
        setShowEditMaterialModal(false);
        setEditingMaterial(null);
        await fetchCourseMaterials();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      const response = await fetch(`${API_BASE}/materials/${materialId}`, { method: "DELETE" });
      if (response.ok) {
        alert("Material deleted successfully!");
        await fetchCourseMaterials();
      } else {
        alert("Failed to delete material");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error");
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  ENROLLMENT FLOW (manual bKash / Nagad "Send Money")
  //  Enroll now → payment instructions → form (name, mobile, email, TrxID)
  //  → "Enrollment complete" → admin verifies → student can log in / course activates
  // ══════════════════════════════════════════════════════════════════════════
  const handleEnrollClick = () => {
    if (isLoggedIn && userRole !== "STUDENT") {
      alert("Please log in with a student account to enroll in this course.");
      return;
    }
    if (isEnrolled) {
      navigate("/student-dashboard");
      return;
    }
    if (enrollmentStatus === "PENDING") return; // already submitted, waiting for the admin
    setShowEnrollModal(true);
  };

  // ── Course save ───────────────────────────────────────────────────────────
  const handleSaveCourse = async () => {
    try {
      const updatedData = {
        ...editCourse,
        learningOutcomes: JSON.stringify(learningOutcomes),
        requirements: JSON.stringify(requirements),
        audience: JSON.stringify(audience),
        whatsIncluded: JSON.stringify(whatsIncluded),
        durationInWeeks: parseInt(editCourse.durationInWeeks),
        totalSeats: parseInt(editCourse.totalSeats)
      };

      const response = await fetch(`${API_BASE}/courses/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        alert("Course updated successfully!");
        setIsEditing(false);
        fetchCourse();
      } else {
        alert("Failed to update course");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Network error");
    }
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    switch (sectionType) {
      case "outcome": setLearningOutcomes([...learningOutcomes, newItem]); break;
      case "requirement": setRequirements([...requirements, newItem]); break;
      case "audience": setAudience([...audience, newItem]); break;
      case "included": setWhatsIncluded([...whatsIncluded, newItem]); break;
      default: break;
    }
    setNewItem("");
    setShowAddSectionModal(false);
  };

  const handleRemoveItem = (type, index) => {
    if (type === "outcome") setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
    else if (type === "requirement") setRequirements(requirements.filter((_, i) => i !== index));
    else if (type === "audience") setAudience(audience.filter((_, i) => i !== index));
    else if (type === "included") setWhatsIncluded(whatsIncluded.filter((_, i) => i !== index));
  };

  const isCourseApproved = course?.isApproved === 1;

  const getAvailableTabs = () => {
    const tabs = ["overview", "curriculum"];
    if (isLoggedIn) tabs.push("materials", "assignments");
    return tabs;
  };

  useEffect(() => {
    const availableTabs = getAvailableTabs();
    if (!availableTabs.includes(activeTab)) setActiveTab("overview");
  }, [isLoggedIn]);

  // Countdown to the first live class (hooks must run before the early returns below)
  const batchCountdown = useCountdown(course && isBatchCourse(course) ? batchStartsAt(course) : null);

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <p className="text-red-600 text-xl">{error || "Course not found"}</p>
            <Link to="/courses" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg">
              Back to Courses
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const availableTabs = getAvailableTabs();

  // ── Derived e-learning values for the hero ────────────────────────────────
  const liveOnly = isLiveCourse(course);
  const offline = isOfflineCourse(course);
  const live = isBatchCourse(course); // LIVE or OFFLINE → batch with start date, class time & seats
  const free = isFreeCourse(course);
  const discount = discountPercent(course);
  const seats = seatsLeft(course);
  const upcoming = isUpcoming(course);
  const offerDays = offerDaysLeft(course);
  const canEnroll = !(live && seats === 0);
  const pendingReview = !isEnrolled && enrollmentStatus === "PENDING";
  const enrollLabel = isEnrolled
    ? "Go to dashboard"
    : pendingReview
      ? "⏳ পেমেন্ট যাচাই চলছে"
      : free
      ? "Enroll for free"
      : live && course.batchNumber
        ? `Enroll in batch ${course.batchNumber}`
        : "Enroll now";

  const heroFacts = live
    ? [
        { icon: "📅", label: "Duration", value: course.durationInWeeks ? `${course.durationInWeeks} weeks` : null },
        { icon: offline ? "🏫" : "🎥", label: offline ? "Class time" : "Live classes", value: course.classTime || course.schedule, sub: course.classDays },
        offline
          ? { icon: "📍", label: "Venue", value: course.venue }
          : { icon: "🛟", label: "Support class", value: course.supportClassSchedule },
        { icon: "💺", label: "Seats left", value: seats !== null ? `${seats} seats` : null },
      ]
    : [
        { icon: "🎬", label: "Lessons", value: course.totalClasses ? `${course.totalClasses} videos` : null },
        { icon: "📅", label: "Duration", value: course.durationInWeeks ? `${course.durationInWeeks} weeks` : null },
        { icon: "📶", label: "Level", value: course.level },
        { icon: "🌐", label: "Language", value: course.language || editCourse.language },
      ];

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      {/* BREADCRUMB */}
      <div className="bg-gray-100 py-3 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-green-600">Home</Link>
            <span className="text-gray-400">›</span>
            <Link to="/courses" className="text-gray-600 hover:text-green-600">Courses</Link>
            <span className="text-gray-400">›</span>
            <span className="text-green-600 font-semibold">{course.courseTitle}</span>

            {userRole === "TEACHER" && isCourseApproved && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="ml-4 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600">
                ✏️ Edit Mode
              </button>
            )}

            {userRole === "TEACHER" && !isCourseApproved && (
              <span className="ml-4 bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs">
                ⏳ Pending Approval (Edit disabled)
              </span>
            )}

            {isEditing && (
              <div className="ml-4 flex gap-2">
                <button onClick={handleSaveCourse} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700">
                  💾 Save All
                </button>
                <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white px-4 md:px-10 py-6 md:py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left: course info */}
          <div className="lg:col-span-7 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {live && course.batchNumber ? (
                <span className="inline-flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-300/60 text-yellow-200 px-3 py-1 rounded-md text-sm font-semibold">
                  🎓 Batch {course.batchNumber}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-md text-sm">
                {offline ? (
                  <span aria-hidden>📍</span>
                ) : liveOnly ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                ) : <span aria-hidden>▶</span>}
                {offline ? "Offline batch" : liveOnly ? "Live course" : "Recorded course"}
              </span>
              <span className="inline-flex items-center gap-1 text-sm">
                <span className="text-yellow-300" aria-hidden>★</span>
                <span className="font-semibold">{course.rating || 4.8}</span>
                <span className="text-white/70">({course.totalRatings || 0} reviews)</span>
              </span>
              {userRole === "TEACHER" && (
                isCourseApproved ? (
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">✅ Approved</span>
                ) : (
                  <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">⏳ Pending</span>
                )
              )}
            </div>

            {isEditing ? (
              <>
                <input type="text" value={editCourse.courseTitle} aria-label="Course title"
                  onChange={(e) => setEditCourse({ ...editCourse, courseTitle: e.target.value })}
                  className="text-3xl md:text-4xl font-bold mb-2 bg-transparent border-b-2 border-white/50 text-white placeholder-white/50 w-full focus:outline-none"
                />
                <input type="text" value={editCourse.subTitle} aria-label="Course subtitle"
                  onChange={(e) => setEditCourse({ ...editCourse, subTitle: e.target.value })}
                  className="text-lg text-white/90 mb-4 bg-transparent border-b border-white/30 w-full focus:outline-none"
                  placeholder="Course subtitle"
                />
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight mb-3 break-words">{course.courseTitle}</h1>
                {course.subTitle && <p className="text-lg md:text-xl text-white/90 mb-4">{course.subTitle}</p>}
              </>
            )}

            {/* Mobile / tablet: demo video right under the title (desktop shows it in the right card) */}
            <div className="lg:hidden mb-5 rounded-2xl bg-white p-2 shadow-2xl">
              <PreviewVideo url={course.promoVideoUrl} poster={course.thumbnailUrl} title={course.courseTitle} />
            </div>

            {course.description && (
              <p className="text-white/80 leading-relaxed mb-6 max-w-2xl line-clamp-4 whitespace-pre-line">{course.description}</p>
            )}

            {/* CTA + price */}
            <div className="hidden lg:flex flex-wrap items-center gap-x-5 gap-y-3 mb-8">
              {userRole !== "TEACHER" && (
                <button onClick={handleEnrollClick} disabled={(!canEnroll && !isEnrolled) || pendingReview}
                  className="inline-flex items-center gap-2 bg-yellow-400 text-green-950 font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-yellow-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {enrollLabel} <span aria-hidden>›</span>
                </button>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{free ? "Free" : formatTaka(course.price)}</span>
                {!free && discount > 0 && <span className="text-white/60 line-through">{formatTaka(course.originalPrice)}</span>}
              </div>
              {!free && discount > 0 && (
                <span className="text-sm font-bold bg-yellow-400 text-green-950 px-2 py-1 rounded-md">{discount}% off</span>
              )}
            </div>

            {/* Class start — highlighted */}
            {live && <BatchStartHighlight course={course} offline={offline} countdown={batchCountdown} />}

            {/* Key facts strip */}
            <dl className="grid grid-cols-2 md:grid-cols-4 text-sm sm:text-base rounded-xl border border-white/25 bg-white/5 divide-white/15 md:divide-x overflow-hidden">
              {heroFacts.map((f, idx) => (
                <div key={f.label} className={`p-3 sm:p-4 min-w-0 break-words ${idx % 2 === 1 ? "border-l border-white/15 md:border-l-0" : ""} ${idx > 1 ? "border-t border-white/15 md:border-t-0" : ""}`}>
                  <dt className="flex items-center gap-1.5 text-sm text-white/75 mb-1.5">
                    <span aria-hidden>{f.icon}</span>{f.label}
                  </dt>
                  <dd className={`font-semibold leading-snug ${f.chip ? "inline-block bg-white/15 px-2 py-1 rounded-md" : ""}`}>
                    {f.value || <span className="text-white/50 font-normal">To be announced</span>}
                  </dd>
                  {f.sub && <dd className="text-xs text-white/70 mt-1">{f.sub}</dd>}
                </div>
              ))}
            </dl>

            {/* Motivational text (Bangla) — written by the instructor in edit mode */}
            {isEditing ? (
              <div className="mt-5">
                <label htmlFor="motivationalText" className="block text-sm font-semibold text-yellow-200 mb-1.5">
                  ✨ কোর্স সম্পর্কে অনুপ্রেরণামূলক কথা (বাংলায়)
                </label>
                <textarea id="motivationalText" rows={4} value={editCourse.motivationalText}
                  onChange={(e) => setEditCourse({ ...editCourse, motivationalText: e.target.value })}
                  placeholder="যেমন: প্রোগ্রামিং মানে শুধু কোড লেখা নয়, সমস্যাকে গভীরভাবে বোঝা। এই কোর্স শেষে আপনি যেকোনো ভাষায় আত্মবিশ্বাসের সাথে কোড করতে পারবেন…"
                  className="w-full rounded-xl bg-white/10 border border-white/30 p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300 leading-relaxed" />
                <p className="text-xs text-white/60 mt-1">এই লেখাটি কোর্স পেজে শুরুর সময়ের নিচে দেখাবে। "Save All" চাপলে সেভ হবে।</p>
              </div>
            ) : course.motivationalText ? (
              <figure className="mt-5 relative rounded-2xl bg-white/10 border border-white/20 border-l-4 border-l-yellow-400 p-4 md:p-5">
                <span className="absolute -top-3 left-4 bg-yellow-400 text-green-950 text-xs font-bold px-2 py-0.5 rounded-md">✨ কেন এই কোর্স?</span>
                <blockquote className="text-white/95 text-base md:text-sm leading-relaxed whitespace-pre-line">
                  {course.motivationalText}
                </blockquote>
              </figure>
            ) : null}
          </div>

          {/* Right: preview video + purchase card */}
          <aside className="lg:col-span-5 min-w-0">
            <div className="bg-white text-gray-800 rounded-2xl p-3 shadow-2xl">
              <div className="hidden lg:block">
                <PreviewVideo url={course.promoVideoUrl} poster={course.thumbnailUrl} title={course.courseTitle} />
              </div>

              <div className="px-2 pt-2 lg:pt-4 pb-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{free ? "Free" : formatTaka(course.price)}</span>
                    {!free && discount > 0 && <span className="text-red-400 line-through">{formatTaka(course.originalPrice)}</span>}
                  </div>
                  {!free && discount > 0 && (
                    <span className="text-sm font-semibold text-green-800 bg-green-50 border border-green-200 px-2 py-1 rounded-md">Save {discount}%</span>
                  )}
                </div>

                {offerDays && discount > 0 && (
                  <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    ⏳ Discount ends in {offerDays} {offerDays === 1 ? "day" : "days"}
                  </p>
                )}

                {userRole === "STUDENT" && isEnrolled ? (
                  <button onClick={() => navigate("/student-dashboard")}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                    ✅ Enrolled · Go to dashboard
                  </button>
                ) : userRole !== "TEACHER" ? (
                  <button onClick={handleEnrollClick} disabled={!canEnroll || pendingReview}
                    className="w-full inline-flex items-center justify-center gap-2 bg-yellow-400 text-green-950 py-3 rounded-xl font-bold hover:bg-yellow-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {enrollLabel} <span aria-hidden>›</span>
                  </button>
                ) : null}

                {pendingReview && (
                  <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                    ⏳ আপনার এনরোলমেন্ট জমা হয়েছে। অ্যাডমিন পেমেন্ট যাচাই করে অ্যাপ্রুভ করলেই কোর্সটি চালু হবে।
                  </p>
                )}
                {!isEnrolled && enrollmentStatus === "REJECTED" && (
                  <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">
                    ❌ আগের পেমেন্টটি অ্যাপ্রুভ হয়নি{enrollmentNote ? `: ${enrollmentNote}` : "।"} সঠিক Transaction ID দিয়ে আবার এনরোল করুন।
                  </p>
                )}
                {live && batchCountdown && !batchCountdown.done && (
                  <p className="flex flex-wrap items-center justify-center gap-2 text-sm text-red-600">
                    <span aria-hidden>⏱</span> Batch starts in
                    <span className="font-mono bg-red-50 border border-red-100 px-2 py-0.5 rounded tabular-nums">
                      {batchCountdown.days}d {pad2(batchCountdown.hours)}h {pad2(batchCountdown.minutes)}m {pad2(batchCountdown.seconds)}s
                    </span>
                  </p>
                )}
                {live && course.batchStartDate && !upcoming && (
                  <p className="text-center text-sm text-gray-500">This batch started on {formatShortDate(course.batchStartDate)}.</p>
                )}
                {live && seats === 0 && (
                  <p className="text-center text-sm text-red-600 font-medium">All seats for this batch are taken.</p>
                )}

                {/* Teacher: publish workflow */}
                {userRole === "TEACHER" && course?.isApproved === 1 && course?.isPublished !== 1 && course?.isPublished !== 0 && (
                  <button onClick={() => setShowPublishConfirmModal(true)} disabled={publishRequestLoading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition shadow-md flex items-center justify-center gap-2">
                    {publishRequestLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <><span>📢</span> Send Request for Publish</>
                    )}
                  </button>
                )}
                {userRole === "TEACHER" && course?.isPublished === 1 && (
                  <div className="text-center py-3 bg-green-100 text-green-700 rounded-xl">✅ Course is Published and Live!</div>
                )}
                {userRole === "TEACHER" && course?.isApproved === 0 && (
                  <div className="text-center py-3 bg-yellow-100 text-yellow-700 rounded-xl">⏳ Course pending admin approval.</div>
                )}
                {userRole === "TEACHER" && course?.isApproved === 1 && course?.isPublished === 0 && (
                  <div className="text-center py-3 bg-blue-100 text-blue-700 rounded-xl">📤 Publish request sent! Waiting for admin.</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="flex flex-wrap border-b">
                {availableTabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 font-semibold transition ${activeTab === tab ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {tab === "overview" && "📖 Course Overview"}
                    {tab === "curriculum" && "📚 Curriculum"}
                    {tab === "materials" && "📄 Course Materials"}
                    {tab === "assignments" && "📝 Assignments"}
                  </button>
                ))}
              </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {isEditing && (
                  <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-green-300">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Batch, schedule & media</h2>
                    <p className="text-sm text-gray-500 mb-5">Shown on the course card and at the top of this page. Click "Save All" when you're done.</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">Course type</span>
                        <select value={editCourse.courseType} onChange={(e) => setEditCourse({ ...editCourse, courseType: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500">
                          <option value="LIVE">Live course (online batch)</option>
                          <option value="OFFLINE">Offline batch (in-person)</option>
                          <option value="RECORDED">Recorded course (self-paced)</option>
                        </select>
                      </label>
                      {[
                        { key: "promoVideoUrl", label: "Preview / demo video URL", placeholder: "https://www.youtube.com/watch?v=...", full: false },
                        { key: "thumbnailUrl", label: "Thumbnail image URL", placeholder: "https://.../cover.jpg" },
                        { key: "totalClasses", label: editCourse.courseType !== "RECORDED" ? "Total classes" : "Total video lessons", type: "number", placeholder: "e.g. 36" },
                        { key: "originalPrice", label: "Regular price (before discount, ৳)", type: "number", placeholder: "e.g. 8800" },
                        { key: "offerEndsAt", label: "Discount ends at", type: "datetime-local" },
                        ...(editCourse.courseType === "OFFLINE" ? [
                          { key: "venue", label: "Venue / class address", placeholder: "e.g. House 12, Road 5, Dhanmondi, Dhaka" },
                        ] : []),
                        ...(editCourse.courseType !== "RECORDED" ? [
                          { key: "batchNumber", label: "Batch number", type: "number", placeholder: "e.g. 13" },
                          { key: "batchStartDate", label: "Batch start date", type: "date" },
                          { key: "classDays", label: "Class days", placeholder: "e.g. Sat, Wed" },
                          { key: "classTime", label: "Class time", placeholder: "e.g. 9:00 PM - 10:30 PM" },
                          { key: "supportClassSchedule", label: "Support class schedule", placeholder: "e.g. Sun, Tue, Thu · 10:30 PM - 11:30 PM" },
                        ] : []),
                      ].map((f) => (
                        <label key={f.key} className="block">
                          <span className="block text-sm font-medium text-gray-700 mb-1">{f.label}</span>
                          <input type={f.type || "text"} value={editCourse[f.key] ?? ""} placeholder={f.placeholder}
                            onChange={(e) => setEditCourse({ ...editCourse, [f.key]: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500" />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span className="text-2xl">🎯</span> What You'll Learn</h2>
                    {isEditing && (
                      <button onClick={() => { setSectionType("outcome"); setShowAddSectionModal(true); }} className="text-green-600 text-sm hover:underline">+ Add</button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {learningOutcomes.map((outcome, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <span className="text-green-600 text-xl">✓</span>
                        {isEditing ? (
                          <input type="text" value={outcome}
                            onChange={(e) => { const u = [...learningOutcomes]; u[i] = e.target.value; setLearningOutcomes(u); }}
                            className="flex-1 text-gray-700 border-b border-gray-300 focus:border-green-500 outline-none"
                          />
                        ) : (
                          <span className="text-gray-700">{outcome}</span>
                        )}
                        {isEditing && (
                          <button onClick={() => handleRemoveItem("outcome", i)} className="text-red-500 opacity-0 group-hover:opacity-100 text-sm">✖</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Course Description</h2>
                  {isEditing ? (
                    <textarea value={editCourse.description}
                      onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" rows="4"
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{course.description}</p>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Course Features</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: "📅", val: `${course.durationInWeeks} Weeks`, label: "Duration" },
                      { icon: "📚", val: `${modules.length} Modules`, label: "Total" },
                      { icon: "🕒", val: editCourse.schedule, label: "Schedule" },
                      { icon: "📜", val: "Certificate", label: "Upon completion" }
                    ].map((f, i) => (
                      <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-1">{f.icon}</div>
                        <div className="font-semibold">{f.val}</div>
                        <div className="text-xs text-gray-500">{f.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Who this course is for</h2>
                    {isEditing && (
                      <button onClick={() => { setSectionType("audience"); setShowAddSectionModal(true); }} className="text-green-600 text-sm hover:underline">+ Add</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {audience.map((item, i) => (
                      <div key={i} className="group relative">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">{item}</span>
                        {isEditing && (
                          <button onClick={() => handleRemoveItem("audience", i)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">✖</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Requirements</h2>
                    {isEditing && (
                      <button onClick={() => { setSectionType("requirement"); setShowAddSectionModal(true); }} className="text-green-600 text-sm hover:underline">+ Add</button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <span className="text-green-600">✔</span>
                        {isEditing ? (
                          <input type="text" value={req}
                            onChange={(e) => { const u = [...requirements]; u[i] = e.target.value; setRequirements(u); }}
                            className="flex-1 text-gray-700 border-b border-gray-300 focus:border-green-500 outline-none"
                          />
                        ) : (
                          <span className="text-gray-700">{req}</span>
                        )}
                        {isEditing && (
                          <button onClick={() => handleRemoveItem("requirement", i)} className="text-red-500 opacity-0 group-hover:opacity-100 text-sm">✖</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CURRICULUM TAB */}
            {activeTab === "curriculum" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Course Curriculum</h2>
                    <p className="text-sm text-gray-500 mt-1">{modules.length} modules</p>
                  </div>
                  {userRole === "TEACHER" && isCourseApproved && (
                    <button onClick={openAddModuleModal} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2">
                      <span className="text-lg">+</span> Add New Module
                    </button>
                  )}
                </div>
                <div className="divide-y">
                  {modules.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <p className="mb-4">No modules added yet.</p>
                      {userRole === "TEACHER" && isCourseApproved && (
                        <button onClick={openAddModuleModal} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                          Create Your First Module
                        </button>
                      )}
                    </div>
                  ) : (
                    modules.map((module, index) => (
                      <div key={index} className="overflow-hidden">
                        <div className={`flex justify-between items-center p-5 cursor-pointer transition ${activeIndex === index ? "bg-green-50" : "hover:bg-gray-50"}`}>
                          <div className="flex-1" onClick={() => toggleModule(index)}>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm font-semibold text-green-600">Week {module.week || module.weekNumber || index + 1}</span>
                              <span className="text-xs text-gray-500">{module.duration || "2 hours"}</span>
                            </div>
                            <h3 className="font-semibold text-lg mt-1">{module.title}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            {userRole === "TEACHER" && isCourseApproved && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); openEditModuleModal(index); }} className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded hover:bg-blue-50">✏️ Edit</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteModule(index); }} className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50">🗑️ Delete</button>
                              </>
                            )}
                            <div className="text-2xl text-gray-400" onClick={() => toggleModule(index)}>
                              {activeIndex === index ? "−" : "+"}
                            </div>
                          </div>
                        </div>
                        <div className={`transition-all duration-300 ${activeIndex === index ? "block" : "hidden"}`}>
                          <div className="p-5 bg-gray-50">
                            <ul className="space-y-3">
                              {module.details?.map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-700">
                                  <span className="text-green-600">▶</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* MATERIALS TAB */}
            {activeTab === "materials" && isLoggedIn && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><span>📄</span> Course Materials</h2>

                {userRole === "TEACHER" && isCourseApproved && isEditing && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-green-700 mb-4">Upload New Material</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {["PDF", "VIDEO", "ASSIGNMENT"].map((type) => (
                        <button key={type} onClick={() => setContent({ ...content, contentType: type })}
                          className={`py-2 rounded-lg font-semibold transition ${content.contentType === type ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 border"}`}
                        >
                          {type === "PDF" && "📄 PDF"}
                          {type === "VIDEO" && "🎥 Video"}
                          {type === "ASSIGNMENT" && "📝 Assignment"}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={content.title}
                          onChange={(e) => setContent({ ...content, title: e.target.value })} placeholder="Enter title" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea className="w-full border border-gray-300 rounded-lg p-2" rows="2" value={content.description}
                          onChange={(e) => setContent({ ...content, description: e.target.value })} placeholder="Enter description" />
                      </div>
                      {content.contentType === "PDF" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
                          <input type="file" accept=".pdf" onChange={(e) => setContent({ ...content, pdfFile: e.target.files[0] })} className="w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                      )}
                      {content.contentType === "VIDEO" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={content.videoUrl}
                            onChange={(e) => setContent({ ...content, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                      )}
                      {content.contentType === "ASSIGNMENT" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Details *</label>
                            <textarea className="w-full border border-gray-300 rounded-lg p-2" rows="3" value={content.assignmentDetails}
                              onChange={(e) => setContent({ ...content, assignmentDetails: e.target.value })} placeholder="Describe the assignment..." />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input type="datetime-local" className="w-full border border-gray-300 rounded-lg p-2" value={content.dueDate}
                              onChange={(e) => setContent({ ...content, dueDate: e.target.value })} />
                          </div>
                        </>
                      )}
                      <button onClick={handleUploadContent} disabled={uploading}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50">
                        {uploading ? "Uploading..." : `Upload ${content.contentType}`}
                      </button>
                    </div>
                  </div>
                )}

                {courseMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-3">📂</div>
                    <p>No materials have been uploaded for this course yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {courseMaterials.filter((m) => m.type === "PDF").length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><span className="text-red-500">📄</span> PDF Documents</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {courseMaterials.filter((m) => m.type === "PDF").map((material) => (
                            <div key={material.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-800">{material.title}</p>
                                  {material.description && <p className="text-xs text-gray-500 mt-1">{material.description}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <a href={getFileUrl(material.fileUrl)} target="_blank" rel="noopener noreferrer"
                                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition">View PDF →</a>
                                  {userRole === "TEACHER" && isCourseApproved && isEditing && (
                                    <>
                                      <button onClick={() => openEditMaterialModal(material)} className="bg-blue-500 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-blue-600 transition">✏️</button>
                                      <button onClick={() => deleteMaterial(material.id)} className="bg-red-500 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-red-600 transition">🗑️</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {courseMaterials.filter((m) => m.type === "VIDEO").length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><span className="text-blue-500">🎥</span> Video Lectures</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {courseMaterials.filter((m) => m.type === "VIDEO").map((material) => (
                            <div key={material.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-800">{material.title}</p>
                                  {material.description && <p className="text-xs text-gray-500 mt-1">{material.description}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <a href={material.videoUrl} target="_blank" rel="noopener noreferrer"
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition">Watch →</a>
                                  {userRole === "TEACHER" && isCourseApproved && isEditing && (
                                    <>
                                      <button onClick={() => openEditMaterialModal(material)} className="bg-blue-500 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-blue-600 transition">✏️</button>
                                      <button onClick={() => deleteMaterial(material.id)} className="bg-red-500 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-red-600 transition">🗑️</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ASSIGNMENTS TAB */}
            {activeTab === "assignments" && isLoggedIn && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><span>📝</span> Course Assignments</h2>

                {userRole === "TEACHER" && isCourseApproved && isEditing && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-green-700 mb-4">Post New Assignment</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={content.title}
                          onChange={(e) => setContent({ ...content, title: e.target.value })} placeholder="Enter assignment title" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea className="w-full border border-gray-300 rounded-lg p-2" rows="2" value={content.description}
                          onChange={(e) => setContent({ ...content, description: e.target.value })} placeholder="Enter description" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Details *</label>
                        <textarea className="w-full border border-gray-300 rounded-lg p-2" rows="3" value={content.assignmentDetails}
                          onChange={(e) => setContent({ ...content, assignmentDetails: e.target.value })} placeholder="Describe the assignment requirements..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input type="datetime-local" className="w-full border border-gray-300 rounded-lg p-2" value={content.dueDate}
                          onChange={(e) => setContent({ ...content, dueDate: e.target.value })} />
                      </div>
                      <button
                        onClick={() => { setContent({ ...content, contentType: "ASSIGNMENT" }); handleUploadContent(); }}
                        disabled={uploading}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50">
                        {uploading ? "Posting..." : "Post Assignment"}
                      </button>
                    </div>
                  </div>
                )}

                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-3">📋</div>
                    <p>No assignments have been posted for this course yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
                        <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                          {assignment.dueDate && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                              📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {userRole === "TEACHER" && isCourseApproved && isEditing && (
                            <div className="flex gap-2">
                              <button onClick={() => openEditMaterialModal(assignment)} className="text-blue-500 hover:text-blue-700 text-sm">✏️ Edit</button>
                              <button onClick={() => deleteMaterial(assignment.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️ Delete</button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{assignment.description || assignment.assignmentDetails}</p>
                        {isLoggedIn && userRole === "STUDENT" && !isEnrolled ? (
                          <button onClick={handleEnrollClick}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                            Enroll to Submit Assignment
                          </button>
                        ) : isLoggedIn && userRole === "STUDENT" && isEnrolled ? (
                          <Link to="/student-dashboard">
                            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                              Go to Dashboard to Submit
                            </button>
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
            {/* Instructor */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Your instructor</h3>
              <div className="flex items-center gap-4 mb-4">
                <img src={course.instructorAvatar || "https://i.pravatar.cc/100?img=12"} alt=""
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-500" />
                <div>
                  <p className="text-green-700 font-bold text-lg">{course.instructorName}</p>
                  <p className="text-sm text-gray-600">{course.instructorTitle || "Senior Trainer"}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <p>🎓 {course.instructorExperience || "10+ Years"}</p>
                <p>📍 Dhaka, Bangladesh</p>
              </div>
              {(course.instructorBio || course.description) && (
                <p className="mt-4 pt-4 border-t text-sm text-gray-500 leading-relaxed">
                  {course.instructorBio || `${course.description.substring(0, 140)}…`}
                </p>
              )}
            </div>

            {/* At a glance */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-24">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">Course at a glance</h3>
              <dl className="space-y-3 text-sm">
                {[
                  ["Type", offline ? "Offline (in-person) batch" : liveOnly ? "Live classes" : "Recorded, self-paced"],
                  offline ? ["Venue", course?.venue] : null,
                  ["Duration", course?.durationInWeeks ? `${course.durationInWeeks} weeks` : null],
                  ["Lessons", course?.totalClasses ? `${course.totalClasses}` : null],
                  ["Level", course?.level],
                  ["Language", course?.language || editCourse.language],
                  live ? ["Seats left", seats !== null ? `${seats} of ${course.totalSeats}` : null] : null,
                ].filter((row) => row && row[1]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <dt className="text-gray-600">{k}</dt>
                    <dd className="font-semibold text-gray-800 text-right">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 pt-5 border-t">
                <h4 className="font-semibold mb-2 text-gray-800">What you will get</h4>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  {(whatsIncluded.length ? whatsIncluded : (live
                    ? ["Live interactive classes", "Support classes for doubts", "Recording of every class", "Assignments & feedback", "Certificate on completion"]
                    : ["Lifetime access to all videos", "Downloadable notes", "Assignments & quizzes", "Certificate on completion"]
                  )).map((item, idx) => (
                    <li key={idx} className="flex gap-2"><span className="text-green-600">✔</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════ MODALS ══════════════════════════ */}

      {/* MODULE MODAL */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-700">{editingModuleIndex !== null ? "Edit Module" : "Add New Module"}</h2>
              <button onClick={() => setShowModuleModal(false)} className="text-gray-500 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Number</label>
                <input type="number" value={moduleForm.weekNumber}
                  onChange={(e) => setModuleForm({ ...moduleForm, weekNumber: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module Title *</label>
                <input type="text" value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Islamic Banking"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input type="text" value={moduleForm.duration}
                  onChange={(e) => setModuleForm({ ...moduleForm, duration: e.target.value })}
                  placeholder="e.g., 2 hours"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma separated)</label>
                <textarea value={moduleForm.details}
                  onChange={(e) => setModuleForm({ ...moduleForm, details: e.target.value })}
                  rows="4" placeholder="Topic 1, Topic 2, Topic 3"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500" />
              </div>
              <button onClick={saveModule} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold">
                {editingModuleIndex !== null ? "Update Module" : "Add Module"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MATERIAL MODAL */}
      {showEditMaterialModal && editingMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-700">Edit {editingMaterial.type}</h2>
              <button onClick={() => setShowEditMaterialModal(false)} className="text-gray-500 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-3"
                  value={editMaterialData.title}
                  onChange={(e) => setEditMaterialData({ ...editMaterialData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea className="w-full border border-gray-300 rounded-lg p-3" rows="3"
                  value={editMaterialData.description}
                  onChange={(e) => setEditMaterialData({ ...editMaterialData, description: e.target.value })} />
              </div>
              {editingMaterial.type === "ASSIGNMENT" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Details *</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-3" rows="4"
                      value={editMaterialData.assignmentDetails}
                      onChange={(e) => setEditMaterialData({ ...editMaterialData, assignmentDetails: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input type="datetime-local" className="w-full border border-gray-300 rounded-lg p-3"
                      value={editMaterialData.dueDate}
                      onChange={(e) => setEditMaterialData({ ...editMaterialData, dueDate: e.target.value })} />
                  </div>
                </>
              )}
              {editingMaterial.type === "VIDEO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video URL *</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-3"
                    value={editMaterialData.videoUrl}
                    onChange={(e) => setEditMaterialData({ ...editMaterialData, videoUrl: e.target.value })} />
                </div>
              )}
              {editingMaterial.type === "PDF" && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">📄 To change the PDF file, delete this material and upload a new one.</p>
                  {editingMaterial.fileUrl && (
                    <a href={getFileUrl(editingMaterial.fileUrl)} target="_blank" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                      View Current PDF →
                    </a>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={handleEditMaterialSubmit} disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold disabled:opacity-50">
                  {uploading ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setShowEditMaterialModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-700">Add New Item</h2>
              <button onClick={() => setShowAddSectionModal(false)} className="text-gray-500 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Enter item text" value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" autoFocus />
              <button onClick={handleAddItem} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENROLLMENT: bKash / Nagad instructions → form → done ── */}
      <EnrollmentModal
        course={course}
        open={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        onSubmitted={(status) => {
          if (status === "ACTIVE") { setIsEnrolled(true); setEnrollmentStatus("ACTIVE"); }
          else if (status) setEnrollmentStatus(status);
          setEnrollmentNote(null);
        }}
      />

      {/* PUBLISH CONFIRM MODAL */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="text-5xl mb-4">📢</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-3">Send Publish Request?</h2>
            <p className="text-gray-600 mb-4">
              Admin will review your course and publish it if everything is ready.
            </p>
            <div className="flex gap-3">
              <button onClick={handleSendPublishRequest} disabled={publishRequestLoading}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition font-semibold disabled:opacity-50">
                {publishRequestLoading ? "Sending..." : "Yes, Send Request"}
              </button>
              <button onClick={() => setShowPublishConfirmModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce { animation: bounce 0.5s ease-out; }
      `}</style>
    </div>
  );
}
