import { fetchFromTMDB } from "./tmdb";
import { getGroqRecommendations } from "./groq";
import { generateEmbedding } from "./ai";
import { supabase } from "./supabase";

export async function getMoodRecommendations(query: string, userId: string | null = null, excludeTitles: string[] = []) {
    try {
        if (!query) return { results: [] };

        console.log(`[AI Mood Lib] Starting discovery for: "${query}". User: ${userId || 'Guest'}.`);

        // 1. Initial reasoning
        const { analysis, movies: groqSuggested } = await getGroqRecommendations(query, "", "");

        const refinedQuery = analysis.refined_vector_query || query;
        const negativeConstraints = analysis.negative_constraints || [];
        const excludedDirectors = analysis.metadata_filters?.excluded_directors || [];

        // 2. Parallel Fetching
        const [queryEmbedding, userReviewsRes] = await Promise.all([
            generateEmbedding(refinedQuery),
            userId ? supabase.from('reviews').select('movie_id').eq('user_id', userId).limit(50) : Promise.resolve({ data: [] })
        ]);

        let excludedMovieIds: number[] = [];
        if (userReviewsRes.data) {
            excludedMovieIds = userReviewsRes.data.map((r: any) => r.movie_id);
        }

        // Search Knowledge Base
        const { data: vectorMatches } = await supabase.rpc('match_movie_recommendations', {
            query_embedding: queryEmbedding,
            match_threshold: 0.25,
            match_count: 10,
            excluded_ids: excludedMovieIds
        });

        // 3. Unify Candidate Pool
        const candidatePool = [
            ...groqSuggested.map(m => ({ title: m.title, year: m.year })),
            ...(vectorMatches || []).map((m: any) => ({ id: m.movie_id, isFromVector: true }))
        ];

        // 4. Detail Fetching & Scrubbing
        const movieResults = await Promise.all(
            candidatePool.map(async (can: any) => {
                try {
                    let details: any = null;

                    if (can.id) {
                        details = await fetchFromTMDB(`/movie/${can.id}`, { append_to_response: "credits" });
                    } else {
                        const isRepeat = excludeTitles.some((t: string) => t.toLowerCase() === can.title.toLowerCase());
                        if (isRepeat) return null;

                        const searchRes = await fetchFromTMDB("/search/movie", {
                            query: can.title,
                            primary_release_year: can.year?.toString() || "",
                        });
                        const match = searchRes.results?.[0];
                        if (!match) return null;
                        if (excludedMovieIds.includes(match.id)) return null;

                        details = await fetchFromTMDB(`/movie/${match.id}`, { append_to_response: "credits" });
                    }

                    if (!details) return null;

                    // SCRUBBING
                    const director = details.credits?.crew?.find((c: any) => c.job === "Director")?.name || "";
                    if (excludedDirectors.some((d: string) => director.toLowerCase().includes(d.toLowerCase()))) return null;

                    const textToSanitize = `${details.title} ${details.overview}`.toLowerCase();
                    if (negativeConstraints.some((nc: string) => textToSanitize.includes(nc.toLowerCase()))) return null;

                    return details;
                } catch (e) { return null; }
            })
        );

        const seenIds = new Set();
        const movies = movieResults
            .filter(Boolean)
            .filter(m => {
                if (seenIds.has(m.id)) return false;
                seenIds.add(m.id);
                return true;
            })
            .slice(0, 8); // Slightly more for search page

        return {
            results: movies,
            analysis: analysis
        };
    } catch (error: any) {
        console.error("[Mood Lib] Error:", error);
        return { results: [], error: error.message };
    }
}
