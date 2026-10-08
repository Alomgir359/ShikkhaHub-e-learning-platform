// components/LandingVideoSection.jsx
// Home page video — uploaded (or linked) by the admin from /admin/site-settings (Thymeleaf).
import React, { useEffect, useRef, useState } from "react";
import { API_BASE, getVideoSource, getVideoPoster } from "../utils/courseMeta";

// Fills the 16:9 box with explicit offsets (no `inset-0`, which old browsers ignore).
const fill = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };

// Very old phone browsers can't embed the player cleanly (their native video layer floats out
// of the frame). There the play button opens the video directly instead of embedding it.
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
  const [playId, setPlayId] = useState(0); // new key on every play → fresh player each time
  const [legacy] = useState(isLegacyBrowser);
  const iframeRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/site/landing-video`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setVideo(d))
      .catch(() => alive && setVideo(null))
      .finally(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, []);

  // When the YouTube video ENDS, remove the player and go back to the poster.
  // Otherwise some phones leave a second "ghost" copy of the ended video (with "Replay")
  // floating above the frame.
  useEffect(() => {
    if (!playing) return undefined;
    const onMessage = (e) => {
      if (!/youtube(-nocookie)?\.com$/.test((e.origin || "").replace(/^https?:\/\//, ""))) return;
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      let data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (err) { return; }
      }
      if (!data) return;
      const ended =
        (data.event === "onStateChange" && data.info === 0) ||
        (data.event === "infoDelivery" && data.info && data.info.playerState === 0);
      if (ended) setPlaying(false);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playing]);

  // Nothing configured (or turned off) → no empty section on the page
  if (loaded && (!video || !video.enabled || !video.videoUrl)) return null;

  const source = video ? getVideoSource(video.videoUrl) : null;
  // Uploaded files play in a <video> tag; getVideoSource() adds autoplay for iframes
  const isFile = video?.source === "UPLOAD" || source?.kind === "video";
  const poster = posterFailed ? null : video?.posterUrl || getVideoPoster(video?.videoUrl);
  const isYouTube = !!source?.src && /youtube\.com\/embed\//.test(source.src);
  // enablejsapi lets us hear "video ended"; playsinline keeps it inside the box on mobile
  let origin = "";
  try { origin = encodeURIComponent(window.location.origin); } catch (e) { /* ignore */ }
  const iframeSrc = source?.src
    ? isYouTube
      ? `${source.src}${source.src.includes("?") ? "&" : "?"}playsinline=1&modestbranding=1&enablejsapi=1${origin ? `&origin=${origin}` : ""}`
      : source.src
    : "";

  const startPlaying = () => {
    setPlayId((n) => n + 1);
    setPlaying(true);
  };

  // Ask the YouTube player to start sending us its state changes
  const listenToPlayer = () => {
    const send = () => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
          "*"
        );
      } catch (e) { /* ignore */ }
    };
    send();
    setTimeout(send, 800);
    setTimeout(send, 2000);
  };

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
                  key={playId}
                  src={video.videoUrl}
                  poster={poster || undefined}
                  controls
                  autoPlay={playing}
                  playsInline
                  preload="metadata"
                  onEnded={() => setPlaying(false)}
                  style={{ ...fill, backgroundColor: "#000", objectFit: "contain" }}
                />
              ) : (
                <iframe
                  key={playId}
                  ref={iframeRef}
                  src={iframeSrc}
                  title={video.title || "ShikkhaHub video"}
                  onLoad={isYouTube ? listenToPlayer : undefined}
                  style={fill}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <button
                type="button"
                onClick={startPlaying}
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