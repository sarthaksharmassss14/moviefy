"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createList(name: string, description: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { error } = await supabase.from("lists").insert({
        user_id: userId,
        name,
        description,
    });

    if (error) throw error;
    revalidatePath("/lists");
}

export async function addMovieToList(listId: string, movieId: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Check if list belongs to user (Security)
    const { data: list } = await supabase
        .from("lists")
        .select("id")
        .eq("id", listId)
        .eq("user_id", userId)
        .single();

    if (!list) throw new Error("List not found or unauthorized");

    // Insert into list_items (normalized)
    const { error } = await supabase.from("list_items").insert({
        list_id: listId,
        movie_id: movieId
    });

    if (error) {
        // Ignore duplicate key error (already in list)
        if (error.code !== '23505') throw error;
    }

    revalidatePath("/lists");
}
