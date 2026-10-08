// components/LandingVideoSection.jsx
// Home page video — uploaded (or linked) by the admin from /admin/site-settings (Thymeleaf).
import React, { useEffect, useState } from "react";
import { API_BASE, getVideoSource, getVideoPoster } from "../utils/courseMeta";

// Fills the 16:9 box with explicit offsets (no `inset-0`, which old browsers ignore).
const fill = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };

// Old phone browsers (UC / Oppo / Realme / old WebView) take over <iframe>/<video> with their
// own native layer, which floats out of the frame. They can't be fixed with CSS, so on those
// browsers the play button opens the video directly (YouTube app / new tab) instead of embedding.
// Modern browsers support `aspect-ratio`, so that is used as the check.
const isLegacyBrowser = () => {
  try {
    return !(window.CSS && window.CSS.supports && window.CSS.supports("aspect-ratio", "16 / 9"));
  } catch (e) {
    return true;
  }
};

export default function LandingVideoSection() {
  const [video, setVideo] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [legacy] = useState(isLegacyBrowser);

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
  const isYouTube = !!source?.src && /youtube\.com\/embed\//.test(source.src);
  // playsinline keeps YouTube inside the box on mobile
  const iframeSrc = source?.src
    ? isYouTube
      ? `${source.src}${source.src.includes("?") ? "&" : "?"}playsinline=1&modestbranding=1`
      : source.src
    : "";

  // Play-button cover (poster + big white play icon). Shared by the button and the legacy link.
  const cover = (
    <>
      {poster && (
        <img
          src={poster}
          alt=""
          onError={() => setPosterFailed(true)}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <span style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.25)" }} />
      <span className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-2xl">
        <span className="ml-1.5 w-0 h-0 border-y-[14px] border-y-transparent border-l-[24px] border-l-green-600 md:border-y-[16px] md:border-l-[28px]" />
      </span>
    </>
  );
  const coverStyle = {
    ...fill,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    background: poster ? "#000" : "linear-gradient(135deg,#15803d,#052e16)",
  };

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

        {/* Green frame. Keep everything inside it free of overflow-hidden / border-radius /
            transforms on the player itself — those make some phones misplace the video layer. */}
        <div className="rounded-3xl p-2 md:p-3 bg-gradient-to-br from-green-500 via-green-600 to-green-800 shadow-xl">
          {/* 16:9 box: padding-bottom trick (works on every mobile browser) */}
          <div style={{ position: "relative", width: "100%", height: 0, paddingBottom: "56.25%", backgroundColor: "#000" }}>
            {!loaded ? (
              <div className="animate-pulse bg-gray-800" style={fill} />
            ) : legacy ? (
              // Legacy phone browser: no embedded player → open the video itself
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Play video"
                style={coverStyle}
              >
                {cover}
              </a>
            ) : playing || (isFile && !poster) ? (
              isFile ? (
                <video
                  src={video.videoUrl}
                  poster={poster || undefined}
                  controls
                  autoPlay={playing}
                  playsInline
                  preload="metadata"
                  style={{ ...fill, backgroundColor: "#000", objectFit: "contain" }}
                />
              ) : (
                <iframe
                  src={iframeSrc}
                  title={video.title || "ShikkhaHub video"}
                  style={fill}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
                style={coverStyle}
                aria-label="Play video"
              >
                {cover}
              </button>
            )}
          </div>
        </div>

        {/* Always-available fallback if the embed misbehaves on any phone */}
        {loaded && video?.videoUrl && (
          <p className="text-center mt-4">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-700 hover:text-green-800 underline"
            >
              {isYouTube ? "YouTube-এ দেখুন" : "Video আলাদা ট্যাবে দেখুন"}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}