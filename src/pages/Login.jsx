

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

export default function Login() {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!loginForm.email || !loginForm.password) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/teachers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok && data.message === "Login Success") {
        // Save user data
        localStorage.setItem("userId", data.id);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userStatus", data.status);

        // Role-based redirect
        if (data.role === "TEACHER") {
          navigate("/teacher-dashboard");
        } else if (data.role === "STUDENT") {
          navigate("/student-dashboard");
        } else if (data.role === "ADMIN") {
          navigate("/admin/teachers");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.message || "Invalid credentials or not approved yet");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-green-700">Welcome Back!</h2>
          <p className="text-gray-500 mt-1">Login to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Extra links */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <button 
              onClick={() => navigate("/")}
              className="text-green-600 hover:underline"
            >
              Go to Home
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}