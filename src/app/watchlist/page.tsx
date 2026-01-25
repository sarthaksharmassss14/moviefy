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
            <div className="page-container">
                <h1 className="hero-title" style={{ textAlign: 'left', fontSize: '3rem', marginBottom: '48px' }}>
                    My <span className="gradient-text">Watchlist</span>
                </h1>

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
        </main>
    );
}
