"use client";

import MovieCard from "@/components/MovieCard";
import { useMemo } from "react";
import { Sparkles } from "lucide-react";

export default function PickedForYouSection({ movies }: { movies: any[] }) {
    const topMovie = movies[0];

    // Dynamic gradient style
    // Uses the backdrop as a simplified "dominant color" source via blur
    const dynamicStyle = useMemo(() => {
        if (!topMovie?.backdrop_path) return {};

        return {
            backgroundImage: `
                linear-gradient(to bottom, rgba(18, 18, 20, 0.8) 0%, rgba(18, 18, 20, 1) 100%),
                url(https://image.tmdb.org/t/p/w300${topMovie.backdrop_path})
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'inset 0 0 100px 100px #121214' // Heavy feathering
        };
    }, [topMovie]);

    if (!movies || movies.length === 0) return null;

    return (
        <section className="picked-for-you-section" style={{ position: 'relative', overflow: 'hidden', padding: '60px 0', marginTop: '40px', borderRadius: '32px' }}>
            {/* Dynamic Ambient Background */}
            <div className="dynamic-backdrop" style={dynamicStyle}></div>

            {/* Glow Orbs for depth */}
            <div className="glow-orb orb-1"></div>
            <div className="glow-orb orb-2"></div>

            <div className="content-wrapper" style={{ position: 'relative', zIndex: 10, padding: '0 40px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2rem', marginBottom: '8px' }}>
                        <Sparkles className="text-purple-400" size={28} />
                        Picked For You
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginLeft: '40px' }}>
                        Personalized Recommendations based on your unique taste and ratings.
                    </p>
                </div>

                <div className="shelf-container">
                    <div className="movie-grid shelf-grid">
                        {movies.slice(0, 6).map((movie: any) => (
                            <div key={movie.id} className="picked-card-wrapper">
                                <MovieCard movie={movie} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="swipe-footer">
                    <span className="swipe-text">SWIPE →</span>
                    <div className="swipe-line">
                        <div className="swipe-dot"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .picked-for-you-section {
                    transition: all 0.5s ease;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .dynamic-backdrop {
                    position: absolute;
                    top: -100px;
                    left: -100px;
                    right: -100px;
                    bottom: -100px;
                    filter: blur(80px) saturate(1.8) brightness(0.4);
                    z-index: 1;
                    opacity: 0.5;
                    transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glow-orb {
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    border-radius: 50%;
                    filter: blur(100px);
                    z-index: 2;
                    opacity: 0.15;
                    pointer-events: none;
                }
                .orb-1 {
                    top: -10%;
                    right: -5%;
                    background: #a855f7;
                    animation: float 20s infinite alternate;
                }
                .orb-2 {
                    bottom: -10%;
                    left: -5%;
                    background: #6366f1;
                    animation: float 25s infinite alternate-reverse;
                }
                @keyframes float {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(50px, 30px); }
                }
                .section-title {
                    font-family: inherit;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: white;
                }
                .picked-card-wrapper {
                   transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .picked-card-wrapper:hover {
                   transform: translateY(-8px) scale(1.02);
                }
                    .movie-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                        gap: 24px;
                    }
                }
                @media (max-width: 768px) {
                    .content-wrapper { padding: 0 16px !important; }
                    .section-title { 
                        font-size: 1.5rem !important;
                        justify-content: center;
                    }
                    .picked-for-you-section p {
                        margin-left: 0 !important;
                        text-align: center;
                        font-size: 0.9rem !important;
                    }
                    .shelf-container {
                        margin: 0 -16px;
                        padding: 10px 16px;
                    }
                    .shelf-grid {
                        display: flex !important;
                        padding-bottom: 10px;
                    }
                    .swipe-footer {
                        display: flex !important;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        margin-top: 10px;
                        opacity: 0.6;
                    }
                    .swipe-text {
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: var(--text-secondary);
                    }
                    .swipe-line {
                        width: 40px;
                        height: 2px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 2px;
                        position: relative;
                        overflow: hidden;
                    }
                    .swipe-dot {
                        position: absolute;
                        top: 0;
                        left: -10px;
                        width: 15px;
                        height: 100%;
                        background: #a855f7;
                        border-radius: 2px;
                        animation: swipeHint 2s infinite ease-in-out;
                    }
                    @keyframes swipeHint {
                        0% { left: -100%; }
                        50% { left: 100%; }
                        100% { left: 100%; }
                    }
                }
                @media (min-width: 769px) {
                    .swipe-footer { display: none; }
                }
            `}</style>
        </section>
    );
}
