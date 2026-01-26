const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key") {
        console.error("[TMDB] ERROR: Key is missing or default.");
        throw new Error("TMDB_API_KEY is not configured correctly in .env");
    }

    // Log masked key to verify it's loaded
    const masked = `${TMDB_API_KEY.slice(0, 4)}...${TMDB_API_KEY.slice(-4)}`;
    console.log(`[TMDB] Using key: ${masked} for endpoint: ${endpoint}`);

    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY.trim(),
        ...params,
    });

    const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;

    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                next: { revalidate: 3600 * 24 } // Cache for 24 hours
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text();

                // If 404, don't retry, just fail fast
                if (response.status === 404) {
                    throw new Error(`TMDB 404: Not Found at ${endpoint}`);
                }

                throw new Error(`TMDB Server returned ${response.status}: ${errorBody}`);
            }

            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);

            // Don't retry on 404 or specific errors
            if (error.message.includes("404")) {
                throw error;
            }

            attempts++;
            let errorMessage = error.message;
            if (error.name === 'AbortError') errorMessage = "Request timed out (20s)";

            if (attempts < maxRetries) {
                console.warn(`[TMDB] Transient error (Attempt ${attempts}): ${errorMessage}. Retrying...`);
            } else {
                console.error(`[TMDB Fetch Failure] Final Attempt ${attempts}:`, error.message);
            }

            if (attempts >= maxRetries) {
                throw new Error(`TMDB failed after ${maxRetries} attempts: ${errorMessage}`);
            }
            await new Promise(resolve => setTimeout(resolve, 500 * attempts));
        }
    }
}

export const MOVIE_GENRES: Record<number, string> = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
};
