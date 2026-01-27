"use client";

import { useState, useEffect } from "react";
import { Play, X, CheckCircle } from "lucide-react";
import { createPortal } from "react-dom";
import ConfirmModal from "@/components/ConfirmModal";
import { trackWatch } from "@/app/actions";
import { useRef } from "react";

// Removed unused props: movieOverview, userId
export default function MoviePlayer({ tmdbId, imdbId, originalLanguage, runtime }: {
  tmdbId: number;
  imdbId?: string;
  originalLanguage?: string;
  runtime?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [canManualFinish, setCanManualFinish] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    let interval: NodeJS.Timeout;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (!startTimeRef.current) startTimeRef.current = Date.now();

      interval = setInterval(() => {
        if (!startTimeRef.current) return;

        const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
        const effectiveRuntime = runtime && runtime > 0 ? runtime : 90;

        // Show manual finish option after 15 seconds for 'skippers'
        if (elapsedMinutes >= 0.25 && !canManualFinish) {
          setCanManualFinish(true);
        }

        if (elapsedMinutes >= (effectiveRuntime * 0.9)) {
          trackWatch(tmdbId, 'finished').catch(console.error);
          setIsOpen(false);
        }
      }, 10000); // Check every 10s for more responsiveness

    } else {
      document.body.style.overflow = "unset";
      if (startTimeRef.current && runtime) {
        const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
        const effectiveRuntime = runtime && runtime > 0 ? runtime : 90;
        if (elapsedMinutes >= (effectiveRuntime * 0.9)) {
          trackWatch(tmdbId, 'finished').catch(console.error);
        }
      }
      startTimeRef.current = null;
      setCanManualFinish(false);
    }

    return () => {
      document.body.style.overflow = "unset";
      if (interval) clearInterval(interval);
    };
  }, [isOpen, runtime, tmdbId, canManualFinish]);

  const toggleModal = () => {
    if (!tmdbId && !imdbId) {
      setIsErrorOpen(true);
      return;
    }

    if (!isOpen) {
      trackWatch(tmdbId, 'watching').catch(console.error);
    }
    setIsOpen(!isOpen);
  };

  const handleManualFinish = () => {
    trackWatch(tmdbId, 'finished').catch(console.error);
    setIsOpen(false);
  };

  const videoUrl = imdbId
    ? `https://vidsrc.cc/v2/embed/movie/${imdbId}`
    : `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;

  const modalContent = isOpen && (
    <div className="player-modal-overlay" onClick={toggleModal}>
      <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="player-header">
          <div className="header-left">
            <div className="player-status-tag">
              <span className="dot animate-pulse"></span>
              Watching Now
            </div>
            {canManualFinish && (
              <button
                className="smart-finish-btn"
                onClick={handleManualFinish}
                title="I've finished watching"
              >
                <CheckCircle size={16} />
                Finish
              </button>
            )}
          </div>
          <button className="close-player-btn" onClick={toggleModal}>
            <X size={24} />
          </button>
        </div>

        <div className="video-wrapper">
          <iframe
            src={videoUrl}
            title="Full Movie Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
          ></iframe>
        </div>
      </div>
    </div>
  );

  const isBollywood = originalLanguage === "hi";

  return (
    <>
      <button
        className={`action-btn play-now-btn ${isBollywood ? 'disabled-btn' : ''}`}
        onClick={isBollywood ? undefined : toggleModal}
        style={isBollywood ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
      >
        <Play size={20} fill={isBollywood ? "gray" : "white"} />
        {isBollywood ? "Regional Lock" : "Play Now"}
      </button>

      {isBollywood && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
          *Server limited to Hollywood/Global
        </span>
      )}

      {mounted && createPortal(modalContent, document.body)}

      <ConfirmModal
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        title="Playback Unavailable"
        message="This movie is currently unavailable for playback on our primary server. Please try again later."
        variant="info"
        mode="alert"
        confirmLabel="Understood"
      />
    </>
  );
}
