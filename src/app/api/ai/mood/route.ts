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

        // 1. Initial reasoning: Let Groq analyze the prompt and extract negative constraints and refined query
        console.log(`[AI Mood] Reasoning query: "${query}"`);
        const { analysis, movies: groqSuggested } = await getGroqRecommendations(query, "", "");

        const refinedQuery = analysis.refined_vector_query || query;
        const negativeConstraints = analysis.negative_constraints || [];
        const excludedDirectors = analysis.metadata_filters?.excluded_directors || [];

        console.log(`[AI Mood] Analysis: Refined Query: "${refinedQuery}", Negatives: ${negativeConstraints.length}`);

        // 2. Parallel Fetching: Groq Suggestions + Vector DB Candidates + User Context
        const [queryEmbedding, userReviewsRes] = await Promise.all([
            generateEmbedding(refinedQuery),
            userId ? supabase.from('reviews').select('movie_id').eq('user_id', userId).limit(50) : Promise.resolve({ data: [] })
        ]);

        let excludedMovieIds: number[] = [];
        if (userReviewsRes.data) {
            excludedMovieIds = userReviewsRes.data.map((r: any) => r.movie_id);
        }

        // Search Knowledge Base (833 movies) for vector matches
        const { data: vectorMatches } = await supabase.rpc('match_movie_recommendations', {
            query_embedding: queryEmbedding,
            match_threshold: 0.25,
            match_count: 10,
            excluded_ids: excludedMovieIds
        });

        // 3. Unify Candidate Pool: Groq List + Vector DB Matches
        const candidatePool = [
            ...groqSuggested.map(m => ({ title: m.title, year: m.year })),
            ...(vectorMatches || []).map((m: any) => ({ id: m.movie_id, isFromVector: true }))
        ];

        console.log(`[AI Mood] Scrubbing Pool of ${candidatePool.length} candidates...`);

        // 4. Hyper-Parallel Detail Fetching & Scrubbing
        const movieResults = await Promise.all(
            candidatePool.map(async (can: any) => {
                try {
                    let details: any = null;

                    if (can.id) {
                        // Directly fetch by ID if from Vector DB
                        details = await fetchFromTMDB(`/movie/${can.id}`, { append_to_response: "credits" });
                    } else {
                        // Search by title if from Groq
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

                    // SCRUBBING LOGIC
                    // a) Director Check
                    const director = details.credits?.crew?.find((c: any) => c.job === "Director")?.name || "";
                    if (excludedDirectors.some((d: string) => director.toLowerCase().includes(d.toLowerCase()))) {
                        console.log(`[AI Mood] Scrubbed "${details.title}": Excluded Director (${director})`);
                        return null;
                    }

                    // b) Negative Text Check
                    const textToSanitize = `${details.title} ${details.overview}`.toLowerCase();
                    if (negativeConstraints.some((nc: string) => textToSanitize.includes(nc.toLowerCase()))) {
                        console.log(`[AI Mood] Scrubbed "${details.title}": Violates Negative Constraint`);
                        return null;
                    }

                    return details;
                } catch (e) {
                    return null;
                }
            })
        );

        // Filter valid, dedupe, and clamp to 6
        const seenIds = new Set();
        const movies = movieResults
            .filter(Boolean)
            .filter(m => {
                if (seenIds.has(m.id)) return false;
                seenIds.add(m.id);
                return true;
            })
            .slice(0, 6);

        // Fallback Logic (if pool was too filtered)
        if (movies.length < 4) {
            console.log(`[AI Mood] Cleanup left only ${movies.length} results. Running fallback search with refined query...`);
            const searchRes = await fetchFromTMDB("/search/movie", { query: refinedQuery });
            const fallbacks = searchRes.results || [];

            for (const fb of fallbacks) {
                if (movies.length >= 6) break;
                if (seenIds.has(fb.id) || excludedMovieIds.includes(fb.id)) continue;

                try {
                    const details = await fetchFromTMDB(`/movie/${fb.id}`, { append_to_response: "credits" });
                    if (!details) continue;

                    // Apply same scrubbing to fallbacks
                    const director = details.credits?.crew?.find((c: any) => c.job === "Director")?.name || "";
                    if (excludedDirectors.some((d: string) => director.toLowerCase().includes(d.toLowerCase()))) continue;

                    const text = `${details.title} ${details.overview}`.toLowerCase();
                    if (negativeConstraints.some((nc: string) => text.includes(nc.toLowerCase()))) continue;

                    movies.push(details);
                    seenIds.add(details.id);
                } catch (e) { continue; }
            }
        }

        return NextResponse.json({
            results: movies,
            analysis: analysis
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
