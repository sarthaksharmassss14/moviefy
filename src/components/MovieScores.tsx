import { fetchFromOMDb } from "@/lib/tmdb";

interface MovieScoresProps {
    imdbId: string | null;
    tmdbRating: number;
}

export default async function MovieScores({ imdbId, tmdbRating }: MovieScoresProps) {
    // Fetch OMDb data in parallel (this component will be inside a Suspense)
    const omdbData = imdbId ? await fetchFromOMDb(imdbId) : null;

    return (
        <div className="scores-grid">
            <div className="score-card glass">
                <span className="score-label">TMDB</span>
                <span className="score-value">{tmdbRating.toFixed(1)}</span>
            </div>
            <div className="score-card glass">
                <span className="score-label">IMDb</span>
                <span className="score-value">{omdbData?.imdbRating || "N/A"}</span>
            </div>
            <div className="score-card glass">
                <span className="score-label">Rotten</span>
                <span className="score-value">
                    {omdbData?.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes")?.Value || "N/A"}
                </span>
            </div>
            <div className="score-card glass">
                <span className="score-label">Metacritic</span>
                <span className="score-value">{omdbData?.Metascore && omdbData.Metascore !== "N/A" ? `${omdbData.Metascore}%` : "N/A"}</span>
            </div>
        </div>
    );
}
