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

        // --- HYPER-FAST RAG & DISCOVERY STEP ---
        let context = "";
        let watchedMoviesContext = "";
        let excludedMovieIds: number[] = [];

        // 1. Parallel Context Gathering with a strict Timeout (Smart Skip)
        console.log("[AI Mood] Gathering context and results in parallel...");

        const contextPromise = (async () => {
            try {
                const [userReviewsRes, queryEmbedding] = await Promise.all([
                    userId ? supabase.from('reviews').select('movie_id').eq('user_id', userId).limit(100) : Promise.resolve({ data: [] }),
                    generateEmbedding(query)
                ]);

                if (userReviewsRes.data) {
                    excludedMovieIds = userReviewsRes.data.map((r: any) => r.movie_id);
                }

                const { data: matchedReviews } = await supabase.rpc('match_reviews', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.5,
                    match_count: 5
                });

                if (matchedReviews && matchedReviews.length > 0) {
                    context = matchedReviews.map((r: any) => `Review: "${r.content}"`).join("\n");
                }
            } catch (e) {
                console.warn("[AI Mood] Context retrieval failed or timed out.");
            }
        })();

        // Race the context gathering against a 2.5s timeout
        await Promise.race([
            contextPromise,
            new Promise(resolve => setTimeout(resolve, 2500))
        ]);

        // 2. Get Recommendations from Groq (Now we have context, or we don't, but we move FAST)
        let recommendedObjects: any[] = [];
        const apiKey = process.env.GROQ_API_KEY;

        if (apiKey) {
            recommendedObjects = await getGroqRecommendations(query, context, watchedMoviesContext);
        }

        // 3. Hyper-Parallel Detail Fetching (Process all candidates at once)
        console.log(`[AI Mood] Fetching details for ${recommendedObjects.length} candidates...`);

        const movieResults = await Promise.all(
            recommendedObjects.map(async (rec: any) => {
                try {
                    const isRepeat = excludeTitles.some((t: string) => t.toLowerCase() === rec.title.toLowerCase());
                    if (isRepeat) return null;

                    const searchRes = await fetchFromTMDB("/search/movie", {
                        query: rec.title,
                        primary_release_year: rec.year?.toString() || "",
                    });

                    const bestMatch = searchRes.results?.[0]; // Take top match immediately for speed
                    if (!bestMatch) return null;

                    // Exclude watched
                    if (excludedMovieIds.includes(bestMatch.id)) return null;

                    // Quick detail fetch for poster and runtime
                    return await fetchFromTMDB(`/movie/${bestMatch.id}`);
                } catch (e) {
                    return null;
                }
            })
        );

        // Filter valid movies and clamp to 6 for the UI grid
        const movies = movieResults.filter(Boolean).slice(0, 6);

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
