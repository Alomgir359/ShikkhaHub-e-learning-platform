// components/SmartVideoPlayer.jsx
// One 16:9 player used on the Home page and the Course Details page.
//  • poster + play button first, the real player loads only after a tap
//  • plays YouTube / Vimeo / uploaded files INSIDE the box (never redirects away)
//  • when the video ends, the player is removed and the poster comes back, so no second
//    "ghost" copy of the ended video can float above the frame on phones
import React, { useEffect, useRef, useState } from "react";
import { getVideoSource, getVideoPoster } from "../utils/courseMeta";

// Explicit offsets instead of `inset-0` (old mobile browsers ignore `inset`)
const fill = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 };

const SIZES = {
  landing: {
    circle: "w-20 h-20 md:w-24 md:h-24",
    tri: "ml-1.5 border-y-[14px] border-l-[24px] md:border-y-[16px] md:border-l-[28px] border-l-green-600",
  },
  compact: {
    circle: "w-16 h-16 md:w-20 md:h-20",
    tri: "ml-1 border-y-[12px] border-l-[20px] md:border-y-[14px] md:border-l-[24px] border-l-red-600",
  },
};

export default function SmartVideoPlayer({
  url,
  poster,
  title = "Video",
  isFile = false, // true when `url` is an uploaded file (no .mp4 extension to detect)
  variant = "landing",
  loading = false,
}) {
  const [playing, setPlaying] = useState(false);
  const [playId, setPlayId] = useState(0); // fresh player on every play
  const [posterFailed, setPosterFailed] = useState(false);
  const iframeRef = useRef(null);

  const source = url ? getVideoSource(url) : null;
  const file = isFile || source?.kind === "video";
  const fileSrc = isFile ? url : source?.src;
  const isYouTube = !!source?.src && /youtube\.com\/embed\//.test(source.src);
  const image = posterFailed ? null : poster || getVideoPoster(url);
  const size = SIZES[variant] || SIZES.landing;

  // Hear "video ended" from the YouTube player
  useEffect(() => {
    if (!playing || !isYouTube) return undefined;
    const onMessage = (e) => {
      if (!/youtube(-nocookie)?\.com$/.test((e.origin || "").replace(/^https?:\/\//, ""))) return;
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      let data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (err) { return; }
      }
      if (!data) return;
      const info = data.info || {};
      const ended =
        (data.event === "onStateChange" && data.info === 0) ||
        (data.event === "infoDelivery" && info.playerState === 0) ||
        (data.event === "infoDelivery" && info.duration > 5 && info.currentTime >= info.duration - 0.1);
      if (ended) setPlaying(false);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playing, isYouTube]);

  let origin = "";
  try { origin = encodeURIComponent(window.location.origin); } catch (e) { /* ignore */ }
  const iframeSrc = !source?.src
    ? ""
    : isYouTube
      ? `${source.src}${source.src.includes("?") ? "&" : "?"}playsinline=1&modestbranding=1&enablejsapi=1${origin ? `&origin=${origin}` : ""}`
      : source.src;

  // Ask the YouTube player to start sending its state changes to us
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
    setTimeout(send, 600);
    setTimeout(send, 1500);
    setTimeout(send, 3000);
  };

  const start = () => {
    setPlayId((n) => n + 1);
    setPlaying(true);
  };

  const showPlayer = playing || (file && !image);

  return (
    // 16:9 box via padding-bottom (works on every mobile browser).
    // No overflow-hidden / border-radius / transform here: those make some phones
    // misplace the native video layer outside the frame.
    <div style={{ position: "relative", width: "100%", height: 0, paddingBottom: "56.25%", backgroundColor: "#000" }}>
      {loading ? (
        <div className="animate-pulse bg-gray-800" style={fill} />
      ) : !source && !isFile ? null : showPlayer ? (
        file ? (
          <video
            key={playId}
            src={fileSrc}
            poster={image || undefined}
            controls
            autoPlay={playing}
            playsInline
            preload="metadata"
            controlsList="nodownload"
            onEnded={() => setPlaying(false)}
            style={{ ...fill, backgroundColor: "#000", objectFit: "contain" }}
          />
        ) : (
          <iframe
            key={playId}
            ref={iframeRef}
            src={iframeSrc}
            title={title}
            onLoad={isYouTube ? listenToPlayer : undefined}
            style={fill}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label="Play video"
          className="focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
          style={{
            ...fill,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            background: image ? "#000" : "linear-gradient(135deg,#15803d,#052e16)",
          }}
        >
          {image && (
            <img
              src={image}
              alt=""
              onError={() => setPosterFailed(true)}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <span style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.25)" }} />
          <span className={`relative flex items-center justify-center rounded-full bg-white shadow-2xl ${size.circle}`}>
            <span className={`w-0 h-0 border-y-transparent ${size.tri}`} />
          </span>
        </button>
      )}
    </div>
  );
}