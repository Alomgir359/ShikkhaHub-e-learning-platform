// components/LandingVideoSection.jsx
// Home page video — uploaded (or linked) by the admin from /admin/site-settings (Thymeleaf).
import React, { useEffect, useState } from "react";
import { API_BASE, getVideoSource, getVideoPoster } from "../utils/courseMeta";

// Fills the 16:9 box. Explicit top/left/width/height (instead of `inset-0`) so old
// mobile browsers / WebViews place it correctly.
const fill = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };
const RADIUS = 16;

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
  const isYouTube = !!source?.src && /youtube\.com\/embed\//.test(source.src);
  // playsinline keeps YouTube inside the box on mobile instead of jumping to its own layer
  const iframeSrc = source?.src
    ? isYouTube
      ? `${source.src}${source.src.includes("?") ? "&" : "?"}playsinline=1&modestbranding=1`
      : source.src
    : "";

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

        {/* Green frame. No overflow-hidden / clipping here: clipping a parent with
            border-radius is what makes the native video layer slide out of the box on
            some Android browsers. Rounded corners are put on the player itself. */}
        <div
          className="relative rounded-3xl p-2 md:p-3 bg-gradient-to-br from-green-500 via-green-600 to-green-800 shadow-xl"
          style={{ isolation: "isolate" }}
        >
          {/* 16:9 box: padding-bottom trick (works on every mobile browser) */}
          <div style={{ position: "relative", width: "100%", height: 0, paddingBottom: "56.25%", backgroundColor: "#000", borderRadius: RADIUS }}>
            {!loaded ? (
              <div className="animate-pulse bg-gray-800" style={{ ...fill, borderRadius: RADIUS }} />
            ) : playing || (isFile && !poster) ? (
              isFile ? (
                <video
                  src={video.videoUrl}
                  poster={poster || undefined}
                  controls
                  autoPlay={playing}
                  playsInline
                  preload="metadata"
                  style={{ ...fill, backgroundColor: "#000", borderRadius: RADIUS, objectFit: "contain" }}
                />
              ) : (
                <iframe
                  src={iframeSrc}
                  title={video.title || "ShikkhaHub video"}
                  style={{ ...fill, borderRadius: RADIUS }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
                style={{
                  ...fill,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  borderRadius: RADIUS,
                  background: poster ? "#000" : "linear-gradient(135deg,#15803d,#052e16)",
                }}
                aria-label="Play video"
              >
                {poster && (
                  <img
                    src={poster}
                    alt=""
                    onError={() => setPosterFailed(true)}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <span style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.25)" }} />
                <span
                  className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-2xl"
                >
                  <span className="ml-1.5 w-0 h-0 border-y-[14px] border-y-transparent border-l-[24px] border-l-green-600 md:border-y-[16px] md:border-l-[28px]" />
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Fallback for phones whose browser can't play the embed inline */}
        {loaded && isYouTube && video?.videoUrl && (
          <p className="text-center mt-4">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-700 hover:text-green-800 underline"
            >
              Video ঠিকমতো না চললে YouTube-এ দেখুন
            </a>
          </p>
        )}
      </div>
    </section>
  );
}