import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB } from "@/lib/tmdb";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export default async function WatchlistPage() {
    const { userId } = await auth();
    if (!userId) return <div>Please sign in</div>;

    const { data: list } = await supabase
        .from("watchlist")
        .select("movie_id")
        .eq("user_id", userId);

    const movies = await Promise.all(
        (list || []).map(async (item) => {
            try {
                return await fetchFromTMDB(`/movie/${item.movie_id}`);
            } catch (err) {
                return null;
            }
        })
    );

    const filteredMovies = movies.filter(m => m !== null);

    return (
        <main className="min-h-screen">
            <Navbar />
            <div className="content-container">
                <h1 className="page-title">My <span className="gradient-text">Watchlist</span></h1>

                <div className="movie-grid">
                    {filteredMovies.map((movie: any) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                    {filteredMovies.length === 0 && (
                        <div className="empty-state glass">
                            <p>Your watchlist is empty. Start exploring!</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .content-container {
          max-width: 1400px;
          margin: 120px auto 0;
          padding: 0 40px;
        }
        .page-title {
          font-size: 3rem;
          margin-bottom: 48px;
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 30px;
        }
        .empty-state {
          grid-column: 1 / -1;
          padding: 100px;
          text-align: center;
          color: var(--text-secondary);
        }
      `}</style>
        </main>
    );
}
