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

    // Small spread to prevent rapid-fire requests hitting TMDB limits too fast
    await new Promise(resolve => setTimeout(resolve, 100));

    while (attempts < maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // Increased to 12s

        try {
            console.log(`[TMDB] Fetching: ${endpoint} (Attempt ${attempts + 1})`);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[TMDB API Error] ${response.status}: ${errorBody}`);
                throw new Error(`TMDB Server returned ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            attempts++;

            let errorMessage = error.message;
            if (error.name === 'AbortError') errorMessage = "Request timed out (10s)";

            console.error(`[TMDB Fetch Failure] Attempt ${attempts}:`, errorMessage);

            if (attempts >= maxRetries) {
                throw new Error(`TMDB connection failed after ${maxRetries} attempts. (Error: ${errorMessage})`);
            }
            // exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
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
