"use client";

import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import { createPortal } from "react-dom";
import ConfirmModal from "@/components/ConfirmModal";

// Removed unused props: movieOverview, userId
export default function MoviePlayer({ tmdbId, imdbId, originalLanguage }: {
  tmdbId: number;
  imdbId?: string;
  originalLanguage?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const toggleModal = () => {
    if (!tmdbId && !imdbId) {
      setIsErrorOpen(true);
      return;
    }

    setIsOpen(!isOpen);
  };

  const videoUrl = imdbId
    ? `https://vidsrc.cc/v2/embed/movie/${imdbId}`
    : `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;

  const modalContent = isOpen && (
    <div className="player-modal-overlay" onClick={toggleModal}>
      <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-player-btn" onClick={toggleModal}>
          <X size={24} />
        </button>

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
