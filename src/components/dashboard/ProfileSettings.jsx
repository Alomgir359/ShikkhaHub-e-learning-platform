import React, { useState } from "react";
import { API_BASE, Avatar, Card, Modal, PageTitle, fmtDate, inputCls, labelCls, primaryBtn, ghostBtn } from "./common";

/**
 * Profile & Settings — shared by the student and the instructor dashboard.
 * Profile info, profile picture, name / email, password change and basic account details.
 */
export default function ProfileSettings({ userId, profile, setProfile, photoUrl, uploading, onPhoto, showToast, isInstructor = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPw, setChangingPw] = useState(false);

  const openEdit = () => { setDraft({ ...profile }); setEditing(true); };

  const saveProfile = async () => {
    if (!draft.fullName?.trim() || !draft.email?.trim()) { showToast("Name and email are required", "error"); return; }
    setSaving(true);
    try {
      const body = {
        fullName: draft.fullName,
        email: draft.email,
        phone: draft.phone || "",
        currentProfession: draft.currentProfession || "",
        organization: draft.organization || "",
      };
      if (isInstructor) body.experience = draft.experience || "";
      const res = await fetch(`${API_BASE}/teachers/update/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update profile");
      setProfile((p) => ({ ...p, ...body }));
      localStorage.setItem("userName", draft.fullName);
      localStorage.setItem("userEmail", draft.email);
      setEditing(false);
      showToast("Profile updated ✅");
    } catch (err) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pw.currentPassword || !pw.newPassword || !pw.confirmPassword) { showToast("Please fill all password fields", "error"); return; }
    if (pw.newPassword !== pw.confirmPassword) { showToast("New passwords do not match", "error"); return; }
    if (pw.newPassword.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    setChangingPw(true);
    try {
      const res = await fetch(`${API_BASE}/teachers/change-password/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
      });
      if (!res.ok) throw new Error("Current password is incorrect");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed 🔐");
    } catch (err) {
      showToast(err.message || "Network error", "error");
    } finally {
      setChangingPw(false);
    }
  };

  const rows = [
    ["Full name", profile.fullName],
    ["Email address", profile.email],
    ["Phone number", profile.phone],
    [isInstructor ? "Current profession" : "Profession", profile.currentProfession],
    ["Organization", profile.organization],
    ...(isInstructor ? [["Experience", profile.experience]] : []),
  ];

  const fields = [
    ["fullName", "Full name", "text"],
    ["email", "Email address", "email"],
    ["phone", "Phone number", "tel"],
    ["currentProfession", "Current profession", "text"],
    ["organization", "Organization", "text"],
  ];

  return (
    <>
      <PageTitle>Profile &amp; Settings</PageTitle>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="👤 Profile information">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar src={photoUrl} name={profile.fullName} size={112} className="border-4 border-green-500 shadow-lg" />
              <label className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 cursor-pointer hover:bg-green-700 transition" title="Change profile picture">
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { onPhoto(e.target.files[0]); e.target.value = ""; }} />
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </label>
            </div>
            <button onClick={openEdit} className={`mt-4 ${primaryBtn}`}>Edit profile information</button>
          </div>

          <div className="space-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="border-b pb-2">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800 break-words">{value || "Not set"}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="🔐 Change password">
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
              For security, please choose a strong password with at least 6 characters.
            </div>
            <div className="space-y-3">
              {[
                ["currentPassword", "Current password"],
                ["newPassword", "New password"],
                ["confirmPassword", "Confirm new password"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type="password" className={inputCls} value={pw[key]} onChange={(e) => setPw({ ...pw, [key]: e.target.value })} placeholder={label} autoComplete="off" />
                </div>
              ))}
              <button onClick={changePassword} disabled={changingPw} className={`w-full ${primaryBtn}`}>
                {changingPw ? "Updating..." : "Update password"}
              </button>
            </div>
          </Card>

          <Card title="⚙️ Account">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Account type</span><span className="font-semibold">{isInstructor ? "Instructor" : "Student"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Status</span><span className="font-semibold text-green-600">{profile.status || "Active"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Member since</span><span className="font-semibold">{fmtDate(profile.appliedAt) || "—"}</span></div>
            </div>
          </Card>
        </div>
      </div>

      {editing && (
        <Modal title="Edit profile" onClose={() => setEditing(false)}>
          <div className="space-y-4">
            {fields.map(([key, label, type]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type={type} className={inputCls} value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
              </div>
            ))}
            {isInstructor && (
              <div>
                <label className={labelCls}>Experience</label>
                <textarea rows="3" className={inputCls} value={draft.experience || ""} onChange={(e) => setDraft({ ...draft, experience: e.target.value })} />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={saveProfile} disabled={saving} className={`flex-1 ${primaryBtn}`}>{saving ? "Saving..." : "Save changes"}</button>
              <button onClick={() => setEditing(false)} className={`flex-1 ${ghostBtn}`}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
