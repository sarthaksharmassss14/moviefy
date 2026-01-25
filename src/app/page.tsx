import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB } from "@/lib/tmdb";
import { auth } from "@clerk/nextjs/server";
import { getRecommendedMovies } from "@/lib/ai";

async function getMovies() {
  const trending = await fetchFromTMDB("/trending/movie/day");
  const popular = await fetchFromTMDB("/movie/popular");
  const topRated = await fetchFromTMDB("/movie/top_rated");

  return {
    trending: trending.results || [],
    popular: popular.results || [],
    topRated: topRated.results || [],
  };
}

export default async function Home() {
  const { userId } = await auth();
  const { trending, popular, topRated } = await getMovies();

  let recommendations = [];
  if (userId) {
    // Combine some sources for candidates
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

      <style jsx>{`
        .hero {
          height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 20px;
          position: relative;
        }
        .hero-title {
          font-size: 4rem;
          margin-bottom: 16px;
          line-height: 1.1;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }
        .content-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px 100px;
        }
        .movie-section {
          margin-bottom: 60px;
        }
        .section-title {
          font-size: 1.75rem;
          margin-bottom: 24px;
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 30px;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .content-container { padding: 0 20px 60px; }
        }
      `}</style>
    </main>
  );
}
