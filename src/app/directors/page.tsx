import { fetchFromTMDB } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { Film } from "lucide-react";

const DIRECTOR_IDS = [
    525,    // Christopher Nolan
    138,    // Quentin Tarantino
    578,    // Ridley Scott
    240,    // Stanley Kubrick
    7467,   // David Fincher
    5602,   // David Lynch
    1776,   // Francis Ford Coppola
    2710,   // James Cameron
    488,    // Steven Spielberg
    4762,    // Paul Thomas Anderson
    5655,   // Wes Anderson
    2636,   // Alfred Hitchcock
    6648,   // Ingmar Bergman
    440,    // Brian De Palma
    1032,   // Martin Scorsese
    137427, // Denis Villeneuve
    190,    // Clint Eastwood
    3146,   // Billy Wilder
    1223,   // Ethan Coen 
    3556,   // Roman Polanski
    42,     // Lars von Trier
    10828,  // Guillermo del Toro
];

async function getDirectors() {
    const results = await Promise.allSettled(
        DIRECTOR_IDS.map(id => fetchFromTMDB(`/person/${id}`))
    );

    return results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map(r => r.value);
}

export default async function DirectorsPage() {
    const directors = await getDirectors();

    return (
        <main className="min-h-screen pb-20">
            <Navbar />

            <div className="pt-[140px] px-6 max-w-[1400px] mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                        <Film className="text-indigo-400" size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Legendary Directors
                        </h1>
                        <p className="text-zinc-500 mt-1">The visionary minds behind cinema's greatest masterpieces</p>
                    </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-8">
                    {directors.map((director) => (
                        <Link
                            key={director.id}
                            href={`/person/${director.id}`}
                            className="group p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.05] transition-all duration-300 cubic-bezier[0.4, 0, 0.2, 1] hover:bg-white/[0.05] hover:-translate-y-2 hover:border-indigo-500/20 hover:shadow-[0_20_40px_rgba(0,0,0,0.4)]"
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="relative w-32 h-32 rounded-full p-1 border-2 border-transparent group-hover:border-indigo-500 transition-all duration-300 overflow-hidden shadow-2xl">
                                    <div className="w-full h-full rounded-full overflow-hidden relative">
                                        <Image
                                            src={director.profile_path ? `https://image.tmdb.org/t/p/w185${director.profile_path}` : "/no-actor.png"}
                                            alt={director.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors duration-300">
                                        {director.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        View Masterpieces
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </main>
    );
}
