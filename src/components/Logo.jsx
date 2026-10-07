import React from "react";
import { FaBookOpen } from "react-icons/fa";

// ShikkhaHub logo: green rounded square with an open book + "Shikkha" / "Hub" wordmark.
// Use `dark` when placing it on a dark background.
export default function Logo({ dark = false, size = "md" }) {
  const box = size === "lg" ? "w-12 h-12 text-2xl" : size === "sm" ? "w-8 h-8 text-base" : "w-10 h-10 text-xl";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl md:text-2xl";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`${box} flex items-center justify-center rounded-lg bg-green-500 text-gray-900 shadow-sm`}>
        <FaBookOpen />
      </span>
      <span className={`${text} font-extrabold tracking-tight`}>
        <span className={dark ? "text-white" : "text-gray-800"}>Shikkha</span>
        <span className="text-green-500">Hub</span>
      </span>
    </span>
  );
}
