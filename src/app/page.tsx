import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB } from "@/lib/tmdb";
import { auth } from "@clerk/nextjs/server";
import { getRecommendedMovies, getPickedForYou } from "@/lib/ai";
import MoodSearch from "@/components/MoodSearch";
import PickedForYouSection from "@/components/PickedForYouSection";

import HeroCarousel from "@/components/HeroCarousel";

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
    trending: filterIndian(trending.results),
    popular: filterIndian(popular.results),
    topRated: filterIndian(topRated.results),
  };
}

export default async function Home() {
  const { userId } = await auth();
  const { trending, popular, topRated } = await getMovies();

  let recommendations = [];
  if (userId) {
    const [proactive, scored] = await Promise.all([
      getPickedForYou(userId),
      getRecommendedMovies(userId, [...trending, ...popular, ...topRated])
    ]);

    // Combine and de-duplicate
    const combined = [...proactive, ...scored];
    const uniqueIds = new Set();
    recommendations = combined.filter(m => {
      if (uniqueIds.has(m.id)) return false;
      uniqueIds.add(m.id);
      return true;
    }).slice(0, 6);
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <HeroCarousel movies={trending.slice(0, 5)} />

      <div className="content-container">
        <MoodSearch />

        <PickedForYouSection movies={recommendations} />

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
