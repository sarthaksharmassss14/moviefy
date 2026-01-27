import { supabase } from "./supabase";
import { getLocalEmbedding } from "./embedding";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

export async function generateEmbedding(text: string | string[]): Promise<number[] | number[][]> {
    // 1. Production (Vercel): Use external API to avoid serverless timeouts/memory crashes
    if (process.env.VERCEL) {
        console.log("[AI] Production detected: Using HuggingFace API for embeddings...");
        const result = await hf.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: text,
        });
        return result as any;
    }

    // 2. Local: Use fast, local ONNX model
    console.log("[AI] Local detected: Using on-device RAG...");
    return await getLocalEmbedding(text);
}

export async function updateUserTaste(userId: string, movieDescription: string) {
    console.log(`[AI] Updating taste profile for user ${userId}...`);
    try {
        const newEmbedding = await generateEmbedding(movieDescription) as number[];

        const { data: existing, error: fetchError } = await supabase
            .from("user_tastes")
            .select("taste_vector, rating_count")
            .eq("user_id", userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("[AI] Error fetching user taste:", fetchError);
        }

        let updatedVector = newEmbedding;
        let newCount = 1;

        if (existing?.taste_vector) {
            const currentVector: number[] = typeof existing.taste_vector === 'string'
                ? JSON.parse(existing.taste_vector)
                : existing.taste_vector;

            const currentCount = existing.rating_count || 1;
            newCount = currentCount + 1;

            // True Average: ((OldVector * Count) + NewVector) / (Count + 1)
            updatedVector = currentVector.map((val, i) =>
                ((val * currentCount) + newEmbedding[i]) / newCount
            );
        }

        const { error: upsertError } = await supabase
            .from("user_tastes")
            .upsert({
                user_id: userId,
                taste_vector: updatedVector,
                rating_count: newCount,
                updated_at: new Date().toISOString()
            });

        if (upsertError) throw upsertError;
        console.log(`[AI] Taste profile updated with ${newCount} samples.`);
    } catch (e: any) {
        console.error("[AI] Critical error in updateUserTaste:", e.message);
    }
}

export async function getRecommendedMovies(userId: string, candidateMovies: any[]) {
    console.log(`[AI] Scoring ${candidateMovies.length} local candidates for user ${userId}...`);
    try {
        const { data: profile } = await supabase
            .from("user_tastes")
            .select("taste_vector")
            .eq("user_id", userId)
            .single();

        if (!profile?.taste_vector) return candidateMovies.slice(0, 10);

        let userVector: number[] = typeof profile.taste_vector === 'string'
            ? JSON.parse(profile.taste_vector)
            : profile.taste_vector as any;

        const candidates = candidateMovies.slice(0, 15); // Limit to 15 for speed
        const texts = candidates.map(m => m.overview || m.title || "");

        // Batch generate embeddings
        const movieEmbeddings = await generateEmbedding(texts) as number[][];

        const scoredMovies = candidates.map((movie, index) => {
            const score = cosineSimilarity(userVector, movieEmbeddings[index]);
            return { ...movie, similarityScore: score };
        });

        return scoredMovies.sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (e: any) {
        console.error("[AI] Local Scoring Error:", e.message);
        return candidateMovies.slice(0, 10);
    }
}

export async function getPickedForYou(userId: string) {
    console.log(`[AI] Generating proactive recommendations for user ${userId}...`);
    try {
        // 1. Get user taste vector, rated movies, and watchlist
        const [tasteRes, ratedRes, watchlistRes] = await Promise.all([
            supabase.from("user_tastes").select("taste_vector, rating_count").eq("user_id", userId).single(),
            supabase.from("reviews").select("movie_id, rating, created_at").eq("user_id", userId).order('created_at', { ascending: false }),
            supabase.from("watchlist").select("movie_id").eq("user_id", userId)
        ]);

        console.log(`[AI] Taste Probe for ${userId}:`, {
            hasVector: !!tasteRes.data?.taste_vector,
            ratingCount: tasteRes.data?.rating_count,
            ratedCount: ratedRes.data?.length,
            error: tasteRes.error?.message
        });

        const ratingCount = tasteRes.data?.rating_count || 0;
        const actualReviews = ratedRes.data || [];
        const actualRatedCount = actualReviews.length;

        if (ratingCount < 4 && actualRatedCount < 4) {
            console.log(`[AI] Insufficient data. Rating Count: ${ratingCount}, Actual Reviews: ${actualRatedCount}. Need 4.`);
            return [];
        }

        const userVector = tasteRes.data?.taste_vector;
        const ratedIds = actualReviews.map(r => r.movie_id);
        const watchlistIds = (watchlistRes.data || []).map(w => w.movie_id);
        const excludedIds = Array.from(new Set([...ratedIds, ...watchlistIds]));

        let recommendedMovies: any[] = [];
        const { fetchFromTMDB } = await import("./tmdb");

        // 2. Try RAG (Vector Search) if vector exists
        if (userVector) {
            const { data: matched, error: rpcError } = await supabase.rpc('match_movie_recommendations', {
                query_embedding: userVector,
                match_threshold: 0.25,
                match_count: 15,
                excluded_ids: excludedIds
            });

            if (rpcError) console.error("[AI] RPC Error:", rpcError);

            if (matched && matched.length > 0) {
                console.log(`[AI] Found ${matched.length} vector matches. Fetching details...`);
                const ragResults = await Promise.all(
                    matched.map(async (m: any) => {
                        try {
                            return await fetchFromTMDB(`/movie/${m.movie_id}`);
                        } catch (e) {
                            return null;
                        }
                    })
                );
                recommendedMovies = ragResults.filter(Boolean);
            } else {
                console.log("[AI] No similar movies found in Knowledge Base (Vector Search returned 0).");
            }
        }

        // 3. Fallback: Content-based filtering using TMDB (if RAG failed)
        if (recommendedMovies.length === 0 && actualReviews.length > 0) {
            console.log("[AI] RAG returned 0 results. engaging Multi-Source TMDB Fallback.");

            // Get top 3 highly rated movies (favoring recent ones)
            const topLiked = actualReviews
                .filter((r: any) => r.rating >= 4)
                .sort((a: any, b: any) => {
                    // Sort by rating desc, then created_at desc
                    if (b.rating !== a.rating) return b.rating - a.rating;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .slice(0, 3);

            if (topLiked.length > 0) {
                console.log(`[AI] Generating recommendations based on ${topLiked.length} favorite movies:`, topLiked.map((m: any) => m.movie_id));
                try {
                    const fallbackPromises = topLiked.map((m: any) =>
                        fetchFromTMDB(`/movie/${m.movie_id}/recommendations`).then(res => res?.results || [])
                    );

                    const resultsArrays = await Promise.all(fallbackPromises);
                    const combined = resultsArrays.flat();

                    // Deduplicate and Exclude
                    const seen = new Set(excludedIds);
                    recommendedMovies = combined.filter((m: any) => {
                        if (!m || seen.has(m.id)) return false;
                        seen.add(m.id);
                        return true;
                    });

                    // Shuffle slightly to mix sources
                    recommendedMovies = recommendedMovies.sort(() => Math.random() - 0.5).slice(0, 10);

                } catch (err) {
                    console.error("[AI] Multi-Source Fallback failed:", err);
                }
            } else {
                console.log("[AI] No highly rated movies found to base fallback on.");
            }
        }

        const validMovies = recommendedMovies.filter(Boolean);
        console.log(`[AI] Returning ${validMovies.length} valid movies to UI.`);
        return validMovies;

    } catch (e: any) {
        console.error("[AI] PickedForYou Error:", e.message);
        return [];
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

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
