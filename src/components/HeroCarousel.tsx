"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info } from "lucide-react";

export default function HeroCarousel({ movies }: { movies: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex];

  return (
    <div className="hero-carousel">
      {movies.map((movie, index) => (
        <div
          key={movie.id}
          className={`carousel-slide ${index === currentIndex ? "active" : ""}`}
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${movie.backdrop_path})` }}
        >
          <div className="slide-overlay"></div>
          <div className="slide-content">
            <h2 className="slide-title">{movie.title}</h2>
            <p className="slide-overview">{movie.overview?.slice(0, 150)}...</p>
            <div className="slide-actions">
              <Link href={`/movies/${movie.id}`} className="play-btn">
                <Play size={24} fill="currentColor" />
                <span>Play Now</span>
              </Link>
            </div>
          </div>
        </div>
      ))}

      <div className="carousel-indicators">
        {movies.map((_, index) => (
          <button
            key={index}
            className={`indicator-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      <style jsx>{`
        .hero-carousel {
          position: relative;
          width: 100%;
          height: 85vh; /* Large hero height */
          overflow: hidden;
          margin-bottom: 40px;
        }

        .carousel-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center top;
          opacity: 0;
          transition: opacity 1s ease-in-out;
          z-index: 1;
        }

        .carousel-slide.active {
          opacity: 1;
          z-index: 2;
        }

        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(10, 10, 10, 0.8) 80%,
            #0a0a0a 100%
          );
        }

        .slide-content {
          position: absolute;
          bottom: 15%;
          left: 5%;
          max-width: 700px;
          z-index: 3;
          animation: slideUp 0.8s ease-out;
        }

        .slide-title {
          font-size: 3.5rem;
          font-weight: 900;
          color: white;
          margin-bottom: 16px;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
          line-height: 1.1;
        }

        .slide-overview {
          font-size: 1.1rem;
          color: #e5e5e5;
          margin-bottom: 32px;
          line-height: 1.6;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          max-width: 600px;
        }

        .slide-actions {
          display: flex;
          gap: 16px;
        }

        .play-btn {
          display: inline-flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 12px !important;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
          color: white !important;
          padding: 16px 40px !important;
          border-radius: 16px !important;
          font-weight: 800 !important;
          font-size: 1.2rem !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap !important;
          border: none !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4) !important;
          width: auto !important;
        }

        .play-btn:hover {
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.6) !important;
          filter: brightness(1.1);
        }

        .info-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          color: white;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          transition: background 0.2s;
        }

        .info-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .carousel-indicators {
          position: absolute;
          bottom: 20px;
          right: 40px;
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .indicator-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .indicator-dot.active {
          background: white;
          transform: scale(1.3);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .slide-title { font-size: 2rem; }
          .slide-content { bottom: 20%; left: 20px; right: 20px; max-width: none; }
          .hero-carousel { height: 65vh; }
        }
      `}</style>
    </div>
  );
}
