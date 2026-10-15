"use client";

import { useRef, useState } from "react";
import TopoTexture from "./TopoTexture";
import { useWatched } from "@/lib/watched";
import { useMediaUrl } from "@/lib/media";

interface VideoSlotProps {
  title: string;
  /** YouTube/Vimeo embed URL; leave undefined until the video is recorded */
  embedUrl?: string;
  /** Locally hosted video file, e.g. /videos/fish-and-water.mp4 */
  videoSrc?: string;
  /** Poster image shown before play */
  poster?: string;
  /** Stable id that turns on the "Watched" badge and remembers the state */
  watchId?: string;
}

/** the brand gradient used for every video's opening screen */
const GRADIENT =
  "bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary";

function PlayGlyph() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/70">
      <svg
        viewBox="0 0 24 24"
        className="ml-1 h-7 w-7 fill-white"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}

export default function VideoSlot({
  title,
  embedUrl,
  videoSrc,
  poster,
  watchId,
}: VideoSlotProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [watched, setWatched] = useWatched(watchId ?? "");
  // a local file is protected media: signed by assignment (lib/media)
  const { url: signedSrc, state } = useMediaUrl(videoSrc);

  const isPlayable = Boolean(signedSrc || embedUrl);

  function start() {
    setStarted(true);
    videoRef.current?.play().catch(() => {});
  }

  const watchedControl =
    watchId && isPlayable ? (
      <button
        onClick={() => setWatched(!watched)}
        aria-pressed={watched}
        className={`mt-3 flex items-center gap-2.5 rounded-md border px-4 py-2 text-sm transition ${
          watched
            ? "border-brass bg-brass/10 text-navy"
            : "border-navy/25 bg-paper text-navy/80 hover:border-navy/60"
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
            watched ? "bg-accent text-white" : "border border-navy/40"
          }`}
          aria-hidden="true"
        >
          {watched ? "✓" : ""}
        </span>
        {watched ? "Watched" : "I've watched this video"}
      </button>
    ) : null;

  let media: React.ReactNode;

  if (videoSrc && signedSrc) {
    media = (
      <div className={`relative aspect-video w-full overflow-hidden rounded-xl ${GRADIENT}`}>
        <video
          ref={videoRef}
          controls={started}
          preload="metadata"
          poster={poster}
          title={title}
          onEnded={() => watchId && setWatched(true)}
          className="h-full w-full"
          src={signedSrc}
        />
        {!started && (
          <button
            onClick={start}
            aria-label={`Play ${title}`}
            className={`absolute inset-0 flex items-center justify-center ${GRADIENT}`}
          >
            <TopoTexture opacity={0.09} variant={2} />
            <PlayGlyph />
          </button>
        )}
      </div>
    );
  } else if (embedUrl) {
    media = (
      <div className={`aspect-video w-full overflow-hidden rounded-xl ${GRADIENT}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  } else if (videoSrc && state === "loading") {
    // the signed URL is on its way; the same opening screen, no message
    media = (
      <div
        className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl ${GRADIENT}`}
        aria-busy="true"
      >
        <TopoTexture opacity={0.09} variant={2} />
        <PlayGlyph />
      </div>
    );
  } else {
    media = (
      <div
        className={`relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl text-white ${GRADIENT}`}
      >
        <TopoTexture opacity={0.09} variant={2} />
        <PlayGlyph />
        <div className="relative text-center">
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-white/60">
            {videoSrc
              ? "This video opens with the module. Ask your coach if you expected it here."
              : "Video coming soon. Kirk is recording this walkthrough"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {media}
      {watchedControl}
    </div>
  );
}
