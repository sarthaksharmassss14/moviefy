import { fetchFromOMDb } from "@/lib/tmdb";

interface MovieScoresProps {
    imdbId: string | null;
    tmdbId: number;
    tmdbRating: number;
    movieTitle: string;
}

export default async function MovieScores({ imdbId, tmdbId, tmdbRating, movieTitle }: MovieScoresProps) {
    // Fetch OMDb data in parallel
    const omdbData = imdbId ? await fetchFromOMDb(imdbId) : null;

    // Generate a Rotten Tomatoes slug (lowercase and underscores)
    const rtSlug = movieTitle
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // Remove special chars
        .replace(/ /g, '_');      // Replace spaces with underscores

    return (
        <div className="scores-grid">
            <a
                href={`https://www.themoviedb.org/movie/${tmdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="score-card glass hover-scale"
                title="View on TMDB"
            >
                <span className="score-label">TMDB</span>
                <span className="score-value">{tmdbRating.toFixed(1)}</span>
            </a>

            <a
                href={imdbId ? `https://www.imdb.com/title/${imdbId}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`score-card glass hover-scale ${!imdbId ? 'disabled' : ''}`}
                title="View on IMDb"
            >
                <span className="score-label">IMDb</span>
                <span className="score-value">{omdbData?.imdbRating || "N/A"}</span>
            </a>

            <a
                href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(movieTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="score-card glass hover-scale"
                title="Search on Rotten Tomatoes"
            >
                <span className="score-label">Rotten</span>
                <span className="score-value">
                    {omdbData?.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes")?.Value || "N/A"}
                </span>
            </a>
        </div>
    );
}
