import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB, MOVIE_GENRES } from "@/lib/tmdb";
import Link from "next/link";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string, genre?: string, year?: string } }) {
    const { q, genre, year } = await searchParams;

    let results = [];
    let title = "Browse Movies";

    if (q) {
        const data = await fetchFromTMDB("/search/movie", { query: q });
        results = data.results || [];
        title = `Search results for "${q}"`;
    } else if (genre || year) {
        const params: any = {};
        if (genre) params.with_genres = genre;
        if (year) params.primary_release_year = year;

        const data = await fetchFromTMDB("/discover/movie", params);
        results = data.results || [];
        title = genre ? `Movies in ${MOVIE_GENRES[parseInt(genre)] || "Genre"}` : "Discover Movies";
    } else {
        const data = await fetchFromTMDB("/movie/popular");
        results = data.results || [];
    }

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="search-container">
                <aside className="filters glass">
                    <h3>Filters</h3>
                    <div className="filter-group">
                        <h4>Genres</h4>
                        <div className="filter-list">
                            {Object.entries(MOVIE_GENRES).map(([id, name]) => (
                                <Link
                                    key={id}
                                    href={`/search?genre=${id}`}
                                    className={`filter-item ${genre === id ? 'active' : ''}`}
                                >
                                    {name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <h4>Release Year</h4>
                        <div className="filter-list">
                            {["2025", "2024", "2023", "2020s", "2010s", "2000s"].map((y) => (
                                <Link
                                    key={y}
                                    href={`/search?year=${y.replace('s', '')}`}
                                    className={`filter-item ${year === y.replace('s', '') ? 'active' : ''}`}
                                >
                                    {y}
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>

                <section className="results-section">
                    <h1 className="section-title">{title}</h1>
                    <div className="movie-grid">
                        {results.map((movie: any) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                        {results.length === 0 && <p>No movies found.</p>}
                    </div>
                </section>
            </div>

            <style jsx>{`
        .search-container {
          max-width: 1400px;
          margin: 100px auto 0;
          padding: 0 40px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
        }
        .filters {
          padding: 24px;
          height: fit-content;
          position: sticky;
          top: 100px;
        }
        .filters h3 { margin-bottom: 24px; }
        .filter-group { margin-bottom: 32px; }
        .filter-group h4 { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 12px; }
        .filter-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .filter-item {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }
        .filter-item:hover, .filter-item.active {
          background: var(--primary-gradient);
          color: white;
        }
        .results-section { flex: 1; }
        .section-title { font-size: 2rem; margin-bottom: 32px; }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 24px;
        }
        @media (max-width: 900px) {
          .search-container { grid-template-columns: 1fr; }
          .filters { position: static; }
        }
      `}</style>
        </main>
    );
}
