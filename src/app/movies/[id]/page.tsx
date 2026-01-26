import Navbar from "@/components/Navbar";
import Link from "next/link";
import { fetchFromTMDB } from "@/lib/tmdb";
import Image from "next/image";
import { Star, Clock, Calendar, Globe, Heart, MessageSquare } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { toggleWatchlist } from "@/app/actions";
import MoviePlayer from "@/components/MoviePlayer";
import AddToListButton from "@/components/AddToListButton";
import WatchlistButton from "@/components/WatchlistButton";

async function getMovieDetails(id: string) {
  const [movie, credits, videos] = await Promise.all([
    fetchFromTMDB(`/movie/${id}`),
    fetchFromTMDB(`/movie/${id}/credits`),
    fetchFromTMDB(`/movie/${id}/videos`),
  ]);

  const trailer = videos.results?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  );

  return { movie, credits, trailer };
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log(`[MoviePage] Loading movie with ID: ${id}`);

    const { movie, credits, trailer } = await getMovieDetails(id);
    const { userId } = await auth();

    console.log(`[MoviePage] Data fetched for ${movie.title}. User: ${userId}`);

    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("movie_id", parseInt(id))
      .order("created_at", { ascending: false });

    if (reviewError) console.error("[MoviePage] Supabase Review Error:", reviewError);

    let isInWatchlist = false;
    let userLists: any[] = [];

    if (userId) {
      // Check Watchlist
      const { data, error: watchlistError } = await supabase
        .from("watchlist")
        .select()
        .eq("user_id", userId)
        .eq("movie_id", parseInt(id))
        .single();

      if (watchlistError && watchlistError.code !== 'PGRST116') {
        console.error("[MoviePage] Supabase Watchlist Error:", watchlistError);
      }
      isInWatchlist = !!data;

      // Fetch User Lists for AddToList dropdown
      const { data: listsData } = await supabase
        .from('lists')
        .select('id, name')
        .eq('user_id', userId);

      if (listsData) userLists = listsData;
    }

    const backgroundUrl = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : "";

    const director = credits.crew?.find((person: any) => person.job === "Director");

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
              <h1 className="movie-title-large">{movie.title}</h1>
              {director && (
                <p className="tagline" style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '1.1rem' }}>
                  Directed by <Link href={`/person/${director.id}`} className="hover:text-white transition-colors" style={{ color: 'white' }}>{director.name}</Link>
                </p>
              )}

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

              <div className="actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <MoviePlayer
                  tmdbId={movie.id}
                  imdbId={movie.imdb_id}
                  originalLanguage={movie.original_language}
                />
                <WatchlistButton movieId={movie.id} initialState={isInWatchlist} userId={userId || ""} />
                <AddToListButton movieId={movie.id} lists={userLists} userId={userId || ""} />
              </div>
            </div>
          </div>

          <div className="details-content">
            <div className="main-col">
              <section className="overview">
                <h2>Overview</h2>
                <p className="overview-text">{movie.overview}</p>
              </section>

              <section className="cast">
                <h2>Cast</h2>
                <div className="cast-grid">
                  {credits.cast.slice(0, 20).map((actor: any) => (
                    <Link key={actor.id} href={`/person/${actor.id}`} className="actor-card-link">
                      <div className="actor-card">
                        <div className="actor-img-wrapper">
                          <Image
                            src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "/no-actor.png"}
                            alt={actor.name}
                            width={100}
                            height={100}
                            className="actor-img"
                          />
                        </div>
                        <span className="actor-name">{actor.name}</span>
                        <span className="character-name">{actor.character}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="reviews-section">
                <h2>User Reviews</h2>
                {userId ? (
                  <ReviewForm
                    movieId={movie.id}
                    movieDescription={movie.overview}
                    initialRating={reviews?.find(r => r.user_id === userId)?.rating || 0}
                    initialContent={reviews?.find(r => r.user_id === userId)?.content || ""}
                  />
                ) : (
                  <div className="login-prompt glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <MessageSquare size={40} style={{ margin: '0 auto 16px', color: 'rgba(255,255,255,0.2)' }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Share your thoughts</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Sign in to rate this movie and join the conversation.</p>
                    <Link href="/sign-in" className="action-btn" style={{ display: 'inline-flex', background: 'var(--primary-gradient)', color: 'white', border: 'none' }}>
                      Sign In to Review
                    </Link>
                  </div>
                )}

                <div className="reviews-list">
                  {reviews?.map((r: any) => r.content && (
                    <div key={r.id} className="review-card glass">
                      <div className="rev-header">
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
      </main>
    );
  } catch (error: any) {
    console.error("[MoviePage] CRITICAL ERROR:", error);
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h1 className="gradient-text">Oops! Connection Issue</h1>
        <p style={{ marginTop: '20px' }}>{error.message || "Failed to load movie details. Please check your internet or try refreshing."}</p>
      </div>
    );
  }
}
