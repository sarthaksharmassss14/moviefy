import { fetchFromTMDB } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";

async function getPersonDetails(id: string) {
    const [person, movieCredits] = await Promise.all([
        fetchFromTMDB(`/person/${id}`),
        fetchFromTMDB(`/person/${id}/movie_credits`),
    ]);

    return { person, movieCredits };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { person, movieCredits } = await getPersonDetails(id);

    // 1. PROCESS ACTING CREDITS
    const actingCredits = (movieCredits.cast || []).filter((m: any) => m.poster_path);
    const uniqueActing = new Map();
    actingCredits.forEach((m: any) => {
        if (!uniqueActing.has(m.id)) uniqueActing.set(m.id, m);
    });
    const sortedActing = Array.from(uniqueActing.values())
        .sort((a: any, b: any) => (b.vote_count * b.vote_average) - (a.vote_count * a.vote_average))
        .slice(0, 30);

    // 2. PROCESS DIRECTING WORK
    const directedCredits = (movieCredits.crew || []).filter((m: any) => m.job === "Director" && m.poster_path);
    const uniqueDirected = new Map();
    directedCredits.forEach((m: any) => {
        if (!uniqueDirected.has(m.id)) uniqueDirected.set(m.id, m);
    });
    const sortedDirected = Array.from(uniqueDirected.values())
        .sort((a: any, b: any) => b.vote_average - a.vote_average)
        .slice(0, 30);

    // 3. FETCH RUNTIME for Directing work
    const processedDirected: any[] = [];
    for (const m of sortedDirected.slice(0, 15)) {
        try {
            const details = await fetchFromTMDB(`/movie/${m.id}`);
            if (details.runtime >= 60) processedDirected.push(details);
        } catch (e) {
            if (m.vote_count > 10) processedDirected.push(m);
        }
    }

    // 4. FETCH RUNTIME for top Acting work
    const processedActing: any[] = [];
    for (const m of sortedActing.slice(0, 15)) {
        try {
            const details = await fetchFromTMDB(`/movie/${m.id}`);
            if (details.runtime >= 60) processedActing.push(details);
        } catch (e) {
            if (m.vote_count > 10) processedActing.push(m);
        }
    }

    return (
        <main className="min-h-screen pb-20">
            <Navbar />

            <div className="pt-[100px] pb-10" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)' }}>
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex gap-10 items-start max-md:flex-col max-md:items-center">
                        <div className="shrink-0 overflow-hidden rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                            <Image
                                src={person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : "/no-actor.svg"}
                                alt={person.name}
                                width={300}
                                height={450}
                                className="block w-[300px] h-auto object-cover max-md:w-full max-md:max-w-[300px]"
                                priority
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent max-md:text-center max-md:text-4xl">
                                {person.name}
                            </h1>

                            <div className="flex gap-6 mb-8 text-zinc-400 max-md:justify-center">
                                {person.birthday && (
                                    <div className="flex items-center gap-2 text-base">
                                        <Calendar size={18} className="text-zinc-400" />
                                        <span>{new Date(person.birthday).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {person.place_of_birth && (
                                    <div className="flex items-center gap-2 text-base">
                                        <MapPin size={18} className="text-zinc-400" />
                                        <span>{person.place_of_birth}</span>
                                    </div>
                                )}
                            </div>

                            <div className="glass p-6 leading-relaxed text-gray-300 max-h-[320px] overflow-y-auto custom-scrollbar">
                                <h3 className="text-white font-bold mb-3 text-lg">Biography</h3>
                                <p className="text-sm">{person.biography || "No biography available."}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {processedActing.length > 0 && (
                <div className="max-w-[1200px] mx-auto px-6 mt-12">
                    <h2 className="text-3xl font-bold mb-8">
                        Filmography <span className="text-zinc-400 text-2xl">(As Actor)</span>
                    </h2>
                    <div className="shelf-container">
                        <div className="movie-grid shelf-grid">
                            {processedActing.map((movie: any) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                    </div>
                    <div className="shelf-indicator mobile-only mt-4">
                        <div className="swipe-line">
                            <div className="swipe-dot"></div>
                        </div>
                    </div>
                </div>
            )}

            {processedDirected.length > 0 && (
                <div className="max-w-[1200px] mx-auto px-6 mt-16">
                    <h2 className="text-3xl font-bold mb-8 border-t border-white/5 pt-12">
                        Directed Work <span className="text-zinc-400 text-2xl">(Director)</span>
                    </h2>
                    <div className="shelf-container">
                        <div className="movie-grid shelf-grid">
                            {processedDirected.map((movie: any) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                    </div>
                    <div className="shelf-indicator mobile-only mt-4">
                        <div className="swipe-line">
                            <div className="swipe-dot"></div>
                        </div>
                    </div>
                </div>
            )}

            {processedActing.length === 0 && processedDirected.length === 0 && (
                <div className="max-w-[1200px] mx-auto px-6 mt-20 text-center">
                    <p className="text-zinc-500 italic text-xl">No feature films found for this person.</p>
                </div>
            )}
        </main>
    );
}
