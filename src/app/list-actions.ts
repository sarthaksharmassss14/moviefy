"use server";

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createList(name: string, description: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { error } = await supabase.from("movie_lists").insert({
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

    // Fetch current movies
    const { data: list } = await supabase
        .from("movie_lists")
        .select("movies")
        .eq("id", listId)
        .single();

    if (!list) return;

    const updatedMovies = [...(list.movies || []), movieId];

    await supabase
        .from("movie_lists")
        .update({ movies: updatedMovies })
        .eq("id", listId);

    revalidatePath("/lists");
}
