import { HfInference } from "@huggingface/inference";
import { supabase } from "./supabase";

const hf = new HfInference(process.env.HF_TOKEN);

export async function generateEmbedding(text: string): Promise<number[]> {
    const result = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
    });
    return result as number[];
}

export async function updateUserTaste(userId: string, movieDescription: string) {
    console.log(`[AI] Updating taste for user ${userId}...`);
    try {
        const newEmbedding = await generateEmbedding(movieDescription);

        const { data: existing, error: fetchError } = await supabase
            .from("user_tastes")
            .select("taste_vector")
            .eq("user_id", userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error("[AI] Error fetching user taste:", fetchError);
        }

        let updatedVector = newEmbedding;

        if (existing?.taste_vector) {
            // Parse existing vector (Supabase sometimes returns it as a string)
            let currentVector: number[] = [];
            if (typeof existing.taste_vector === 'string') {
                currentVector = JSON.parse(existing.taste_vector);
            } else {
                currentVector = existing.taste_vector;
            }

            // Moving average: (Old + New) / 2
            updatedVector = currentVector.map((val, i) => (val + newEmbedding[i]) / 2);
        }

        const { error: upsertError } = await supabase
            .from("user_tastes")
            .upsert({
                user_id: userId,
                taste_vector: updatedVector,
                updated_at: new Date().toISOString()
            });

        if (upsertError) {
            console.error("[AI] Failed to update user taste:", upsertError);
            throw upsertError;
        }
        console.log(`[AI] Successfully updated taste profile!`);
    } catch (e: any) {
        console.error("[AI] Critical error in updateUserTaste:", e.message);
    }
}

export async function getRecommendedMovies(userId: string, candidateMovies: any[]) {
    try {
        const { data: profile } = await supabase
            .from("user_tastes")
            .select("taste_vector")
            .eq("user_id", userId)
            .single();

        // FALLBACK 1: If no profile exists, return candidates directly (Trending/Popular)
        if (!profile?.taste_vector) {
            console.log(`[AI] No taste profile found for ${userId}. Returning trending movies.`);
            return candidateMovies.slice(0, 10);
        }

        let userVector: number[] = [];
        if (typeof profile.taste_vector === 'string') {
            userVector = JSON.parse(profile.taste_vector);
        } else {
            userVector = profile.taste_vector as any; // Cast for TS
        }

        console.log(`[AI] Scoring ${candidateMovies.length} movies against user profile...`);

        // Batch processing to avoid event loop blocking
        const scoredMovies = await Promise.all(
            candidateMovies.slice(0, 20).map(async (movie) => {
                try {
                    // Use overview if available, otherwise title
                    const text = movie.overview || movie.title;
                    if (!text) return { ...movie, similarityScore: 0 };

                    const movieEmbedding = await generateEmbedding(text);
                    const score = cosineSimilarity(userVector, movieEmbedding);
                    return { ...movie, similarityScore: score };
                } catch (e) {
                    return { ...movie, similarityScore: 0 };
                }
            })
        );

        const sorted = scoredMovies.sort((a, b) => b.similarityScore - a.similarityScore);
        console.log(`[AI] Recommended top match: ${sorted[0]?.title} (Score: ${sorted[0]?.similarityScore})`);

        return sorted;
    } catch (e) {
        console.error("[AI] Recommendation Error:", e);
        return candidateMovies.slice(0, 10); // Ultimate fallback
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
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
