const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY!,
        ...params,
    });

    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error("Failed to fetch from TMDB");
    }

    return response.json();
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
