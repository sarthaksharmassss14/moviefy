import { supabase } from "@/lib/supabase";
import { fetchFromTMDB } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import ListView from "@/components/ListView";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Auth Check
    const { userId } = await auth();
    if (!userId) redirect("/");

    // Fetch List Details
    const { data: list, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !list) {
        return (
            <main className="min-h-screen pt-24 pb-20 px-4 text-center">
                <Navbar />
                <h1 className="text-2xl font-bold text-white mb-2">List not found</h1>
                <p className="text-gray-400">The list you are looking for does not exist or has been deleted.</p>
            </main>
        );
    }

    // Security Check: Only allow owner to view/edit (for now)
    if (list.user_id !== userId) {
        return (
            <main className="min-h-screen pt-24 pb-20 px-4 text-center">
                <Navbar />
                <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this list.</p>
            </main>
        );
    }

    // Fetch List Items (Movie IDs)
    const { data: items } = await supabase
        .from('list_items')
        .select('movie_id, added_at')
        .eq('list_id', id)
        .order('added_at', { ascending: false });

    // Fetch Movie Details from TMDB
    // We filter out any null results in case a movie ID is invalid or API fails
    const movies = (await Promise.all(
        (items || []).map(async (item) => {
            try {
                const movie = await fetchFromTMDB(`/movie/${item.movie_id}`);
                if (!movie || !movie.id) return null;
                return { ...movie, added_at: item.added_at };
            } catch (e) {
                return null;
            }
        })
    )).filter(Boolean);

    return (
        <main>
            <Navbar />
            <ListView list={list} movies={movies} />
        </main>
    )
}
