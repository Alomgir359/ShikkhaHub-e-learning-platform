

import React, { useState, useEffect } from "react";
import CourseCard from "../components/CourseCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useSearchParams } from "react-router-dom";
import { courseTypeOf,API_BASE } from "../utils/courseMeta";

const TYPE_TABS = [
  { key: "all", label: "All courses", short: "All" },
  { key: "live", label: "Live courses", short: "Live" },
  { key: "offline", label: "Offline batches", short: "Offline" },
  { key: "recorded", label: "Recorded courses", short: "Recorded" },
];

export default function Courses() {
  const [category, setCategory] = useState("All");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(["All"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = (searchParams.get("type") || "all").toLowerCase();
  const courseType = ["live", "offline", "recorded"].includes(typeParam) ? typeParam : "all";

  const setCourseType = (key) => {
    if (key === "all") searchParams.delete("type");
    else searchParams.set("type", key);
    setSearchParams(searchParams, { replace: true });
  };

  // Fetch all courses from backend
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/courses/published`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        
        // Extract unique categories from courses
        const uniqueCategories = ["All", ...new Set(data.map(course => course.category).filter(cat => cat))];
        setCategories(uniqueCategories);
      } else {
        setError("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on selected category
  const filteredCourses = courses
    .filter((course) => category === "All" || course.category === category)
    .filter((course) => courseType === "all" || courseTypeOf(course) === courseType.toUpperCase());

  const typeCount = (key) =>
    key === "all" ? courses.length : courses.filter((c) => courseTypeOf(c) === key.toUpperCase()).length;

  // Loading State
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-600 text-xl">{error}</p>
            <button 
              onClick={fetchCourses}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      {/* 🔥 HERO + CATEGORY */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-8 sm:py-12">
        <div className="text-center mb-6 sm:mb-8 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold">Explore Courses</h1>
          <p className="mt-2 text-gray-100 text-sm sm:text-base">
            Upgrade your skills with our professional courses
          </p>
        </div>

        <div className="flex justify-center px-4 mb-6">
          <div role="tablist" aria-label="Course type" className="grid grid-cols-2 sm:inline-flex sm:flex-wrap sm:justify-center gap-1 w-full max-w-md sm:max-w-none sm:w-auto bg-white/10 p-1 rounded-2xl sm:rounded-full">
            {TYPE_TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={courseType === t.key}
                onClick={() => setCourseType(t.key)}
                className={`px-3 md:px-5 py-2.5 sm:py-2 rounded-xl sm:rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  courseType === t.key ? "bg-white text-green-700 shadow" : "text-white hover:bg-white/10"
                }`}
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>{" "}
                <span className="opacity-70">({typeCount(t.key)})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 sm:gap-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-medium transition duration-300 ${
                category === cat
                  ? "bg-white text-green-700 shadow-lg scale-105"
                  : "bg-white/20 hover:bg-white hover:text-green-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* CURVE EFFECT */}
      <div className="bg-white h-10 rounded-t-[50px] -mt-5"></div>

      {/* COURSES GRID */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-20 py-10">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Courses Found</h3>
            <p className="text-gray-500">
              {category === "All" && courseType === "all"
                ? "No courses available at the moment."
                : "No courses match these filters."}
            </p>
            {(category !== "All" || courseType !== "all") && (
              <button
                onClick={() => { setCategory("All"); setCourseType("all"); }}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                View All Courses
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}