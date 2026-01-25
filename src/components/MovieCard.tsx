"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Play } from "lucide-react";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path: string;
    vote_average: number;
    release_date: string;
  };
}

export default function MovieCard({ movie }: MovieCardProps) {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/no-poster.png";

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="movie-card"
    >
      <Link href={`/movies/${movie.id}`}>
        <div className="poster-container">
          <Image
            src={imageUrl}
            alt={movie.title}
            width={300}
            height={450}
            className="poster"
            priority={false}
          />
          <div className="card-overlay">
            <div className="rating-badge">
              <Star size={14} fill="#facc15" color="#facc15" />
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>

            <div className="play-icon-wrapper">
              <div className="play-circle">
                <Play size={32} fill="white" />
              </div>
            </div>
          </div>
        </div>
        <div className="card-info">
          <h3>{movie.title}</h3>
          <p>{new Date(movie.release_date).getFullYear() || "N/A"}</p>
        </div>
      </Link>

      <style jsx>{`
        .movie-card {
          width: 100%;
          cursor: pointer;
        }
        .poster-container {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .movie-card:hover .poster {
          transform: scale(1.05);
        }
        .card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
          backdrop-filter: blur(2px);
        }
        .movie-card:hover .card-overlay {
          opacity: 1;
        }
        .play-icon-wrapper {
          transform: scale(0.8);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .movie-card:hover .play-icon-wrapper {
          transform: scale(1);
        }
        .play-circle {
          width: 64px;
          height: 64px;
          background: var(--primary-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
          padding-left: 4px; /* Optical center for play icon */
        }
        .rating-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          padding: 4px 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .card-info {
          margin-top: 12px;
        }
        .card-info h3 {
          font-size: 1rem;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-info p {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
      `}</style>
    </motion.div>
  );
}
