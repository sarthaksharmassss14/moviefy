import { NextRequest, NextResponse } from "next/server";
import { fetchFromTMDB } from "@/lib/tmdb";
import { getGroqRecommendations } from "@/lib/groq";
import { generateEmbedding } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { query, excludeTitles = [] } = await req.json();
        if (!query) return NextResponse.json({ results: [] });

        const { userId } = await auth();

        console.log(`[AI Mood] Starting discovery for: "${query}". User: ${userId || 'Guest'}. Exclude: ${excludeTitles.length} items.`);

        let context = "";
        let watchedMoviesContext = "";

        // Combine manual exclusions with RAG context
        if (excludeTitles.length > 0) {
            watchedMoviesContext = `DONT RECOMMEND: ${excludeTitles.slice(-10).join(", ")}`;
        }

        // --- RAG & Exclusion STEP ---
        let excludedMovieIds: number[] = [];
        try {
            // 1. Get user's own reviews to exclude
            if (userId) {
                const { data: userReviews } = await supabase
                    .from('reviews')
                    .select('movie_id')
                    .eq('user_id', userId)
                    .limit(100);

                if (userReviews) {
                    excludedMovieIds = userReviews.map(r => r.movie_id);
                }
            }

            // 2. Retrieve relevant reviews for context
            const queryEmbedding = await generateEmbedding(query);
            const { data: matchedReviews } = await supabase.rpc('match_reviews', {
                query_embedding: queryEmbedding,
                match_threshold: 0.5,
                match_count: 8 // Get more for better filtering
            });

            if (matchedReviews && matchedReviews.length > 0) {
                console.log(`[AI Mood] Found ${matchedReviews.length} relevant reviews for context.`);
                context = matchedReviews.map((r: any) => `Review: "${r.content}"`).join("\n");
                // Inform Groq about what was watched if we can link it
                if (userId) {
                    const watched = matchedReviews.filter((r: any) => r.user_id === userId);
                    if (watched.length > 0) {
                        watchedMoviesContext = watched.map((r: any) => r.content.slice(0, 100)).join(", ");
                    }
                }
            } else {
                console.log("[AI Mood] No relevant reviews found.");
            }
        } catch (ragError) {
            console.warn("[AI Mood] RAG/Exclusion failed:", ragError);
        }

        // 1. Get Recommendations from Groq
        let recommendedObjects: any[] = [];
        const apiKey = process.env.GROQ_API_KEY;

        if (apiKey) {
            recommendedObjects = await getGroqRecommendations(query, context, watchedMoviesContext);
            console.log(`[AI Mood] Groq suggested:`, recommendedObjects.map(m => `${m.title} (${m.year})`));
        }

        // 2. Fetch Details and Filter 
        const movies: any[] = [];

        // Process candidates in chunks for speed while respecting 5 movie cap
        const processCandidate = async (rec: any) => {
            try {
                const isRepeat = excludeTitles.some((t: string) => t.toLowerCase() === rec.title.toLowerCase());
                if (isRepeat) return null;

                const searchRes = await fetchFromTMDB("/search/movie", {
                    query: rec.title,
                    primary_release_year: rec.year?.toString() || "",
                });

                const bestMatch = searchRes.results?.find((m: any) =>
                    m.release_date?.startsWith(rec.year?.toString())
                );

                if (bestMatch) {
                    // HOLLYWOOD PRIORITY: Filter out non-English movies for general queries
                    const isGeneralQuery = !/(hindi|indian|bollywood|french|korean|anime|japanese|spanish|telugu|tamil|malayalam|kannada)/i.test(query);
                    if (isGeneralQuery && bestMatch.original_language !== 'en') {
                        console.log(`[AI Mood] Filtering out non-English movie: ${bestMatch.title} (${bestMatch.original_language})`);
                        return null;
                    }

                    const queryYearMatch = query.match(/\b(19|20)\d{2}\b/);
                    if (queryYearMatch && !bestMatch.release_date.startsWith(queryYearMatch[0])) return null;
                    if (excludedMovieIds.includes(bestMatch.id)) return null;

                    const details = await fetchFromTMDB(`/movie/${bestMatch.id}`);

                    // Relaxed runtime for future films (often 0 or empty in TMDB for future releases)
                    const isFutureOrCurrent = new Date(details.release_date).getFullYear() >= 2025;
                    if (!isFutureOrCurrent && details.runtime && details.runtime < 60) return null;

                    return details;
                }
            } catch (e) {
                return null;
            }
            return null;
        };

        // Chunked parallel execution
        const chunkSize = 6;
        for (let i = 0; i < recommendedObjects.length; i += chunkSize) {
            const chunk = recommendedObjects.slice(i, i + chunkSize);
            const batchResults = await Promise.all(chunk.map(processCandidate));

            for (const movie of batchResults) {
                if (movie && movies.length < 5) {
                    movies.push(movie);
                }
            }
            if (movies.length >= 5) break;
        }

        // Fallback if we didn't get enough clean results from AI (less than 5)
        if (movies.length < 5) {
            console.log(`[AI Mood] Insufficient results (${movies.length}/5). Running fallback...`);
            const wordCount = query.split(" ").length;
            let fallbackResults: any[] = [];

            if (wordCount <= 3) {
                const searchRes = await fetchFromTMDB("/search/movie", { query });
                fallbackResults = searchRes.results || [];
            } else {
                const searchRes = await fetchFromTMDB("/search/movie", { query });
                if (searchRes.results && searchRes.results.length > 0) {
                    fallbackResults = searchRes.results;
                } else {
                    const trending = await fetchFromTMDB("/trending/movie/week");
                    fallbackResults = trending.results || [];
                }
            }

            // Populate remaining slots with filtered fallbacks
            for (const m of fallbackResults) {
                if (movies.length >= 5) break;

                try {
                    if (movies.some(p => p.id === m.id)) continue;
                    if (excludedMovieIds.includes(m.id)) continue;

                    // Language check (Hollywood priority)
                    const isGeneralQuery = !/(hindi|indian|bollywood|french|korean|anime|japanese|spanish|telugu|tamil|malayalam|kannada)/i.test(query);
                    if (isGeneralQuery && m.original_language !== 'en') continue;

                    const details = await fetchFromTMDB(`/movie/${m.id}`);
                    const isFutureOrCurrent = new Date(details.release_date).getFullYear() >= 2025;
                    if (!isFutureOrCurrent && details.runtime && details.runtime < 60) continue;

                    movies.push(details);
                } catch (e) {
                    continue;
                }
            }
        }

        return NextResponse.json({ results: movies });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
