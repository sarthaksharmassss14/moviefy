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
    const newEmbedding = await generateEmbedding(movieDescription);

    const { data: existing } = await supabase
        .from("user_tastes")
        .select("taste_vector")
        .eq("user_id", userId)
        .single();

    if (existing?.taste_vector) {
        // Basic moving average for simplicity
        const currentVector = JSON.parse(existing.taste_vector as string) as number[];
        const updatedVector = currentVector.map((val, i) => (val + newEmbedding[i]) / 2);

        await supabase
            .from("user_tastes")
            .update({ taste_vector: updatedVector, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
    } else {
        await supabase
            .from("user_tastes")
            .insert({ user_id: userId, taste_vector: newEmbedding });
    }
}

export async function getRecommendedMovies(userId: string, candidateMovies: any[]) {
    const { data: profile } = await supabase
        .from("user_tastes")
        .select("taste_vector")
        .eq("user_id", userId)
        .single();

    if (!profile?.taste_vector) return candidateMovies.slice(0, 10);

    const userVector = profile.taste_vector as any as number[];

    // For each candidate movie, we would ideally have its embedding. 
    // Since we don't store all TMDB embeddings, we'll embed the descriptions of the candidates on the fly
    // (Limited to a small batch for performance/rate limits)
    const scoredMovies = await Promise.all(
        candidateMovies.slice(0, 20).map(async (movie) => {
            try {
                const movieEmbedding = await generateEmbedding(movie.overview || "");
                const score = cosineSimilarity(userVector, movieEmbedding);
                return { ...movie, similarityScore: score };
            } catch (e) {
                return { ...movie, similarityScore: 0 };
            }
        })
    );

    return scoredMovies.sort((a, b) => b.similarityScore - a.similarityScore);
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
