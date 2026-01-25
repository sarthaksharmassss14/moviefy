import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB } from "@/lib/tmdb";
import { auth } from "@clerk/nextjs/server";
import { getRecommendedMovies } from "@/lib/ai";
import MoodSearch from "@/components/MoodSearch";

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
    const candidates = [...trending, ...popular, ...topRated];
    recommendations = await getRecommendedMovies(userId, candidates);
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="hero">
        <div className="hero-content animate-fade-in">
          <h1 className="hero-title">Discover Your Next <span className="gradient-text">Favorite Story</span></h1>
          <p className="hero-subtitle">Personalized recommendations, lists, and reviews. All in one place.</p>
        </div>
      </section>

      <div className="content-container">
        <MoodSearch />
        {recommendations.length > 0 && (
          <section className="movie-section">
            <h2 className="section-title">Picked For You</h2>
            <div className="movie-grid">
              {recommendations.slice(0, 5).map((movie: any) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

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
