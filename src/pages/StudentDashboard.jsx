import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardShell, Modal, Spinner, ToastStack, apiGet, ghostBtn, inputCls, todayStr, useProfile, useToasts,
} from "../components/dashboard/common";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import StudentOverview from "./student/StudentOverview";
import StudentRecorded from "./student/StudentRecorded";
import StudentLive from "./student/StudentLive";
import StudentAssignments from "./student/StudentAssignments";
/**
 * Student dashboard
 *   Dashboard · Recorded Classes · Live Classes · Assignments · Profile & Settings
 * Everything shown here is limited to the courses the student is enrolled in (verified enrollments only).
 */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  const { toasts, showToast, removeToast } = useToasts();
  const { profile, setProfile, photoUrl, uploading, uploadPhoto } = useProfile(userId, showToast);

  const [active, setActive] = useState("dashboard");
  const [recordedJump, setRecordedJump] = useState(null); // { courseId, videoId } coming from the dashboard
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [recorded, setRecorded] = useState([]);
  const [live, setLive] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState("");

  useEffect(() => {
    if (!userId || userRole !== "STUDENT") navigate("/", { replace: true });
  }, [navigate, userId, userRole]);

  const loadAssignments = useCallback(async () => {
    try { setAssignments(await apiGet(`/assignments/student/${userId}`)); }
    catch (err) { console.error("assignments", err); }
  }, [userId]);

  const loadAll = useCallback(async () => {
    const results = await Promise.allSettled([
      apiGet(`/dashboard/student/${userId}/courses`),
      apiGet(`/enrollments/student/${userId}`),
      apiGet(`/recorded-classes/student/${userId}`),
      apiGet(`/live-classes/student/${userId}?from=${todayStr()}`),
      apiGet(`/assignments/student/${userId}`),
    ]);
    const [c, e, r, l, a] = results.map((x) => (x.status === "fulfilled" ? x.value : null));
    setCourses(c || []);
    setPendingEnrollments((e || []).filter((x) => x.status === "PENDING" || x.status === "REJECTED"));
    setRecorded(r || []);
    setLive(l || []);
    setAssignments(a || []);
    if (results.some((x) => x.status === "rejected")) showToast("Some dashboard data could not be loaded. Is the backend running?", "error");
    setLoading(false);
  }, [userId, showToast]);

  useEffect(() => { if (userId) loadAll(); }, [userId, loadAll]);

  const navigateTo = (section, params) => {
    setRecordedJump(section === "recorded" && params ? params : null);
    setActive(section);
  };

  const pendingCount = assignments.filter((a) => a.status === "PENDING" || a.status === "RESUBMIT_REQUESTED").length;
  const todayLiveCount = live.filter((c) => c.classDate === todayStr()).length;

  const menu = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "recorded", label: "🎬 Recorded Classes" },
    { key: "live", label: "🎥 Live Classes", badge: todayLiveCount },
    { key: "assignments", label: "📝 Assignments", badge: pendingCount },
    { key: "profile", label: "⚙️ Profile & Settings" },
  ];

  const submitComplaint = () => {
    if (!complaintText.trim()) { showToast("Please enter your complaint", "error"); return; }
    showToast("Complaint submitted successfully!");
    setComplaintText("");
    setShowComplaint(false);
  };

  if (!userId || userRole !== "STUDENT") return null;

  return (
    <>
      <ToastStack toasts={toasts} removeToast={removeToast} />
      <DashboardShell
        menu={menu}
        active={active}
        onSelect={(key) => navigateTo(key)}
        profile={profile}
        photoUrl={photoUrl}
        uploading={uploading}
        onPhoto={uploadPhoto}
        subtitle="Student"
        footerNote="Student Portal v3.0"
        sidebarExtra={
          <button onClick={() => setShowComplaint(true)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-500/30 mt-4">🚨 Submit Complaint</button>
        }
      >
        {loading ? (
          <Spinner label="Loading dashboard..." />
        ) : (
          <>
            {active === "dashboard" && (
              <StudentOverview
                name={profile.fullName?.split(" ")[0] || "Student"}
                courses={courses}
                pendingEnrollments={pendingEnrollments}
                live={live}
                assignments={assignments}
                recorded={recorded}
                onNavigate={navigateTo}
              />
            )}
            {active === "recorded" && (
              <StudentRecorded
                courses={courses}
                recorded={recorded}
                initialCourseId={recordedJump?.courseId}
                initialVideoId={recordedJump?.videoId}
                onConsumeInitial={() => setRecordedJump(null)}
              />
            )}
            {active === "live" && <StudentLive live={live} />}
            {active === "assignments" && (
              <StudentAssignments userId={userId} courses={courses} assignments={assignments} onChanged={loadAssignments} showToast={showToast} />
            )}
            {active === "profile" && (
              <ProfileSettings userId={userId} profile={profile} setProfile={setProfile} photoUrl={photoUrl} uploading={uploading} onPhoto={uploadPhoto} showToast={showToast} />
            )}
          </>
        )}
      </DashboardShell>

      {showComplaint && (
        <Modal title="Submit Complaint" onClose={() => setShowComplaint(false)}>
          <textarea className={`${inputCls} h-32`} placeholder="Describe your complaint..." value={complaintText} onChange={(e) => setComplaintText(e.target.value)} />
          <div className="flex gap-3 mt-4">
            <button onClick={submitComplaint} className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-semibold">Submit</button>
            <button onClick={() => setShowComplaint(false)} className={`flex-1 ${ghostBtn}`}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}
