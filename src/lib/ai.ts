import { HfInference } from "@huggingface/inference";
import { supabase } from "./supabase";

const hf = new HfInference(process.env.HF_TOKEN);

export async function generateEmbedding(text: string | string[]): Promise<number[] | number[][]> {
    const result = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
    });
    return result as any;
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
        // 1. Get user taste vector and rated movies
        const [tasteRes, ratedRes] = await Promise.all([
            supabase.from("user_tastes").select("taste_vector").eq("user_id", userId).single(),
            supabase.from("reviews").select("movie_id").eq("user_id", userId)
        ]);

        if (!tasteRes.data?.taste_vector) {
            console.log("[AI] No taste profile found. Falling back to trending.");
            return [];
        }

        const userVector = tasteRes.data.taste_vector;
        const excludedIds = (ratedRes.data || []).map(r => r.movie_id);

        // 2. Vector search in database for similar movie embeddings
        const { data: matched, error: rpcError } = await supabase.rpc('match_movie_recommendations', {
            query_embedding: userVector,
            match_threshold: 0.3, // Lowered from 0.4 for better discovery
            match_count: 15,
            excluded_ids: excludedIds
        });

        if (rpcError) throw rpcError;

        if (!matched || matched.length === 0) {
            console.log("[AI] No similar movies found in Knowledge Base.");
            return [];
        }

        // 3. Fetch details from TMDB
        const { fetchFromTMDB } = await import("./tmdb");
        const recommendedMovies = await Promise.all(
            matched.map(async (m: any) => {
                try {
                    return await fetchFromTMDB(`/movie/${m.movie_id}`);
                } catch (e) {
                    return null;
                }
            })
        );

        return recommendedMovies.filter(Boolean);
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
