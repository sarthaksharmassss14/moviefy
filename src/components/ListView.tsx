"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, Edit2, ArrowLeft, X, Save, Search, Plus, Loader2 } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ConfirmModal from "@/components/ConfirmModal";

export default function ListView({ list, movies: initialMovies }: any) {
    const [movies, setMovies] = useState(initialMovies);
    const [isEditing, setIsEditing] = useState(false);
    const [listName, setListName] = useState(list.name);
    const [listDesc, setListDesc] = useState(list.description || "");
    const [isLoading, setIsLoading] = useState(false);

    // Search & Add States
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [movieToRemove, setMovieToRemove] = useState<number | null>(null);
    const [isDeleteListOpen, setIsDeleteListOpen] = useState(false);

    const router = useRouter();

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 1) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/suggestions?query=${encodeURIComponent(searchQuery)}`);
                    const data = await res.json();
                    setSuggestions(data.results || []);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Close suggestions on click outside (simple version)
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDeleteList = async () => {
        setIsLoading(true);
        const { error } = await supabase.from('lists').delete().eq('id', list.id);
        if (error) {
            alert("Failed to delete list");
            setIsLoading(false);
        } else {
            router.push('/profile');
            router.refresh();
        }
    };

    const handleUpdateList = async () => {
        setIsLoading(true);
        const { error } = await supabase
            .from('lists')
            .update({ name: listName, description: listDesc })
            .eq('id', list.id);

        if (error) {
            alert("Failed to update list");
        } else {
            setIsEditing(false);
            router.refresh();
        }
        setIsLoading(false);
    };

    const handleRemoveMovie = async (movieId: number) => {
        const { error } = await supabase
            .from('list_items')
            .delete()
            .match({ list_id: list.id, movie_id: movieId });

        if (error) {
            alert("Failed to remove movie");
        } else {
            setMovies(movies.filter((m: any) => m.id !== movieId));
            router.refresh();
        }
    };

    const handleAddMovie = async (movie: any) => {
        // Optimistic check
        if (movies.find((m: any) => m.id === movie.id)) {
            alert("Movie already in list!");
            return;
        }

        try {
            const { error } = await supabase
                .from('list_items')
                .insert([{ list_id: list.id, movie_id: movie.id }]);

            if (error) throw error;

            // Update local state
            setMovies([movie, ...movies]);
            setSearchQuery("");
            setSuggestions([]);
            router.refresh(); // Sync server state
        } catch (error) {
            console.error("Error adding movie:", error);
            alert("Failed to add movie");
        }
    };

    return (
        <div className="min-h-screen pt-28 pb-20 px-4 md:px-6 max-w-[1600px] mx-auto relative z-0">
            <Link href="/profile?tab=lists" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} />
                Back to Profile
            </Link>

            <div className="glass p-8 rounded-3xl mb-10 animate-fade-in relative overflow-visible z-20">
                <div className="absolute top-0 right-0 p-6 flex gap-3">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Edit List Details"
                            >
                                <Edit2 size={20} />
                            </button>
                            <button
                                onClick={() => setIsDeleteListOpen(true)}
                                className="p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete List"
                            >
                                <Trash2 size={20} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="max-w-xl mx-auto">
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">List Name</label>
                            <input
                                type="text"
                                value={listName}
                                onChange={(e) => setListName(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">Description</label>
                            <textarea
                                value={listDesc}
                                onChange={(e) => setListDesc(e.target.value)}
                                rows={3}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none resize-none"
                            />
                        </div>
                        <button
                            onClick={handleUpdateList}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold text-white tracking-tight">{listName}</h1>
                            <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
                                <span>Created {new Date(list.created_at).toLocaleDateString()}</span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                <span>{movies.length} movies</span>
                            </div>
                        </div>

                        <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                            {listDesc || "No description provided."}
                        </p>

                        {/* SEARCH BAR SECTION */}
                        <div className="w-full max-w-lg text-left relative z-50" ref={searchRef}>
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:bg-white/10 focus-within:border-indigo-500 transition-all shadow-lg backdrop-blur-sm">
                                {isSearching ? (
                                    <Loader2 className="text-indigo-500 animate-spin" size={20} />
                                ) : (
                                    <Search className="text-gray-400" size={20} />
                                )}
                                <input
                                    type="text"
                                    placeholder="Search & Add Movies..."
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-base"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                                        className="text-gray-500 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* DROPDOWN RESULTS */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-[#0f0f12]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in max-h-[320px] overflow-y-auto custom-scrollbar">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white/5">
                                        Suggestions
                                    </div>
                                    {suggestions.map((movie) => (
                                        <button
                                            key={movie.id}
                                            onClick={() => handleAddMovie(movie)}
                                            className="w-full flex items-center gap-4 p-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0 group relative overflow-hidden"
                                        >
                                            <div className="relative w-12 h-16 bg-gray-800 rounded-md overflow-hidden flex-shrink-0 shadow-md">
                                                {movie.poster_path ? (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                                        alt={movie.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">N/A</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate">{movie.title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                                                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-yellow-500">
                                                        ⭐ {movie.vote_average?.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                                <Plus size={18} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div >
                )
                }
            </div >

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>

            {movies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 lg:gap-8">
                    {movies.map((movie: any) => (
                        <div key={movie.id} className="relative group">
                            <MovieCard movie={movie} />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMovieToRemove(movie.id);
                                }}
                                className="absolute top-2 right-2 p-2 bg-black/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                title="Remove from list"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">This list is empty.</p>
                    <p className="text-sm text-gray-400 mt-2">Use the search bar above to add movies.</p>
                </div>
            )}

            {/* Premium Confirm Modals */}
            <ConfirmModal
                isOpen={!!movieToRemove}
                onClose={() => setMovieToRemove(null)}
                onConfirm={() => movieToRemove && handleRemoveMovie(movieToRemove)}
                title="Remove Movie?"
                message="Are you sure you want to remove this movie from your list?"
                confirmLabel="Remove"
                variant="danger"
            />

            <ConfirmModal
                isOpen={isDeleteListOpen}
                onClose={() => setIsDeleteListOpen(false)}
                onConfirm={handleDeleteList}
                title="Delete List?"
                message="This will permanently delete this playlist and all movies inside it. This action cannot be undone."
                confirmLabel="Delete Everything"
                variant="danger"
            />
        </div >
    );
}
