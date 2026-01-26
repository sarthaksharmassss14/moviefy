import { fetchFromTMDB } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import Image from "next/image";
import { Calendar, MapPin, Star } from "lucide-react";

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

    // Filter movies with posters and sort by rating
    const movies = (movieCredits.cast || [])
        .filter((m: any) => m.poster_path && m.vote_average > 0)
        .sort((a: any, b: any) => b.vote_average - a.vote_average);

    return (
        <main className="min-h-screen pb-20">
            <Navbar />

            <div className="pt-[100px] pb-10" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)' }}>
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex gap-10 items-start max-md:flex-col max-md:items-center">
                        <div className="shrink-0 overflow-hidden rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                            <Image
                                src={person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : "/no-actor.png"}
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

                            <div className="glass p-6 leading-relaxed text-gray-300">
                                <h3 className="text-white font-bold mb-3 text-lg">Biography</h3>
                                <p>{person.biography || "No biography available."}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 mt-5">
                <h2 className="text-3xl font-bold mb-8">
                    Filmography <span className="text-zinc-400 text-2xl">({movies.length})</span>
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-5 gap-y-8">
                    {movies.map((movie: any) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            </div>
        </main>
    );
}
