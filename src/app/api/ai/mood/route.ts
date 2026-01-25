import { NextRequest, NextResponse } from "next/server";
import { fetchFromTMDB } from "@/lib/tmdb";
import { generateEmbedding } from "@/lib/ai";

export async function POST(req: NextRequest) {
    try {
        if (!process.env.HF_TOKEN) {
            throw new Error("AI Setup Incomplete: HF_TOKEN is missing.");
        }
        const { query } = await req.json();
        if (!query) return NextResponse.json({ results: [] });

        console.log(`[AI Mood] Starting discovery for: "${query}"`);

        // 1. Get a pool of movies (Search + Trending)
        const [searchRes, trending] = await Promise.all([
            fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}`),
            fetchFromTMDB("/trending/movie/week"),
        ]);

        const pool = [
            ...(searchRes.results || []),
            ...(trending.results || []),
        ];

        const uniqueCandidates = Array.from(new Map(pool.map(m => [m.id, m])).values())
            .filter((m: any) => m.overview && m.overview.length > 10)
            .slice(0, 5); // Just 5 for maximum speed during testing

        console.log(`[AI Mood] Candidates pool: ${uniqueCandidates.length}`);

        // 2. Generate embedding for the user's mood query
        const queryEmbedding = await generateEmbedding(query);

        // 3. Rank top 5 candidates
        const scoredMovies = await Promise.all(
            uniqueCandidates.map(async (movie) => {
                try {
                    const textToEmbed = `${movie.title}: ${movie.overview}`;
                    const movieEmbedding = await generateEmbedding(textToEmbed);
                    const similarity = cosineSimilarity(queryEmbedding, movieEmbedding);
                    return { ...movie, aiScore: similarity };
                } catch (e: any) {
                    console.error(`[AI Mood] Failed embedding for ${movie.title}:`, e.message);
                    return { ...movie, aiScore: 0 };
                }
            })
        );
        console.log(`[AI Mood] Ranking complete.`);

        const sorted = scoredMovies.sort((a, b) => b.aiScore - a.aiScore);

        return NextResponse.json({ results: sorted });
    } catch (error: any) {
        console.error("[AI Mood Server Error]:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;
    return dotProduct / magnitude;
}
