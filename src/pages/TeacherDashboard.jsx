import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell, Spinner, ToastStack, apiGet, todayStr, useProfile, useToasts } from "../components/dashboard/common";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import InstructorOverview from "./instructor/InstructorOverview";
import InstructorCourses from "./instructor/InstructorCourses";
import InstructorRecorded from "./instructor/InstructorRecorded";
import InstructorAssignments from "./instructor/InstructorAssignments";
import InstructorSubmissions from "./instructor/InstructorSubmissions";
import InstructorLive from "./instructor/InstructorLive";
import CreateCourseModal from "./instructor/CreateCourseModal";

/**
 * Instructor dashboard
 *   Dashboard · My Courses · Recorded Classes · Assignments · Submissions · Live Classes · Profile & Settings
 */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  const { toasts, showToast, removeToast } = useToasts();
  const { profile, setProfile, photoUrl, uploading, uploadPhoto } = useProfile(userId, showToast);

  const [active, setActive] = useState("dashboard");
  const [preset, setPreset] = useState({}); // { courseId, assignmentId } when jumping from a course card / assignment
  const [courses, setCourses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!userId || userRole !== "TEACHER") navigate("/", { replace: true });
  }, [navigate, userId, userRole]);

  // courses + counters (called again after every upload / create so the numbers stay correct)
  const refresh = useCallback(async () => {
    const [c, s] = await Promise.allSettled([
      apiGet(`/dashboard/instructor/${userId}/courses`),
      apiGet(`/dashboard/instructor/${userId}/summary?today=${todayStr()}`),
    ]);
    if (c.status === "fulfilled") setCourses(c.value);
    if (s.status === "fulfilled") setSummary(s.value);
    if (c.status === "rejected" && s.status === "rejected") showToast("Could not load the dashboard. Is the backend running?", "error");
    setLoading(false);
  }, [userId, showToast]);

  useEffect(() => { if (userId) refresh(); }, [userId, refresh]);

  const go = (section, courseId, extra = {}) => {
    setPreset({ courseId, ...extra });
    setActive(section);
  };

  const menu = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "courses", label: "📚 My Courses" },
    { key: "recorded", label: "🎬 Recorded Classes" },
    { key: "assignments", label: "📝 Assignments" },
    { key: "submissions", label: "📥 Submissions", badge: summary?.toReview || 0 },
    { key: "live", label: "🎥 Live Classes" },
    { key: "profile", label: "⚙️ Profile & Settings" },
  ];

  if (!userId || userRole !== "TEACHER") return null;

  // `key` makes a section start fresh (with its course preset) every time it is opened from a shortcut
  const sectionKey = `${active}-${preset.courseId || ""}-${preset.assignmentId || ""}`;

  return (
    <>
      <ToastStack toasts={toasts} removeToast={removeToast} />
      <DashboardShell
        menu={menu}
        active={active}
        onSelect={(k) => go(k)}
        profile={profile}
        photoUrl={photoUrl}
        uploading={uploading}
        onPhoto={uploadPhoto}
        subtitle="Instructor"
        footerNote="Instructor Portal v3.0"
      >
        {loading ? (
          <Spinner label="Loading dashboard..." />
        ) : (
          <>
            {active === "dashboard" && <InstructorOverview name={profile.fullName?.split(" ")[0]} summary={summary} onNavigate={(k) => go(k)} />}
            {active === "courses" && (
              <InstructorCourses userId={userId} courses={courses} onNavigate={(k, cid) => go(k, cid)} onCreate={() => setShowCreate(true)} showToast={showToast} />
            )}
            {active === "recorded" && <InstructorRecorded key={sectionKey} userId={userId} courses={courses} presetCourseId={preset.courseId} onChanged={refresh} showToast={showToast} />}
            {active === "assignments" && (
              <InstructorAssignments
                key={sectionKey}
                userId={userId}
                courses={courses}
                presetCourseId={preset.courseId}
                onChanged={refresh}
                onViewSubmissions={(a) => go("submissions", a.courseId, { assignmentId: a.id })}
                showToast={showToast}
              />
            )}
            {active === "submissions" && <InstructorSubmissions key={sectionKey} userId={userId} courses={courses} presetFilter={preset} onChanged={refresh} showToast={showToast} />}
            {active === "live" && <InstructorLive key={sectionKey} userId={userId} courses={courses} presetCourseId={preset.courseId} onChanged={refresh} showToast={showToast} />}
            {active === "profile" && (
              <ProfileSettings userId={userId} profile={profile} setProfile={setProfile} photoUrl={photoUrl} uploading={uploading} onPhoto={uploadPhoto} showToast={showToast} isInstructor />
            )}
          </>
        )}
      </DashboardShell>

      {showCreate && <CreateCourseModal teacher={profile} userId={userId} onClose={() => setShowCreate(false)} onCreated={refresh} showToast={showToast} />}
    </>
  );
}
