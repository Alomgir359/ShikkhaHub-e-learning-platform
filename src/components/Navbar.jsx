
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
import {API_BASE} from "../utils/courseMeta";


export default function Navbar() {
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [tempId, setTempId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ── Student sign-up (no approval needed) ─────────────────────────────────
  const [registerOpen, setRegisterOpen] = useState(false);
  const [stayOnPage, setStayOnPage] = useState(false); // true when opened from a course page
  const [regForm, setRegForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [regErrors, setRegErrors] = useState({});

  // Shown inside the login modal: enrollment submitted / waiting for admin / payment rejected
  // { tone: "info" | "pending" | "error", title, text }
  const [loginNotice, setLoginNotice] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("userId");
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    if (token) {
      setIsLoggedIn(true);
      setUserName(name || "");
      setUserRole(role || "");
    }
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Other pages (e.g. CourseDetails "Enroll") can open login / sign-up
  useEffect(() => {
    const onOpenAuth = (e) => {
      const mode = e.detail?.mode || "login";
      setStayOnPage(!!e.detail?.stayOnPage);
      setLoginNotice(e.detail?.notice || null);
      if (e.detail?.email) setLoginForm((f) => ({ ...f, email: e.detail.email }));
      setLoginOpen(mode === "login");
      setRegisterOpen(mode === "register");
    };
    window.addEventListener("shikkhahub:open-auth", onOpenAuth);
    return () => window.removeEventListener("shikkhahub:open-auth", onOpenAuth);
  }, []);

  const saveSession = (data) => {
    localStorage.setItem("userId", data.id);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userEmail", data.email);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("userStatus", data.status);
    setIsLoggedIn(true);
    setUserName(data.name);
    setUserRole(data.role);
    window.dispatchEvent(new Event("shikkhahub:auth-changed"));
  };

  const goToDashboard = (role) => {
    if (role === "TEACHER") navigate("/teacher-dashboard", { replace: true });
    else if (role === "STUDENT") navigate("/student-dashboard", { replace: true });
    else if (role === "ADMIN") navigate("/admin/teachers", { replace: true });
    else navigate("/", { replace: true });
  };

  const validateRegister = () => {
    const e = {};
    const name = regForm.fullName.trim();
    if (!name) e.fullName = "Full name is required.";
    else if (name.length < 2 || name.length > 50 || !/^(?![\s.\-]+$)(?!.*\s{2,})[A-Za-z][A-Za-z\s.\-]{1,49}$/.test(name))
      e.fullName = "Use 2–50 letters. Spaces, dot (.) and hyphen (-) are allowed.";
    if (!regForm.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) e.email = "Please enter a valid email address.";
    if (!regForm.phone.trim()) e.phone = "Mobile number is required.";
    else if (!/^01[3-9]\d{8}$/.test(regForm.phone.trim())) e.phone = "Enter an 11-digit Bangladeshi number, e.g. 01XXXXXXXXX.";
    if (!regForm.password) e.password = "Password is required.";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/.test(regForm.password))
      e.password = "8–64 characters with uppercase, lowercase, number and special character.";
    if (!regForm.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (regForm.password !== regForm.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setRegErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regForm.fullName.trim(),
          email: regForm.email.trim(),
          phone: regForm.phone.trim(),
          password: regForm.password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        saveSession(data);
        setRegisterOpen(false);
        setRegForm({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
        setRegErrors({});
        setSuccessMessage("Account created. You're logged in.");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
        if (!stayOnPage) navigate("/student-dashboard", { replace: true });
        setStayOnPage(false);
      } else {
        setErrorMessage(data.message || "Sign up failed. Please try again.");
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const navLinkClass = (path) =>
    `transition hover:text-green-600 ${location.pathname === path ? "text-green-700 font-semibold" : ""}`;

  // Step 1 Form State — same as original
  const [step1Data, setStep1Data] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    currentProfession: "",
    organization: "",
    experience: ""
  });

  // Step 1 field-level errors
  const [step1Errors, setStep1Errors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    currentProfession: "",
    organization: "",
    experience: ""
  });

  // Step 2 Form State — same as original
  const [step2Files, setStep2Files] = useState({
    cv: null,
    nidPhoto: null,
    profilePhoto: null,
    organizationIdCard: null
  });

  // Step 2 field-level errors
  const [step2Errors, setStep2Errors] = useState({
    cv: "",
    nidPhoto: "",
    profilePhoto: "",
    organizationIdCard: ""
  });

  // Login State
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // ── Validation regexes (PDF spec) ─────────────────────────────────────────
  const nameRegex = /^(?![\s.\-]+$)(?!.*\s{2,})[A-Za-z][A-Za-z\s.\-]{1,49}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
  const professionRegex = /^(?![\s,'\-]+$)(?!.*\s{2,})(?=.*[A-Za-z])[A-Za-z0-9\s,'\-]{3,100}$/;
  const organizationRegex = /^(?![\s.'\-_]+$)(?!.*\s{2,})(?=.*[A-Za-z])[A-Za-z0-9\s.'\-_]{3,150}$/;
  const experienceRegex = /^(?![\s.'\-_\[\]\/]+$)(?!.*\s{2,})(?=.*[A-Za-z])[A-Za-z0-9\s.'\-_\[\]\/]{1,1000}$/;

  const handleStep1Change = (e) => {
    const { name, value } = e.target;
    setStep1Data({ ...step1Data, [name]: value });
    setStep1Errors({ ...step1Errors, [name]: "" });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    setStep2Files({ ...step2Files, [name]: file });
    setStep2Errors({ ...step2Errors, [name]: "" });
  };

  // ── Step 1 Validation ─────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errors = { fullName: "", email: "", phone: "", password: "", currentProfession: "", organization: "", experience: "" };
    let valid = true;

    // Full Name
    if (!step1Data.fullName.trim()) {
      errors.fullName = "Full name is required."; valid = false;
    } else if (step1Data.fullName.trim().length < 2 || step1Data.fullName.trim().length > 50) {
      errors.fullName = "Full name must be 2–50 characters."; valid = false;
    } else if (!nameRegex.test(step1Data.fullName.trim())) {
      errors.fullName = "Only letters, spaces, dot (.) and hyphen (-) allowed. Adjacent spaces or only special characters not permitted."; valid = false;
    }

    // Email
    if (!step1Data.email.trim()) {
      errors.email = "Email address is required."; valid = false;
    } else if (step1Data.email.trim().length > 254) {
      errors.email = "Email must not exceed 254 characters."; valid = false;
    } else if (!emailRegex.test(step1Data.email.trim())) {
      errors.email = "Please enter a valid email address."; valid = false;
    }

    // Phone
    if (!step1Data.phone.trim()) {
      errors.phone = "Mobile number is required."; valid = false;
    } else if (!/^\d+$/.test(step1Data.phone.trim())) {
      errors.phone = "Only digits allowed (no country code)."; valid = false;
    } else if (step1Data.phone.trim().length !== 11) {
      errors.phone = "Mobile number must be exactly 11 digits."; valid = false;
    } else if (!bdPhoneRegex.test(step1Data.phone.trim())) {
      errors.phone = "Enter a valid Bangladeshi number (e.g., 01XXXXXXXXX)."; valid = false;
    }

    // Password
    if (!step1Data.password) {
      errors.password = "Password is required."; valid = false;
    } else if (!passwordRegex.test(step1Data.password)) {
      errors.password = "Must be 8–64 chars with uppercase, lowercase, number & special character."; valid = false;
    }

    // Current Profession
    if (!step1Data.currentProfession.trim()) {
      errors.currentProfession = "Current profession is required."; valid = false;
    } else if (step1Data.currentProfession.trim().length < 3 || step1Data.currentProfession.trim().length > 100) {
      errors.currentProfession = "Profession must be 3–100 characters."; valid = false;
    } else if (!professionRegex.test(step1Data.currentProfession.trim())) {
      errors.currentProfession = "Must contain at least one letter. Only letters, numbers, spaces, commas, apostrophes, hyphen allowed."; valid = false;
    }

    // Organization
    if (!step1Data.organization.trim()) {
      errors.organization = "Organization is required."; valid = false;
    } else if (step1Data.organization.trim().length < 3 || step1Data.organization.trim().length > 150) {
      errors.organization = "Organization must be 3–150 characters."; valid = false;
    } else if (!organizationRegex.test(step1Data.organization.trim())) {
      errors.organization = "Must contain at least one letter. Only letters, numbers, spaces, dot, apostrophe, underscore, hyphen allowed."; valid = false;
    }

    // Experience (optional)
    if (step1Data.experience.trim()) {
      if (step1Data.experience.trim().length > 1000) {
        errors.experience = "Experience details must not exceed 1000 characters."; valid = false;
      } else if (!experienceRegex.test(step1Data.experience.trim())) {
        errors.experience = "Must contain at least one letter. No multiple adjacent spaces or only special characters."; valid = false;
      }
    }

    setStep1Errors(errors);
    return valid;
  };

  // ── Step 2 Validation ─────────────────────────────────────────────────────
  const validateStep2 = () => {
    const errors = { cv: "", nidPhoto: "", profilePhoto: "", organizationIdCard: "" };
    let valid = true;

    if (!step2Files.cv) {
      errors.cv = "CV is required."; valid = false;
    }
    if (!step2Files.nidPhoto) {
      errors.nidPhoto = "NID / Passport photo is required."; valid = false;
    }
    if (!step2Files.profilePhoto) {
      errors.profilePhoto = "Profile picture is required."; valid = false;
    }
    if (!step2Files.organizationIdCard) {
      errors.organizationIdCard = "Organization ID card is required."; valid = false;
    }

    setStep2Errors(errors);
    return valid;
  };

  // ── Step 1 Submit — validate then move to step 2, NO API call ────────────
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setStep(2);
  };

  // ── Step 2 Submit — validate then do BOTH API calls (original logic) ──────
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);

    try {
      // API Call 1: Step 1 — same payload as original
      const response = await fetch(`${API_BASE}/teachers/apply/step1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step1Data)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newTempId = data.tempId;
        setTempId(newTempId);

        // API Call 2: Step 2 — same formData as original
        const formData = new FormData();
        formData.append("cv", step2Files.cv);
        formData.append("nidPhoto", step2Files.nidPhoto);
        formData.append("profilePhoto", step2Files.profilePhoto);
        formData.append("organizationIdCard", step2Files.organizationIdCard);

        const step2Response = await fetch(`${API_BASE}/teachers/apply/step2/${newTempId}`, {
          method: "POST",
          body: formData
        });

        const step2Data = await step2Response.json();

        if (step2Response.ok) {
          setSuccessMessage("Application Submitted Successfully! Our team will review your application.");
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
          resetModal();
        } else {
          setErrorMessage(step2Data.message || "Step 2 failed");
          setShowError(true);
          setTimeout(() => setShowError(false), 5000);
        }
      } else {
        setErrorMessage(data.message || "Step 1 failed");
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Network error. Please try again.");
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ── Login Handler — same as original ─────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/teachers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok && data.message === "Login Success") {
        saveSession(data);
        setLoginOpen(false);
        setLoginNotice(null);
        if (!stayOnPage) goToDashboard(data.role);
        setStayOnPage(false);
      } else if (data.code === "ENROLLMENT_PENDING") {
        // Correct password, but the admin has not verified the payment yet
        setLoginNotice({
          tone: "pending",
          title: "✅ এনরোলমেন্ট সম্পন্ন হয়েছে",
          text: data.message || "অ্যাডমিন আপনার পেমেন্ট যাচাই করে অ্যাপ্রুভ করলেই আপনি লগইন করতে পারবেন।",
        });
      } else if (data.code === "ENROLLMENT_REJECTED") {
        setLoginNotice({ tone: "error", title: "পেমেন্ট অ্যাপ্রুভ হয়নি", text: data.message });
      } else if (data.code === "ACCOUNT_PENDING" || data.code === "ACCOUNT_REJECTED") {
        setLoginNotice({ tone: data.code === "ACCOUNT_PENDING" ? "pending" : "error", title: "Account not active yet", text: data.message });
      } else {
        setLoginNotice({ tone: "error", title: "Login failed", text: data.message || "Invalid email or password" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Login failed. Please try again.");
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setLoading(false);
      setLoginForm((f) => ({ ...f, password: "" }));
    }
  };

  // ── Logout — same as original ─────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("shikkhahub:auth-changed"));
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");
    navigate("/", { replace: true });
    setSuccessMessage("Logged out successfully!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDashboardClick = () => {
    const role = localStorage.getItem("userRole");
    if (role === "TEACHER") navigate("/teacher-dashboard");
    else if (role === "STUDENT") navigate("/student-dashboard");
    else if (role === "ADMIN") navigate("/admin/teachers");
    setMobileMenuOpen(false);
  };

  const resetModal = () => {
    setStep(1);
    setTempId(null);
    setStep1Data({ fullName: "", email: "", phone: "", password: "", currentProfession: "", organization: "", experience: "" });
    setStep1Errors({ fullName: "", email: "", phone: "", password: "", currentProfession: "", organization: "", experience: "" });
    setStep2Files({ cv: null, nidPhoto: null, profilePhoto: null, organizationIdCard: null });
    setStep2Errors({ cv: "", nidPhoto: "", profilePhoto: "", organizationIdCard: "" });
    setTeacherOpen(false);
  };

  // Reusable error message
  const FieldError = ({ msg }) =>
    msg ? <p className="text-red-500 text-xs mt-1">⚠ {msg}</p> : null;

  const inputClass = (err) =>
    `w-full border rounded-lg p-2 md:p-3 text-sm md:text-base focus:outline-none focus:ring-2 ${
      err ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-green-500"
    }`;

  return (
    <>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg animate-slide-in text-sm md:text-base">
          ✅ {successMessage}
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div className="fixed top-20 right-4 z-50 bg-red-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg animate-slide-in text-sm md:text-base">
          ❌ {errorMessage}
        </div>
      )}

      {/* NAVBAR — same as original */}
      <nav className="bg-green-50 shadow-md sticky top-0 z-50">
        <div className="px-4 md:px-8 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-0 md:gap-0 cursor-pointer hover:opacity-80 transition" onClick={() => navigate("/")}>
              <h1 className="m-0"><Logo /></h1>
            </div>

            <div className="hidden md:flex items-center gap-6 font-medium">
              <button onClick={() => navigate("/")} className={navLinkClass("/")}>Home</button>
              <button onClick={() => navigate("/courses")} className={navLinkClass("/courses")}>Courses</button>
              <button onClick={() => navigate("/upcoming-live")} className={`inline-flex items-center gap-2 ${navLinkClass("/upcoming-live")}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Upcoming Batches
              </button>
              {isLoggedIn && (
                <button onClick={handleDashboardClick} className="hover:text-green-600 transition">Dashboard</button>
              )}
              {!isLoggedIn ? (
                <>
                  <button onClick={() => { setStayOnPage(false); setLoginOpen(true); }} className="border border-white-600 text-white hover:text-green-600 px-4 py-2 rounded-full bg-green-600 hover:bg-white transition">Login</button>
                  <button onClick={() => { setStayOnPage(false); setRegisterOpen(true); }} className="border border-green-600 text-green-700 bg-white px-4 py-2 rounded-full hover:bg-green-600 hover:text-white transition">Sign up</button>
                  <button onClick={() => setTeacherOpen(true)} className="text-green-700 underline-offset-4 hover:underline transition">Join as Teacher</button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-gray-600"><i className="fas fa-user-circle mr-1"></i>Welcome, {userName}</span>
                  <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition">
                    <i className="fas fa-sign-out-alt mr-1"></i>Logout
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-600 hover:text-green-600 focus:outline-none">
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 border-t pt-4">
              <button onClick={() => { navigate("/"); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-lg transition">Home</button>
              <button onClick={() => { navigate("/courses"); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-lg transition">Courses</button>
              <button onClick={() => { navigate("/upcoming-live"); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full text-left py-2 px-3 hover:bg-gray-100 rounded-lg transition">
                <span className="h-2 w-2 rounded-full bg-red-500"></span> Upcoming Batches
              </button>
              {isLoggedIn && <button onClick={handleDashboardClick} className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-lg transition">Dashboard</button>}
              {!isLoggedIn ? (
                <>
                  <button onClick={() => { setStayOnPage(false); setLoginOpen(true); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Login</button>
                  <button onClick={() => { setStayOnPage(false); setRegisterOpen(true); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition">Sign up as student</button>
                  <button onClick={() => { setTeacherOpen(true); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition">Join as Teacher</button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="py-2 px-3 text-gray-600"><i className="fas fa-user-circle mr-2"></i>Welcome, {userName}</div>
                  <button onClick={handleLogout} className="block w-full text-left py-2 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"><i className="fas fa-sign-out-alt mr-2"></i>Logout</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* LOGIN MODAL — same as original */}
      {loginOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-5 md:p-6 rounded-2xl relative mx-4">
            <button onClick={() => { setLoginOpen(false); setStayOnPage(false); setLoginNotice(null); }} aria-label="Close" className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">✖</button>
            <div className="flex justify-center mb-3">
              <Logo size="sm" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-green-600 mb-4 text-center">Login to ShikkhaHub</h2>
            {loginNotice && (
              <div role="status" className={`mb-4 rounded-xl border p-3 text-sm leading-relaxed ${
                loginNotice.tone === "error" ? "bg-red-50 border-red-200 text-red-800"
                  : loginNotice.tone === "pending" ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-green-50 border-green-200 text-green-900"}`}>
                {loginNotice.title && <p className="font-bold mb-1">{loginNotice.title}</p>}
                <p>{loginNotice.text}</p>
                {loginNotice.tone === "pending" && (
                  <p className="mt-2 text-xs text-amber-800">সাধারণত কয়েক ঘণ্টার মধ্যে যাচাই সম্পন্ন হয়। অ্যাপ্রুভ হলে এই ইমেইল ও পাসওয়ার্ড দিয়েই লগইন করবেন।</p>
                )}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Email *" className="w-full border border-gray-300 p-2 md:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
              <input type="password" placeholder="Password *" className="w-full border border-gray-300 p-2 md:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
              <button type="submit" className="w-full bg-green-600 text-white py-2 md:py-3 rounded-lg hover:bg-green-700 transition" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
            </form>
            <p className="text-sm text-gray-600 text-center mt-4">
              New to ShikkhaHub?{" "}
              <button type="button" onClick={() => { setLoginOpen(false); setRegisterOpen(true); }} className="text-green-700 font-semibold hover:underline">
                Create a student account
              </button>
            </p>
          </div>
        </div>
      )}

      {/* STUDENT SIGN-UP MODAL — no approval needed */}
      {registerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-5 md:p-6 rounded-2xl relative mx-4 max-h-[92vh] overflow-y-auto">
            <button onClick={() => { setRegisterOpen(false); setStayOnPage(false); setRegErrors({}); }} aria-label="Close" className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">✖</button>
            <div className="flex justify-center mb-3">
              <Logo size="sm" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-green-600 mb-1 text-center">Create your student account</h2>
            <p className="text-sm text-gray-500 text-center mb-4">Sign up free. Courses you buy will appear in your dashboard.</p>
            <form onSubmit={handleRegister} className="space-y-3" noValidate>
              {[
                { name: "fullName", type: "text", placeholder: "Full name *", autoComplete: "name" },
                { name: "email", type: "email", placeholder: "Email *", autoComplete: "email" },
                { name: "phone", type: "tel", placeholder: "Mobile number * (01XXXXXXXXX)", autoComplete: "tel" },
                { name: "password", type: "password", placeholder: "Password *", autoComplete: "new-password" },
                { name: "confirmPassword", type: "password", placeholder: "Confirm password *", autoComplete: "new-password" },
              ].map((f) => (
                <div key={f.name}>
                  <input
                    type={f.type}
                    name={f.name}
                    placeholder={f.placeholder}
                    autoComplete={f.autoComplete}
                    aria-label={f.placeholder}
                    aria-invalid={!!regErrors[f.name]}
                    className={inputClass(regErrors[f.name])}
                    value={regForm[f.name]}
                    onChange={(e) => { setRegForm({ ...regForm, [f.name]: e.target.value }); setRegErrors({ ...regErrors, [f.name]: "" }); }}
                  />
                  <FieldError msg={regErrors[f.name]} />
                </div>
              ))}
              <button type="submit" className="w-full bg-green-600 text-white py-2 md:py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-60" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
            <p className="text-sm text-gray-600 text-center mt-4">
              Already have an account?{" "}
              <button type="button" onClick={() => { setRegisterOpen(false); setLoginOpen(true); }} className="text-green-700 font-semibold hover:underline">
                Log in
              </button>
            </p>
          </div>
        </div>
      )}

      {/* TEACHER REGISTRATION MODAL */}
      {teacherOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl p-4 md:p-6 rounded-2xl relative max-h-[90vh] overflow-y-auto mx-4">
            <button onClick={resetModal} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl">✖</button>

            {/* Step Indicator */}
            <div className="flex mb-6">
              <div className={`flex-1 text-center pb-2 text-sm md:text-base border-b-2 ${step === 1 ? "border-green-600 text-green-600" : "border-gray-300 text-gray-500"}`}>Step 1: Personal Info</div>
              <div className={`flex-1 text-center pb-2 text-sm md:text-base border-b-2 ${step === 2 ? "border-green-600 text-green-600" : "border-gray-300 text-gray-500"}`}>Step 2: Documents Upload</div>
            </div>

            {/* ── STEP 1 — same fields as original, validation added ── */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-3">
                <h2 className="text-lg md:text-xl font-bold text-green-600 mb-4">Teacher Registration - Personal Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input name="fullName" placeholder="Full Name *" className={inputClass(step1Errors.fullName)} value={step1Data.fullName} onChange={handleStep1Change} />
                    <FieldError msg={step1Errors.fullName} />
                  </div>

                  <div>
                    <input name="email" placeholder="Email *" type="email" className={inputClass(step1Errors.email)} value={step1Data.email} onChange={handleStep1Change} />
                    <FieldError msg={step1Errors.email} />
                  </div>

                  <div>
                    <input name="phone" placeholder="Phone Number *" className={inputClass(step1Errors.phone)} value={step1Data.phone} onChange={handleStep1Change} />
                    <FieldError msg={step1Errors.phone} />
                  </div>

                  <div>
                    <input name="password" placeholder="Password *" type="password" className={inputClass(step1Errors.password)} value={step1Data.password} onChange={handleStep1Change} />
                    <FieldError msg={step1Errors.password} />
                  </div>

                  <div>
                    <input name="currentProfession" placeholder="Current Profession *" className={inputClass(step1Errors.currentProfession)} value={step1Data.currentProfession} onChange={handleStep1Change} />
                    <FieldError msg={step1Errors.currentProfession} />
                  </div>

                  <div>
                    <input name="organization" placeholder="Organization *" className={inputClass(step1Errors.organization)} value={step1Data.organization} onChange={handleStep1Change} />
                    <FieldError msg={step1Errors.organization} />
                  </div>
                </div>

                <div>
                  <textarea name="experience" placeholder="Experience Details *" rows="4" className={inputClass(step1Errors.experience)} value={step1Data.experience} onChange={handleStep1Change} />
                  <FieldError msg={step1Errors.experience} />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-blue-800">📝 Step 1 of 2: Please provide your basic information.</p>
                </div>

                <button type="submit" className="w-full bg-green-600 text-white py-2 md:py-3 rounded-lg hover:bg-green-700 transition" disabled={loading}>
                  {loading ? "Processing..." : "Next: Upload Documents →"}
                </button>
              </form>
            )}

            {/* ── STEP 2 — same fields as original, validation + API calls here ── */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <h2 className="text-lg md:text-xl font-bold text-green-600 mb-4">Teacher Registration - Document Upload</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload CV/Resume (PDF, DOC) *</label>
                  <input type="file" name="cv" accept=".pdf,.doc,.docx" onChange={handleFileChange} className={`w-full border rounded-lg p-2 md:p-3 text-sm ${step2Errors.cv ? "border-red-400" : "border-gray-300"}`} />
                  <FieldError msg={step2Errors.cv} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NID/Passport Photo *</label>
                  <input type="file" name="nidPhoto" accept="image/*" onChange={handleFileChange} className={`w-full border rounded-lg p-2 md:p-3 text-sm ${step2Errors.nidPhoto ? "border-red-400" : "border-gray-300"}`} />
                  <FieldError msg={step2Errors.nidPhoto} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture *</label>
                  <input type="file" name="profilePhoto" accept="image/*" onChange={handleFileChange} className={`w-full border rounded-lg p-2 md:p-3 text-sm ${step2Errors.profilePhoto ? "border-red-400" : "border-gray-300"}`} />
                  <FieldError msg={step2Errors.profilePhoto} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID Card *</label>
                  <input type="file" name="organizationIdCard" accept="image/*,.pdf" onChange={handleFileChange} className={`w-full border rounded-lg p-2 md:p-3 text-sm ${step2Errors.organizationIdCard ? "border-red-400" : "border-gray-300"}`} />
                  <FieldError msg={step2Errors.organizationIdCard} />
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition">← Back</button>
                  <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .transition { transition: all 0.3s ease; }
      `}</style>
    </>
  );
}
