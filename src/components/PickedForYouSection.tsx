"use client";

import MovieCard from "@/components/MovieCard";
import { useMemo } from "react";

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
        <section className="picked-for-you-section" style={{ position: 'relative', overflow: 'hidden', padding: '40px 0', marginTop: '40px', borderRadius: '24px' }}>
            {/* Dynamic Ambient Background */}
            <div className="dynamic-backdrop" style={dynamicStyle}></div>

            <div className="content-wrapper" style={{ position: 'relative', zIndex: 10, padding: '0 20px' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Picked For You
                    <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px', fontWeight: 'normal' }}>
                        Based on your taste
                    </span>
                </h2>
                <div className="movie-grid">
                    {movies.slice(0, 5).map((movie: any) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            </div>

            <style jsx>{`
                .picked-for-you-section {
                    transition: all 0.5s ease;
                }
                .dynamic-backdrop {
                    position: absolute;
                    top: -50px;
                    left: -50px;
                    right: -50px;
                    bottom: -50px;
                    background-color: #1a1a1a;
                    filter: blur(60px) saturate(1.5) brightness(0.6);
                    z-index: 1;
                    opacity: 0.6;
                    transition: background-image 1s ease;
                }
            `}</style>
        </section>
    );
}
