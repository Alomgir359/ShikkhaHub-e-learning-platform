import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import LandingVideoSection from "../components/LandingVideoSection";
import { ConceptExplorerSection, DifferenceSection, MethodSection, SyllabusSection } from "../components/ShikkhaHubSections";
import { HeroCodeWindow, WhyShikkhaHubSection } from "../components/LandingHighlights";
import { API_BASE } from "../utils/courseMeta";
export default function Welcome() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [tempId, setTempId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // State for dynamic courses
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  // State for stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    satisfaction: 98
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Validation error states for Step 1
  const [step1Errors, setStep1Errors] = useState({});
  
  // Step 1 Form Data
  const [step1Data, setStep1Data] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    currentProfession: "",
    organization: "",
    experience: ""
  });
  
  // Step 2 File Data
  const [step2Files, setStep2Files] = useState({
    cv: null,
    nidPhoto: null,
    profilePhoto: null,
    organizationIdCard: null
  });

  // Validation error states for Step 2
  const [step2Errors, setStep2Errors] = useState({});

  const [testimonials] = useState([
    {
      name: "Rahim Uddin",
      role: "CSE Student, 3rd Year",
      comment: "I finally understand what recursion and pointers actually do in memory. Moving from Python to C++ took me one week instead of a whole semester.",
      rating: 5,
      avatar: "https://i.pravatar.cc/100?img=1"
    },
    {
      name: "Fatima Begum",
      role: "Junior Developer",
      comment: "Other courses taught me syntax. ShikkhaHub taught me how to think. Now I pick up new frameworks without fear.",
      rating: 5,
      avatar: "https://i.pravatar.cc/100?img=2"
    },
    {
      name: "Karim Ahmed",
      role: "Self-taught Programmer",
      comment: "The 'teach it back' sessions exposed every gap in my understanding. Interviews feel much easier now.",
      rating: 4,
      avatar: "https://i.pravatar.cc/100?img=3"
    }
  ]);

  // Fetch courses from backend
  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const response = await fetch(`${API_BASE}/courses/published`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.slice(0, 6));
      } else {
        console.error("Failed to fetch courses");
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch stats from backend (students and teachers count)
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      // Fetch all teachers (which includes both TEACHER and STUDENT roles)
      const response = await fetch(`${API_BASE}/teachers/all`);
      if (response.ok) {
        const allTeachers = await response.json();
        
        // Count students (role = STUDENT)
        const students = allTeachers.filter(t => t.role === "STUDENT");
        // Count instructors/teachers (role = TEACHER and status = APPROVED)
        const instructors = allTeachers.filter(t => t.role === "TEACHER" && t.status === "APPROVED");
        
        setStats({
          totalStudents: students.length,
          totalTeachers: instructors.length,
          totalCourses: courses.length,
          satisfaction: 98
        });
      } else {
        console.error("Failed to fetch stats");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch stats when courses are loaded
  useEffect(() => {
    if (!coursesLoading) {
      fetchStats();
    }
  }, [coursesLoading, courses.length]);

  // Validation regexes
  const nameRegex = /^(?![\s.\-]+$)(?!.*\s{2,})[A-Za-z][A-Za-z\s.\-]{1,49}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
  const professionRegex = /^(?![\s,'\-]+$)(?!.*\s{2,})(?=.*[A-Za-z])[A-Za-z0-9\s,'\-]{3,100}$/;
  const organizationRegex = /^(?![\s.'\-_]+$)(?!.*\s{2,})(?=.*[A-Za-z])[A-Za-z0-9\s.'\-_]{3,150}$/;
  const experienceRegex = /^(?![\s.'\-_\[\]\/]+$)(?!.*\s{2,})(?=.*[A-Za-z])[A-Za-z0-9\s.'\-_\[\]\/]{1,1000}$/;

  // Validation functions
  const validateStep1 = () => {
    const errors = {};
    
    // Full Name validation
    if (!step1Data.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (step1Data.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    } else if (step1Data.fullName.trim().length > 50) {
      errors.fullName = "Full name must be less than 50 characters";
    } else if (!nameRegex.test(step1Data.fullName.trim())) {
      errors.fullName = "Only letters, spaces, dot (.) and hyphen (-) allowed";
    }
    
    // Email validation
    if (!step1Data.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(step1Data.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Phone validation
    if (!step1Data.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d+$/.test(step1Data.phone.trim())) {
      errors.phone = "Only digits allowed";
    } else if (step1Data.phone.trim().length !== 11) {
      errors.phone = "Mobile number must be exactly 11 digits";
    } else if (!bdPhoneRegex.test(step1Data.phone)) {
      errors.phone = "Enter a valid Bangladeshi number (e.g., 01XXXXXXXXX)";
    }
    
    // Password validation
    if (!step1Data.password) {
      errors.password = "Password is required";
    } else if (!passwordRegex.test(step1Data.password)) {
      errors.password = "Must be 8–64 chars with uppercase, lowercase, number & special character";
    }
    
    // Current Profession validation
    if (!step1Data.currentProfession.trim()) {
      errors.currentProfession = "Current profession is required";
    } else if (!professionRegex.test(step1Data.currentProfession.trim())) {
      errors.currentProfession = "Must contain at least one letter. Only letters, numbers, spaces, commas, apostrophes, hyphen allowed";
    }
    
    // Organization validation
    if (!step1Data.organization.trim()) {
      errors.organization = "Organization is required";
    } else if (!organizationRegex.test(step1Data.organization.trim())) {
      errors.organization = "Must contain at least one letter. Only letters, numbers, spaces, dot, apostrophe, underscore, hyphen allowed";
    }
    
    // Experience validation (optional but if provided must be valid)
    if (step1Data.experience.trim() && step1Data.experience.trim().length > 1000) {
      errors.experience = "Experience details must not exceed 1000 characters";
    } else if (step1Data.experience.trim() && !experienceRegex.test(step1Data.experience.trim())) {
      errors.experience = "Must contain at least one letter. No multiple adjacent spaces or only special characters";
    }
    
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    // CV validation
    if (!step2Files.cv) {
      errors.cv = "CV/Resume is required";
    } else {
      const fileType = step2Files.cv.type;
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(fileType)) {
        errors.cv = "Please upload PDF, DOC, or DOCX file";
      }
      if (step2Files.cv.size > 5 * 1024 * 1024) {
        errors.cv = "File size must be less than 5MB";
      }
    }
    
    // NID Photo validation
    if (!step2Files.nidPhoto) {
      errors.nidPhoto = "NID/Passport photo is required";
    } else {
      const fileType = step2Files.nidPhoto.type;
      if (!fileType.startsWith('image/')) {
        errors.nidPhoto = "Please upload an image file";
      }
      if (step2Files.nidPhoto.size > 2 * 1024 * 1024) {
        errors.nidPhoto = "File size must be less than 2MB";
      }
    }
    
    // Profile Photo validation
    if (!step2Files.profilePhoto) {
      errors.profilePhoto = "Profile picture is required";
    } else {
      const fileType = step2Files.profilePhoto.type;
      if (!fileType.startsWith('image/')) {
        errors.profilePhoto = "Please upload an image file";
      }
      if (step2Files.profilePhoto.size > 2 * 1024 * 1024) {
        errors.profilePhoto = "File size must be less than 2MB";
      }
    }
    
    // Organization ID Card validation
    if (!step2Files.organizationIdCard) {
      errors.organizationIdCard = "Organization ID card is required";
    } else {
      const fileType = step2Files.organizationIdCard.type;
      if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
        errors.organizationIdCard = "Please upload an image or PDF file";
      }
      if (step2Files.organizationIdCard.size > 2 * 1024 * 1024) {
        errors.organizationIdCard = "File size must be less than 2MB";
      }
    }
    
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Change = (e) => {
    setStep1Data({
      ...step1Data,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user starts typing
    if (step1Errors[e.target.name]) {
      setStep1Errors({
        ...step1Errors,
        [e.target.name]: ""
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setStep2Files({
      ...step2Files,
      [e.target.name]: file
    });
    // Clear error for this field when user selects a file
    if (step2Errors[e.target.name]) {
      setStep2Errors({
        ...step2Errors,
        [e.target.name]: ""
      });
    }
  };

  // Step 1 Submit - Basic Info (NO API CALL, just validation and go to step 2)
  const handleStep1Submit = (e) => {
    e.preventDefault();
    
    // Validate step 1 fields
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Step 2 Submit - Upload documents AND save to database (SAME AS NAVBAR)
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    // Validate step 2 fields (documents)
    if (!validateStep2()) {
      return;
    }
    
    setLoading(true);

    try {
      // API Call 1: Step 1 - same as Navbar
      const response = await fetch(`${API_BASE}/teachers/apply/step1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(step1Data)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newTempId = data.tempId;
        setTempId(newTempId);

        // API Call 2: Step 2 - Upload files
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
          
          // Refresh stats after new teacher registration
          fetchStats();
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

  const resetModal = () => {
    setStep(1);
    setTempId(null);
    setStep1Data({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      currentProfession: "",
      organization: "",
      experience: ""
    });
    setStep2Files({
      cv: null,
      nidPhoto: null,
      profilePhoto: null,
      organizationIdCard: null
    });
    setStep1Errors({});
    setStep2Errors({});
    setOpen(false);
  };

  // Auto-scroll to courses section
  const scrollToCourses = () => {
    document.getElementById("courses-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper function to get image emoji or icon based on category (kept for future use)
  // eslint-disable-next-line no-unused-vars
  const getCourseIcon = (category) => {
    const icons = {
      "Finance": "🏦",
      "Banking": "🏦",
      "Islamic Banking": "🕌",
      "Law": "⚖️",
      "Skill": "💬",
      "Technology": "💻",
      "Tech": "💻",
      "Management": "👔",
      "Programming": "💻",
      "Programming Fundamentals": "🧠",
      "Data Structures": "🌳",
      "Algorithms": "📈",
      "Web Development": "🌐",
      "Databases": "🗄️",
      "AI & Machine Learning": "🤖",
      "Risk Management": "📊",
      "Compliance": "📋"
    };
    return icons[category] || "📚";
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">

      <Navbar />

      {/* SUCCESS TOAST */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold">Registration Successful!</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* ERROR TOAST */}
      {showError && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-semibold">Registration Failed</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-900 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto pt-10 pb-6 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: text */}
            <div className="min-w-0 animate-fade-in-up text-center lg:text-left">
              <span className="inline-block max-w-full bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-2xl sm:rounded-full text-xs sm:text-sm leading-snug mb-4">
                🧠 মুখস্থ নয়, বোঝা — Think deeply, code in any language
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold mb-4 leading-tight break-words">
                Learn Deeply with <span className="text-yellow-300">ShikkhaHub</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto lg:mx-0">
                গভীর থিওরি শিখুন, গভীরভাবে ভাবতে শিখুন — তারপর যেকোনো প্রোগ্রামিং ল্যাঙ্গুয়েজে সহজেই শিফট করুন
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  onClick={scrollToCourses}
                  className="w-full sm:w-auto justify-center bg-white text-green-700 px-8 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg hover:shadow-2xl flex items-center gap-2"
                >
                  <span>🎓</span> Explore Courses
                </button>
                <button
                  onClick={() => setOpen(true)}
                  className="w-full sm:w-auto justify-center bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-green-700 transition flex items-center gap-2"
                >
                  <span>👨‍🏫</span> Join as Teacher
                </button>
              </div>
            </div>

            {/* Right: programming visual */}
            <div className="min-w-0 w-full">
              <HeroCodeWindow />
            </div>
          </div>

          {/* Stats Bar - Dynamic from Database */}
          <div className="mt-10 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto pb-16 sm:pb-24 md:pb-32">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold">{statsLoading ? "..." : stats.totalCourses}</div>
              <div className="text-sm opacity-90">Courses</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold">{statsLoading ? "..." : stats.totalStudents}+</div>
              <div className="text-sm opacity-90">Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold">{statsLoading ? "..." : stats.totalTeachers}+</div>
              <div className="text-sm opacity-90">Instructors</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold">{stats.satisfaction}%</div>
              <div className="text-sm opacity-90">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute -bottom-px left-0 w-full pointer-events-none" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="block w-full h-auto">
            <path fill="#f3f4f6" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* LANDING VIDEO — uploaded by admin from /admin/site-settings */}
      <LandingVideoSection />

      {/* COURSES SECTION - DYNAMIC */}
      <div id="courses-section" className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Our Offerings</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">Popular Courses</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Every course follows the ShikkhaHub 5-step method</p>
          </div>

          {coursesLoading ? (
            // Loading skeleton
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 h-32"></div>
                  <div className="p-5">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            // No courses message
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Courses Available</h3>
              <p className="text-gray-500">Check back later for new courses.</p>
            </div>
          ) : (
            // Course Grid — same card as the Courses page (Live / Offline / Recorded, start date, price)
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/courses">
              <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition shadow-lg hover:shadow-xl">
                Browse All Courses
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Why Choose Us</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">Platform Features</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Not just another course site — a different way of learning</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              title: "Deep Theory First", 
              desc: "We start with why an idea exists and how it works inside the computer — before writing a single line of code.",
              icon: "🧠",
              color: "from-blue-500 to-blue-600"
            },
            { 
              title: "Language-Agnostic Thinking", 
              desc: "Learn the concept once and apply it in Python, JavaScript, C++, Java or Go. Switching languages becomes easy.",
              icon: "🔄",
              color: "from-purple-500 to-purple-600"
            },
            { 
              title: "Learn by Explaining", 
              desc: "Teach-back sessions where you explain concepts in Bangla or English — the fastest way to find and fix gaps.",
              icon: "🗣️",
              color: "from-green-500 to-green-600"
            },
          ].map((item, i) => (
            <div key={i} className="group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color}`}></div>
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SHIKKHAHUB: ONE CONCEPT, ANY LANGUAGE */}
      <ConceptExplorerSection />

      {/* SHIKKHAHUB: TYPICAL VS SHIKKHAHUB */}
      <DifferenceSection />

      {/* WHY LEARN WITH SHIKKHAHUB — 1-to-1 Mentorship + sliding feature cards */}
      <WhyShikkhaHubSection />

      {/* SHIKKHAHUB: 5-STEP METHOD */}
      <MethodSection />

      {/* SHIKKHAHUB: DEEP THEORY SYLLABUS */}
      <SyllabusSection />

      {/* TESTIMONIALS SECTION */}
      <div className="bg-gradient-to-br from-green-700 to-green-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-green-200 font-semibold text-sm uppercase tracking-wide">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">What Our Students Say</h2>
            <p className="text-green-100 mt-4 max-w-2xl mx-auto">Learners who stopped memorizing and started understanding</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition">
                <div className="flex items-center gap-4 mb-4">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full border-2 border-white" />
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-green-200">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-${i < testimonial.rating ? 'yellow-300' : 'gray-400'} text-lg`}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-white/90">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Learn One Idea Properly?
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            Stop memorizing syntax. Start understanding — with ShikkhaHub.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/courses">
              <button className="bg-white text-green-700 px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition transform hover:scale-105">
                Enroll Now
              </button>
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-green-700 transition"
            >
              Become an Instructor
            </button>
          </div>
        </div>
      </div>

      {/* TEACHER REGISTRATION MODAL - TWO STEP */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-green-700">Teacher Registration</h2>
                <p className="text-sm text-gray-500 mt-1">Join our expert teaching community</p>
              </div>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-red-500 transition text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✖
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex px-6 pt-4">
              <div className={`flex-1 text-center pb-2 border-b-2 ${step === 1 ? 'border-green-600 text-green-600' : 'border-gray-300 text-gray-500'}`}>
                Step 1: Personal Info
              </div>
              <div className={`flex-1 text-center pb-2 border-b-2 ${step === 2 ? 'border-green-600 text-green-600' : 'border-gray-300 text-gray-500'}`}>
                Step 2: Documents Upload
              </div>
            </div>

            {step === 1 ? (
              // Step 1 Form - Basic Information (No API Call)
              <form onSubmit={handleStep1Submit} className="p-6 space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg mb-2">
                  <p className="text-xs text-blue-800">
                    📝 Step 1 of 2: Please provide your basic information. Your account will be created after document upload in Step 2.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={step1Data.fullName}
                      onChange={handleStep1Change}
                      className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        step1Errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {step1Errors.fullName && (
                      <p className="text-red-500 text-xs mt-1">{step1Errors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={step1Data.email}
                      onChange={handleStep1Change}
                      className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        step1Errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="teacher@example.com"
                    />
                    {step1Errors.email && (
                      <p className="text-red-500 text-xs mt-1">{step1Errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={step1Data.phone}
                      onChange={handleStep1Change}
                      className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        step1Errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="01XXXXXXXXX"
                    />
                    {step1Errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{step1Errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={step1Data.password}
                      onChange={handleStep1Change}
                      className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        step1Errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    {step1Errors.password && (
                      <p className="text-red-500 text-xs mt-1">{step1Errors.password}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Profession *</label>
                  <input
                    type="text"
                    name="currentProfession"
                    value={step1Data.currentProfession}
                    onChange={handleStep1Change}
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      step1Errors.currentProfession ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Banker, Teacher, Accountant"
                  />
                  {step1Errors.currentProfession && (
                    <p className="text-red-500 text-xs mt-1">{step1Errors.currentProfession}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                  <input
                    type="text"
                    name="organization"
                    value={step1Data.organization}
                    onChange={handleStep1Change}
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      step1Errors.organization ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your organization name"
                  />
                  {step1Errors.organization && (
                    <p className="text-red-500 text-xs mt-1">{step1Errors.organization}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Details</label>
                  <textarea
                    name="experience"
                    value={step1Data.experience}
                    onChange={handleStep1Change}
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      step1Errors.experience ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Share your teaching/professional experience..."
                    rows="3"
                  />
                  {step1Errors.experience && (
                    <p className="text-red-500 text-xs mt-1">{step1Errors.experience}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition"
                >
                  Next: Upload Documents →
                </button>
              </form>
            ) : (
              // Step 2 Form - File Uploads (Final submission saves to database)
              <form onSubmit={handleStep2Submit} className="p-6 space-y-4">
                <div className="bg-yellow-50 p-3 rounded-lg mb-2">
                  <p className="text-xs text-yellow-800">
                    ⚠️ After submitting documents, your teacher account will be created. Please ensure all documents are clear and legible.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload CV/Resume (PDF, DOC) *
                  </label>
                  <input
                    type="file"
                    name="cv"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      step2Errors.cv ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {step2Errors.cv && (
                    <p className="text-red-500 text-xs mt-1">{step2Errors.cv}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NID/Passport Photo *
                  </label>
                  <input
                    type="file"
                    name="nidPhoto"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      step2Errors.nidPhoto ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {step2Errors.nidPhoto && (
                    <p className="text-red-500 text-xs mt-1">{step2Errors.nidPhoto}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG (Max 2MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture *
                  </label>
                  <input
                    type="file"
                    name="profilePhoto"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      step2Errors.profilePhoto ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {step2Errors.profilePhoto && (
                    <p className="text-red-500 text-xs mt-1">{step2Errors.profilePhoto}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG (Max 2MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization ID Card *
                  </label>
                  <input
                    type="file"
                    name="organizationIdCard"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      step2Errors.organizationIdCard ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {step2Errors.organizationIdCard && (
                    <p className="text-red-500 text-xs mt-1">{step2Errors.organizationIdCard}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG, PDF (Max 2MB)</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}