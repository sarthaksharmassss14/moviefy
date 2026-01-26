import Navbar from "@/components/Navbar";
import Link from "next/link";
import { fetchFromTMDB } from "@/lib/tmdb";
import Image from "next/image";
import { Clock, Calendar, Globe } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import MoviePlayer from "@/components/MoviePlayer";
import AddToListButton from "@/components/AddToListButton";
import WatchlistButton from "@/components/WatchlistButton";
import LoginPrompt from "@/components/LoginPrompt";
import { Suspense } from "react";
import MovieScores from "@/components/MovieScores";

// This function is now optimized to use a single TMDB call
async function getMovieDetails(id: string) {
  const data = await fetchFromTMDB(`/movie/${id}`, {
    append_to_response: "credits,videos"
  });

  if (!data) return { movie: null, credits: null, trailer: null };

  const trailer = (data.videos?.results || []).find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  );

  return { movie: data, credits: data.credits, trailer };
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const movieIdInt = parseInt(id);

    // parallelize everything possible
    const [{ movie, credits, trailer }, { userId }, { data: reviews }] = await Promise.all([
      getMovieDetails(id),
      auth(),
      supabase.from("reviews").select("*").eq("movie_id", movieIdInt).order("created_at", { ascending: false })
    ]);

    if (!movie) {
      return (
        <div className="page-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <Navbar />
          <h1 className="gradient-text">Movie not found</h1>
          <p style={{ marginTop: '20px', color: '#a1a1aa' }}>We couldn't reach the cinema records. Please try again or refresh the page.</p>
          <Link href="/" className="action-btn" style={{ display: 'inline-flex', marginTop: '30px' }}>Return Home</Link>
        </div>
      );
    }

    let isInWatchlist = false;
    let userLists: any[] = [];

    if (userId) {
      // Parallelize watchlist check and lists fetch
      const [watchlistCheck, listsRes] = await Promise.all([
        supabase.from("watchlist").select().eq("user_id", userId).eq("movie_id", movieIdInt).maybeSingle(),
        supabase.from('lists').select('id, name').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      isInWatchlist = !!watchlistCheck.data;

      // Handle Rated -> Remove from Watchlist logic
      const userRatingRaw = reviews?.find((r: any) => r.user_id === userId)?.rating;
      if (userRatingRaw) {
        isInWatchlist = false;
        if (watchlistCheck.data) {
          supabase.from("watchlist").delete().eq("user_id", userId).eq("movie_id", movieIdInt).then();
        }
      }

      if (listsRes.data) {
        userLists = listsRes.data.map(l => ({ ...l, poster_path: null })); // Rapid fallback, list posters can load later or be omitted for speed
      }
    }

    const backgroundUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : "";
    const director = credits.crew?.find((person: any) => person.job === "Director");
    const userReview = reviews?.find(r => r.user_id === userId);
    const userRating = userReview?.rating || null;

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
                priority
              />
            </div>
            <div className="info-wrapper">
              <h1 className="movie-title-large">{movie.title}</h1>
              {director && (
                <p className="tagline" style={{ fontWeight: '500', fontSize: '1.1rem' }}>
                  Directed by <Link href={`/person/${director.id}`} className="director-link">{director.name}</Link>
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

              <Suspense fallback={
                <div className="scores-grid">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="score-card glass loading-skeleton" style={{ height: '60px', opacity: 0.3 }}></div>
                  ))}
                </div>
              }>
                <MovieScores imdbId={movie.imdb_id} tmdbRating={movie.vote_average} />
              </Suspense>

              <div className="actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <MoviePlayer
                  tmdbId={movie.id}
                  imdbId={movie.imdb_id}
                  originalLanguage={movie.original_language}
                />
                <WatchlistButton
                  movieId={movie.id}
                  initialState={isInWatchlist}
                  userId={userId || ""}
                  userRating={userRating}
                />
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
                  {credits.cast.filter((actor: any) => actor.profile_path).slice(0, 20).map((actor: any) => (
                    <Link key={actor.id} href={`/person/${actor.id}`} className="actor-card-link">
                      <div className="actor-card">
                        <div className="actor-img-wrapper">
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
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
                    initialRating={userRating || 0}
                    initialContent={userReview?.content || ""}
                  />
                ) : (
                  <LoginPrompt />
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
        <p style={{ marginTop: '20px' }}>{error.message || "Failed to load movie details."}</p>
      </div>
    );
  }
}
