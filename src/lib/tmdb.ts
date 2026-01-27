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
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                next: { revalidate: 3600 * 12 } // Cache for 12 hours
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`[TMDB] API Warning ${response.status}: ${errorText.slice(0, 100)}`);

                if (response.status === 404) return null;
                if (response.status === 429) {
                    // Rate limit - wait and retry
                    await new Promise(r => setTimeout(r, 2000));
                    attempts++;
                    continue;
                }

                throw new Error(`Status ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            attempts++;

            const isTimeout = error.name === 'AbortError';
            const isNetworkError = error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED');

            if (attempts < maxRetries) {
                const delay = 500 * attempts;
                console.warn(`[TMDB] Retry ${attempts}/${maxRetries} (${isTimeout ? 'Timeout' : 'Network'})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // FINAL ATTEMPT FAILED
                console.error(`[TMDB] SILENT FAIL: Connection issue after ${maxRetries} attempts. Returning fallback.`);

                // Return fallback instead of throwing
                // If it's a search endpoint, return empty results
                if (endpoint.includes('/search/') || endpoint.includes('/list/') || endpoint.includes('/popular')) {
                    return { results: [], page: 1, total_results: 0, total_pages: 0 };
                }
                // If it's a detail endpoint, return null or empty object
                return null;
            }
        }
    }
    return null;
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

export const MOVIE_LANGUAGES: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    es: "Spanish",
    fr: "French",
    ja: "Japanese",
    ko: "Korean",
    de: "German",
    it: "Italian",
};

export async function fetchFromOMDb(imdbId: string) {
    if (!imdbId) return null;

    // Using a reliable public sandbox key 'trilogy' for real-world movie data
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=trilogy`;

    try {
        const response = await fetch(url, { next: { revalidate: 3600 * 24 } });
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.warn("[OMDb] Fetch failed:", e);
        return null;
    }
}
