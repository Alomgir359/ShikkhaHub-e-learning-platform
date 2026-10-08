// components/LandingVideoSection.jsx
// Home page video — uploaded (or linked) by the admin from /admin/site-settings (Thymeleaf).
import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/courseMeta";
import SmartVideoPlayer from "./SmartVideoPlayer";

export default function LandingVideoSection() {
  const [video, setVideo] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/site/landing-video`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setVideo(d))
      .catch(() => alive && setVideo(null))
      .finally(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, []);

  // Nothing configured (or turned off) → no empty section on the page
  if (loaded && (!video || !video.enabled || !video.videoUrl)) return null;

  return (
    <section className="relative bg-gray-100 py-14 md:py-20" aria-labelledby="landing-video-title">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Watch</span>
          <h2 id="landing-video-title" className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
            {video?.title || "\u00A0"}
          </h2>
          {video?.subtitle && <p className="text-gray-600 mt-3 max-w-2xl mx-auto">{video.subtitle}</p>}
        </div>

        {/* Green frame (background only — nothing here clips the player) */}
        <div className="rounded-3xl p-2 md:p-3 bg-gradient-to-br from-green-500 via-green-600 to-green-800 shadow-xl">
          <SmartVideoPlayer
            loading={!loaded}
            url={video?.videoUrl}
            poster={video?.posterUrl}
            isFile={video?.source === "UPLOAD"}
            title={video?.title || "ShikkhaHub video"}
            variant="landing"
          />
        </div>
      </div>
    </section>
  );
}