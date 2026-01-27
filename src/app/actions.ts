"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase, getSupabaseClient } from "@/lib/supabase";
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

    if (!rating && !content.trim()) {
        throw new Error("Please provide either a rating or a review.");
    }

    // 1. Save core review data IMMEDIATELY (Fast part)
    const { error } = await supabase.from("reviews").upsert({
        user_id: userId,
        movie_id: movieId,
        ...(rating !== null && { rating }),
        ...(content.trim() && { content: content.trim() }),
        created_at: new Date().toISOString(),
    }, {
        onConflict: 'user_id,movie_id'
    });

    if (error) {
        console.error("[submitReview] Supabase Error:", error.message);
        throw new Error(`Database error: ${error.message}`);
    }

    // 2. Handle AI and side effects
    if (movieDescription) {
        try {
            // Generate embedding for the review record
            const embed = await generateEmbedding(movieDescription);
            const movieEmbedding = Array.isArray(embed) && Array.isArray(embed[0])
                ? embed[0] as number[]
                : embed as number[];

            // Update the review with the embedding
            await supabase.from("reviews")
                .update({ embedding: movieEmbedding })
                .eq("user_id", userId)
                .eq("movie_id", movieId);

            // Update user taste profile for RAG if high rating
            if (rating && rating >= 4) {
                await updateUserTaste(userId, movieDescription);
            }
        } catch (e) {
            console.error("[submitReview] AI Task failed:", e);
        }
    }

    // 3. Fast Side Effects
    if (rating !== null) {
        Promise.all([
            supabase.from("watchlist").delete().eq("user_id", userId).eq("movie_id", movieId),
            trackWatch(movieId, 'finished')
        ]).catch(e => console.error("Side effects failed:", e));
    }

    revalidatePath(`/movies/${movieId}`);
    revalidatePath(`/profile`);
    revalidatePath('/');
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

export async function trackWatch(movieId: number, status: 'watching' | 'finished' = 'watching') {
    const { userId } = await auth();
    if (!userId) return;

    const { error } = await supabase.from("watch_history").upsert({
        user_id: userId,
        movie_id: movieId,
        status,
        last_watched_at: new Date().toISOString()
    }, {
        onConflict: 'user_id,movie_id'
    });

    if (error) {
        console.error("[trackWatch] Error:", error.message);
    }

    revalidatePath('/');
    revalidatePath('/profile');
}

export async function createWatchParty(movieId: number, roomName: string) {
    const { userId, getToken } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const token = await getToken({ template: 'supabase' });
        const authSupabase = getSupabaseClient(token || undefined);

        const { data, error } = await authSupabase
            .from("watch_parties")
            .insert({
                host_id: userId,
                movie_id: movieId,
                room_name: roomName
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data.id };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function sendPartyMessage(partyId: string, content: string, userName: string) {
    const { userId, getToken } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const token = await getToken({ template: 'supabase' });
    const authSupabase = getSupabaseClient(token || undefined);

    const { error } = await authSupabase
        .from("watch_party_messages")
        .insert({
            party_id: partyId,
            user_id: userId,
            user_name: userName,
            content
        });

    if (error) {
        console.error("Message error:", error);
        throw new Error(error.message);
    }
}

export async function deleteWatchParty(partyId: string) {
    const { userId, getToken } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
        const token = await getToken({ template: 'supabase' });
        const authSupabase = getSupabaseClient(token || undefined);

        // We only allow the host to delete their own party
        const { error } = await authSupabase
            .from("watch_parties")
            .delete()
            .eq("id", partyId)
            .eq("host_id", userId);

        if (error) {
            console.error("Delete Party Error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath('/');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
