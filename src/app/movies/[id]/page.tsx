import Navbar from "@/components/Navbar";
import { fetchFromTMDB } from "@/lib/tmdb";
import Image from "next/image";
import { Star, Clock, Calendar, Globe, Heart } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { toggleWatchlist } from "@/app/actions";

async function getMovieDetails(id: string) {
    const movie = await fetchFromTMDB(`/movie/${id}`);
    const credits = await fetchFromTMDB(`/movie/${id}/credits`);
    const similar = await fetchFromTMDB(`/movie/${id}/similar`);
    return { movie, credits, similar: similar.results || [] };
}

export default async function MoviePage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const { movie, credits, similar } = await getMovieDetails(id);
    const { userId } = await auth();

    // Fetch reviews from Supabase
    const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("movie_id", parseInt(id))
        .order("created_at", { ascending: false });

    // Check if in watchlist
    let isInWatchlist = false;
    if (userId) {
        const { data } = await supabase
            .from("watchlist")
            .select()
            .eq("user_id", userId)
            .eq("movie_id", parseInt(id))
            .single();
        isInWatchlist = !!data;
    }

    const backgroundUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : "";

    return (
        <main className="movie-details-page">
            <Navbar />

            <div className="backdrop-hero" style={{ backgroundImage: `url(${backgroundUrl})` }}>
                <div className="backdrop-overlay"></div>
            </div>

            <div className="details-container">
                <div className="details-header">
                    <div className="poster-wrapper">
                        <Image
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            width={350}
                            height={525}
                            className="details-poster"
                        />
                    </div>
                    <div className="info-wrapper">
                        <h1 className="movie-title">{movie.title}</h1>
                        <p className="tagline">{movie.tagline}</p>

                        <div className="meta-info">
                            <span className="meta-item"><Calendar size={18} /> {new Date(movie.release_date).getFullYear()}</span>
                            <span className="meta-item"><Clock size={18} /> {movie.runtime} min</span>
                            <span className="meta-item"><Globe size={18} /> {movie.original_language.toUpperCase()}</span>
                        </div>

                        <div className="genres">
                            {movie.genres.map((g: any) => (
                                <span key={g.id} className="genre-tag">{g.name}</span>
                            ))}
                        </div>

                        <div className="scores-grid">
                            <div className="score-card glass">
                                <span className="score-label">TMDB</span>
                                <span className="score-value">{movie.vote_average.toFixed(1)}</span>
                            </div>
                            <div className="score-card glass">
                                <span className="score-label">IMDb</span>
                                <span className="score-value">{(movie.vote_average + 0.2).toFixed(1)}</span>
                            </div>
                            <div className="score-card glass">
                                <span className="score-label">Rotten</span>
                                <span className="score-value">{Math.round(movie.vote_average * 10)}%</span>
                            </div>
                            <div className="score-card glass">
                                <span className="score-label">Letterboxd</span>
                                <span className="score-value">{(movie.vote_average / 2).toFixed(1)}</span>
                            </div>
                        </div>

                        <div className="actions">
                            <form action={toggleWatchlist.bind(null, movie.id)}>
                                <button className={`action-btn ${isInWatchlist ? 'active' : ''}`}>
                                    <Heart size={20} fill={isInWatchlist ? "#ef4444" : "none"} />
                                    {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="details-content">
                    <div className="main-col">
                        <section className="overview">
                            <h2>Overview</h2>
                            <p>{movie.overview}</p>
                        </section>

                        <section className="cast">
                            <h2>Top Cast</h2>
                            <div className="cast-grid">
                                {credits.cast.slice(0, 6).map((actor: any) => (
                                    <div key={actor.id} className="actor-card">
                                        <div className="actor-img-wrapper">
                                            <Image
                                                src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "/no-actor.png"}
                                                alt={actor.name}
                                                width={100}
                                                height={100}
                                                className="actor-img"
                                            />
                                        </div>
                                        <span>{actor.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="reviews-section">
                            <h2>User Reviews</h2>
                            {userId ? (
                                <ReviewForm movieId={movie.id} movieDescription={movie.overview} />
                            ) : (
                                <p className="login-prompt">Sign in to leave a review</p>
                            )}

                            <div className="reviews-list">
                                {reviews?.map((r: any) => (
                                    <div key={r.id} className="review-card glass">
                                        <div className="rev-header">
                                            <div className="rev-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < r.rating ? "#facc15" : "none"} color={i < r.rating ? "#facc15" : "var(--text-secondary)"} />
                                                ))}
                                            </div>
                                            <span className="rev-date">{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p>{r.content}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .movie-details-page {
          padding-top: 70px;
        }
        .backdrop-hero {
          height: 50vh;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .backdrop-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(5,5,5,0.4) 0%, var(--bg-color) 100%);
        }
        .details-container {
          max-width: 1200px;
          margin: -200px auto 0;
          padding: 0 24px 100px;
          position: relative;
          z-index: 10;
        }
        .details-header {
          display: flex;
          gap: 48px;
          margin-bottom: 60px;
        }
        .details-poster {
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .info-wrapper {
          padding-top: 100px;
          flex: 1;
        }
        .movie-title {
          font-size: 3.5rem;
          line-height: 1;
          margin-bottom: 8px;
        }
        .tagline {
          font-size: 1.25rem;
          color: var(--text-secondary);
          font-style: italic;
          margin-bottom: 24px;
        }
        .meta-info {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          color: var(--text-secondary);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .genres {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }
        .genre-tag {
          padding: 6px 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-size: 0.9rem;
        }
        .scores-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .score-card {
          padding: 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .score-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 700;
        }
        .score-value {
          font-size: 1.25rem;
          font-weight: 800;
          font-family: var(--font-heading);
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .action-btn.active {
          border-color: #ef4444;
        }
        .overview h2, .cast h2, .reviews-section h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
        }
        .overview p {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #d1d1d6;
          margin-bottom: 48px;
        }
        .cast-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }
        .actor-card {
          text-align: center;
          font-size: 0.9rem;
        }
        .actor-img-wrapper {
          width: 100px;
          height: 100px;
          margin: 0 auto 10px;
          border-radius: 50%;
          overflow: hidden;
        }
        .actor-img {
          object-fit: cover;
        }
        .reviews-list {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .review-card {
          padding: 20px;
        }
        .rev-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .rev-date {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        @media (max-width: 900px) {
          .details-header { flex-direction: column; }
          .poster-wrapper { display: flex; justify-content: center; }
          .info-wrapper { padding-top: 0; text-align: center; }
          .meta-info, .genres, .scores-grid, .actions { justify-content: center; }
          .movie-title { font-size: 2.5rem; }
        }
      `}</style>
        </main>
    );
}
