import { supabase } from "@/lib/supabase";
import { fetchFromTMDB } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WatchPartyRoom from "@/components/WatchPartyRoom";

export default async function PartyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    // Fetch Party Details
    const { data: party, error } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !party || !party.is_active) {
        return (
            <main className="min-h-screen pt-24 pb-20 px-4 text-center">
                <Navbar />
                <h1 className="text-2xl font-bold text-white mb-2">Room not found</h1>
                <p className="text-gray-400">This watch party has expired or does not exist.</p>
            </main>
        );
    }

    // Fetch Movie Info
    const movie = await fetchFromTMDB(`/movie/${party.movie_id}`);

    const serializableUser = {
        id: user.id,
        name: user.firstName || "Anonymous",
        image: user.imageUrl
    };

    return (
        <main className="min-h-screen bg-[#0a0a0b]">
            <Navbar />
            <WatchPartyRoom
                party={party}
                movie={movie}
                user={serializableUser}
            />
        </main>
    );
}
