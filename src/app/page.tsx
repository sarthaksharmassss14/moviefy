import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB } from "@/lib/tmdb";
import { auth } from "@clerk/nextjs/server";
import MoodSearch from "@/components/MoodSearch";
import HeroCarousel from "@/components/HeroCarousel";
import { Suspense } from "react";
import AIPickedSection from "@/components/AIPickedSection";

async function getMovies() {
  const [trending, popular, topRated] = await Promise.all([
    fetchFromTMDB("/trending/movie/day"),
    fetchFromTMDB("/movie/popular"),
    fetchFromTMDB("/movie/top_rated"),
  ]);

  const indianLanguages = ['hi', 'te', 'ta', 'kn', 'ml', 'pa', 'bn'];
  const filterIndian = (movies: any[]) =>
    (movies || []).filter(movie => !indianLanguages.includes(movie.original_language));

  return {
    trending: filterIndian(trending?.results || []),
    popular: filterIndian(popular?.results || []),
    topRated: filterIndian(topRated?.results || []),
  };
}

export default async function Home() {
  // Fire off auth and movie fetches in parallel
  const authPromise = auth();
  const moviesPromise = getMovies();

  const [{ userId }, { trending, popular, topRated }] = await Promise.all([
    authPromise,
    moviesPromise
  ]);

  return (
    <main className="min-h-screen">
      <Navbar />

      <HeroCarousel movies={trending.slice(0, 5)} />

      <div className="content-container">
        <MoodSearch />

        {/* Use Suspense for the slow AI part so the rest of the page loads instantly */}
        <Suspense fallback={
          <div className="picked-for-you-section" style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Generating your personalized picks...</p>
          </div>
        }>
          <AIPickedSection userId={userId} trendingMovies={[...trending, ...popular, ...topRated]} />
        </Suspense>

        <section className="movie-section">
          <h2 className="section-title">Trending Today</h2>
          <div className="movie-grid">
            {trending.slice(0, 10).map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        <section className="movie-section">
          <h2 className="section-title">Top Rated</h2>
          <div className="movie-grid">
            {topRated.slice(0, 10).map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
