import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { fetchFromTMDB } from "@/lib/tmdb";
import { redirect } from "next/navigation";
import ProfileView from "@/components/ProfileView";

async function getUserData(userId: string) {
    // 1. Fetch Watchlist
    const { data: watchlist } = await supabase
        .from("watchlist")
        .select("movie_id")
        .eq("user_id", userId);

    // 2. Fetch Reviews
    const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    // 3. Fetch User Lists with posters
    let userLists: any[] = [];
    try {
        const { data: lists, error } = await supabase
            .from("lists")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!error && lists) {
            userLists = await Promise.all(lists.map(async (list) => {
                const { data: items } = await supabase
                    .from("list_items")
                    .select("movie_id")
                    .eq("list_id", list.id)
                    .limit(5);

                const movieIds = items?.map(i => i.movie_id) || [];
                const posters = await Promise.all(movieIds.map(async (id) => {
                    try {
                        const movie = await fetchFromTMDB(`/movie/${id}`);
                        return movie.poster_path;
                    } catch (e) {
                        return null;
                    }
                }));

                return { ...list, posters: posters.filter(Boolean) };
            }));
        }
    } catch (e) {
        console.warn("Lists error:", e);
    }

    // 4. Fetch Movie Details for Watchlist
    const watchlistMovies = await Promise.all(
        (watchlist || []).map(async (item) => {
            try {
                return await fetchFromTMDB(`/movie/${item.movie_id}`);
            } catch (e) {
                return null;
            }
        })
    );

    // 5. Fetch Movie Details for Reviews (to show which movie was reviewed)
    const reviewsWithMovies = await Promise.all(
        (reviews || []).map(async (review) => {
            try {
                const movie = await fetchFromTMDB(`/movie/${review.movie_id}`);
                return { ...review, movie };
            } catch (e) {
                return { ...review, movie: null };
            }
        })
    );

    return {
        watchlist: watchlistMovies.filter(Boolean),
        reviews: reviewsWithMovies,
        lists: userLists
    };
}

export default async function ProfilePage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const { watchlist, reviews, lists } = await getUserData(user.id);

    // Serialize user object to pass only needed plain data to client
    const serializableUser = {
        id: user.id,
        firstName: user.firstName,
        imageUrl: user.imageUrl,
    };

    return <ProfileView user={serializableUser} watchlist={watchlist} reviews={reviews} lists={lists} />;
}
