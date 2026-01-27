import { supabase } from "@/lib/supabase";
import { fetchFromTMDB } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import ListView from "@/components/ListView";
import { auth } from "@clerk/nextjs/server";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 1. Get current user (might be null)
    const { userId } = await auth();

    // 2. Fetch List Details
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

    // 3. Security Check: Allow owner or public list viewing
    const isOwner = userId === list.user_id;
    if (!list.is_public && !isOwner) {
        return (
            <main className="min-h-screen pt-24 pb-20 px-4 text-center">
                <Navbar />
                <h1 className="text-2xl font-bold text-white mb-2">Private List</h1>
                <p className="text-gray-400">This list is private and can only be viewed by the owner.</p>
            </main>
        );
    }

    // 4. Fetch List Items (Movie IDs)
    const { data: items } = await supabase
        .from('list_items')
        .select('movie_id, added_at')
        .eq('list_id', id)
        .order('added_at', { ascending: false });

    // 5. Fetch Movie Details from TMDB
    const movies = (await Promise.all(
        (items || []).map(async (item) => {
            if (!item.movie_id) return null;
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
    );
}
