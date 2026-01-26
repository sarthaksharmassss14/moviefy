"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { updateUserTaste, generateEmbedding } from "@/lib/ai";

export async function submitReview(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rawMovieId = formData.get("movieId");
    if (!rawMovieId) throw new Error("Movie ID is missing");
    const movieId = parseInt(rawMovieId as string);
    if (isNaN(movieId)) throw new Error("Invalid Movie ID");

    const ratingStr = formData.get("rating") as string;
    const content = (formData.get("content") as string) || "";
    const movieDescription = formData.get("movieDescription") as string;

    const rating = ratingStr ? parseInt(ratingStr) : null;
    let movieEmbedding: number[] | null = null;

    if (movieDescription) {
        try {
            const embed = await generateEmbedding(movieDescription);
            if (Array.isArray(embed) && Array.isArray(embed[0])) {
                movieEmbedding = embed[0] as number[];
            } else {
                movieEmbedding = embed as number[];
            }
        } catch (e) {
            console.warn("[submitReview] AI Embedding failed (silent fallback):", e);
        }
    }

    if (!rating && !content.trim()) {
        throw new Error("Please provide either a rating or a review.");
    }

    const { error } = await supabase.from("reviews").upsert({
        user_id: userId,
        movie_id: movieId,
        ...(rating !== null && { rating }),
        ...(content.trim() && { content: content.trim() }),
        ...(movieEmbedding && { embedding: movieEmbedding }),
        created_at: new Date().toISOString(),
    }, {
        onConflict: 'user_id,movie_id'
    });

    if (error) {
        console.error("[submitReview] Supabase Error:", error.message);
        throw new Error(`Database error: ${error.message}`);
    }

    // Update user taste profile for RAG if high rating is given
    // FIRE AND FORGET: Do not 'await' this so the user gets instant feedback
    if (rating && rating >= 4 && movieDescription) {
        updateUserTaste(userId, movieDescription).catch(e =>
            console.warn("[submitReview] Background taste update failed:", e)
        );
    }

    // If user provided a rating, remove from watchlist automatically
    if (rating !== null) {
        await supabase.from("watchlist").delete().eq("user_id", userId).eq("movie_id", movieId);
    }

    revalidatePath(`/movies/${movieId}`);
    revalidatePath(`/profile`);
}

export async function toggleWatchlist(movieId: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Use maybeSingle to prevent PGRST116 errors when record is missing
    const { data: existing, error } = await supabase
        .from("watchlist")
        .select("user_id")
        .eq("user_id", userId)
        .eq("movie_id", movieId)
        .maybeSingle();

    if (error) {
        console.error("[toggleWatchlist] DB Error:", error.message);
        throw new Error("Failed to check watchlist status");
    }

    if (existing) {
        await supabase.from("watchlist").delete().eq("user_id", userId).eq("movie_id", movieId);
    } else {
        await supabase.from("watchlist").insert({ user_id: userId, movie_id: movieId });
    }

    revalidatePath(`/movies/${movieId}`);
    revalidatePath(`/profile`);
}
