import { NextRequest, NextResponse } from "next/server";
import { fetchFromTMDB } from "@/lib/tmdb";
import { getGroqRecommendations } from "@/lib/groq";

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();
        if (!query) return NextResponse.json({ results: [] });

        console.log(`[AI Mood] Starting discovery for: "${query}"`);

        // 1. Get Recommendations from Groq (LLM)
        let recommendedTitles: string[] = [];
        const apiKey = process.env.GROQ_API_KEY;

        if (apiKey && apiKey.startsWith("gsk_")) {
            console.log("[AI Mood] GROQ_API_KEY found (masks checked). Calling Llama3...");
            recommendedTitles = await getGroqRecommendations(query);
            console.log(`[AI Mood] Groq suggested:`, recommendedTitles);
        } else {
            console.warn(`[AI Mood] GROQ_API_KEY is missing or invalid (Length: ${apiKey?.length || 0}).`);
        }

        if (recommendedTitles.length === 0) {
            console.log("[AI Mood] No titles from Groq. Executing fallback strategy.");

            // Fallback Logic
            // If query is short (e.g., "Horror movies"), search it.
            // If query is long description (e.g., "I want a movie about space..."), search will fail, so return trending.
            const wordCount = query.split(" ").length;

            if (wordCount <= 4) {
                console.log("[AI Mood] Fallback: Performing keyword search on TMDB.");
                const searchRes = await fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}`);
                return NextResponse.json({ results: searchRes.results?.slice(0, 5) || [] });
            } else {
                console.log("[AI Mood] Fallback: Query too long for keyword search. Returning Trending.");
                const trending = await fetchFromTMDB("/trending/movie/week");
                return NextResponse.json({ results: trending.results?.slice(0, 5) || [] });
            }
        }

        // 2. Fetch Details for each title from TMDB
        const moviePromises = recommendedTitles.map(async (title) => {
            try {
                const searchRes = await fetchFromTMDB(`/search/movie?query=${encodeURIComponent(title)}`);
                const bestMatch = searchRes.results?.[0];
                return bestMatch || null;
            } catch (e) {
                console.error(`[AI Mood] Failed to find movie: ${title}`, e);
                return null;
            }
        });

        const movies = (await Promise.all(moviePromises)).filter(Boolean);

        return NextResponse.json({ results: movies });

    } catch (error: any) {
        console.error("[AI Mood Server Error]:", error.message);
        // Fallback to empty to prevent UI crash
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
