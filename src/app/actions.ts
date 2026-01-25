"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { updateUserTaste } from "@/lib/ai";

export async function submitReview(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const movieId = parseInt(formData.get("movieId") as string);
    const rating = parseInt(formData.get("rating") as string);
    const content = formData.get("content") as string;
    const movieDescription = formData.get("movieDescription") as string;

    const { error } = await supabase.from("reviews").upsert({
        user_id: userId,
        movie_id: movieId,
        rating,
        content,
        created_at: new Date().toISOString(),
    });

    if (error) throw error;

    // Update user taste profile for RAG
    if (rating >= 4) {
        await updateUserTaste(userId, movieDescription);
    }

    revalidatePath(`/movies/${movieId}`);
}

export async function toggleWatchlist(movieId: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data: existing } = await supabase
        .from("watchlist")
        .select()
        .eq("user_id", userId)
        .eq("movie_id", movieId)
        .single();

    if (existing) {
        await supabase.from("watchlist").delete().eq("user_id", userId).eq("movie_id", movieId);
    } else {
        await supabase.from("watchlist").insert({ user_id: userId, movie_id: movieId });
    }

    revalidatePath(`/movies/${movieId}`);
}
