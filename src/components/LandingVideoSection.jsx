// components/LandingVideoSection.jsx
// Home page video — uploaded (or linked) by the admin from /admin/site-settings (Thymeleaf).
import React, { useEffect, useState } from "react";
import { API_BASE, getVideoSource, getVideoPoster } from "../utils/courseMeta";

export default function LandingVideoSection() {
  const [video, setVideo] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

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

  const source = video ? getVideoSource(video.videoUrl) : null;
  // Uploaded files play in a <video> tag; getVideoSource() adds autoplay for iframes
  const isFile = video?.source === "UPLOAD" || source?.kind === "video";
  const poster = posterFailed ? null : video?.posterUrl || getVideoPoster(video?.videoUrl);

  return (
    <section className="relative bg-gray-100 py-14 md:py-20" aria-labelledby="landing-video-title">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Watch</span>
          <h2 id="landing-video-title" className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
            {video?.title || "\u00A0"}
          </h2>
          {video?.subtitle && <p className="text-gray-600 mt-3 max-w-2xl mx-auto">{video.subtitle}</p>}
        </div>

        <div className="relative rounded-3xl p-2 md:p-3 bg-gradient-to-br from-green-500 via-green-600 to-green-800 shadow-2xl">
          {/* 16:9 via padding-top (works on old mobile browsers that ignore aspect-ratio) */}
          <div className="relative w-full h-0 overflow-hidden rounded-2xl bg-black" style={{ paddingTop: "56.25%" }}>
            {!loaded ? (
              <div className="absolute inset-0 animate-pulse bg-gray-800" />
            ) : playing || (isFile && !poster) ? (
              isFile ? (
                <video src={video.videoUrl} poster={poster || undefined} controls autoPlay={playing}
                  playsInline preload="metadata" className="absolute inset-0 w-full h-full bg-black" />
              ) : (
                <iframe src={source.src} title={video.title || "ShikkhaHub video"}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              )
            ) : (
              <button type="button" onClick={() => setPlaying(true)}
                className="group absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
                aria-label="Play video">
                {poster ? (
                  <img src={poster} alt="" onError={() => setPosterFailed(true)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-700 to-green-950" />
                )}
                <span className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/95 shadow-2xl group-hover:scale-110 transition-transform">
                  <span className="ml-1.5 w-0 h-0 border-y-[14px] border-y-transparent border-l-[24px] border-l-green-600 md:border-y-[16px] md:border-l-[28px]" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
