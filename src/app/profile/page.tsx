import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { fetchFromTMDB } from "@/lib/tmdb";
import { redirect } from "next/navigation";
import ProfileView from "@/components/ProfileView";
import { Suspense } from "react";

async function getUserData(userId: string) {
    // 1. Fetch all raw data from Supabase first
    const [watchlistRes, reviewsRes, listsRes, historyRes] = await Promise.all([
        supabase.from("watchlist").select("movie_id").eq("user_id", userId),
        supabase.from("reviews").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("lists").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("watch_history").select("*").eq("user_id", userId).order("last_watched_at", { ascending: false })
    ]);

    const watchlistIds = (watchlistRes.data || []).slice(0, 20); // Limit to 20 for speed
    const reviewData = (reviewsRes.data || []).slice(0, 15);
    const listsData = (listsRes.data || []).slice(0, 10);
    const historyData = (historyRes.data || []).slice(0, 20);

    // 2. Hydrate details in smaller batches or limited sets
    const hydrateMovie = async (id: number) => {
        try {
            return await fetchFromTMDB(`/movie/${id}`);
        } catch (e) {
            return null;
        }
    };

    const [watchlistMovies, reviewsWithMovies, historyMovies, userLists] = await Promise.all([
        Promise.all(watchlistIds.map(i => hydrateMovie(i.movie_id))),
        Promise.all(reviewData.map(async (r) => ({ ...r, movie: await hydrateMovie(r.movie_id) }))),
        Promise.all(historyData.map(async (h) => ({ ...h, movie: await hydrateMovie(h.movie_id) }))),
        Promise.all(listsData.map(async (list) => {
            const { data: items } = await supabase.from("list_items").select("movie_id").eq("list_id", list.id).limit(4);
            const posters = await Promise.all((items || []).map(async (i) => {
                const m = await hydrateMovie(i.movie_id);
                return m?.poster_path;
            }));
            return { ...list, posters: posters.filter(Boolean) };
        }))
    ]);

    const validHistory = historyMovies.filter((h: any) => h.movie);

    return {
        watchlist: watchlistMovies.filter(Boolean),
        reviews: reviewsWithMovies,
        lists: userLists,
        library: {
            watching: validHistory.filter((h: any) => h.status === 'watching').map((h: any) => h.movie),
            finished: validHistory.filter((h: any) => h.status === 'finished').map((h: any) => h.movie)
        }
    };
}

export default async function ProfilePage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    // Serialize user object
    const serializableUser = {
        id: user.id,
        firstName: user.firstName,
        imageUrl: user.imageUrl,
    };

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium">Loading your cinema universe...</p>
                </div>
            </div>
        }>
            <ProfileContent user={serializableUser} />
        </Suspense>
    );
}

async function ProfileContent({ user }: { user: any }) {
    const { watchlist, reviews, lists, library } = await getUserData(user.id);
    return (
        <ProfileView
            user={user}
            watchlist={watchlist}
            reviews={reviews}
            lists={lists}
            library={library}
        />
    );
}
