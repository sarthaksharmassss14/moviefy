import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB, MOVIE_GENRES, MOVIE_LANGUAGES } from "@/lib/tmdb";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import { auth } from "@clerk/nextjs/server";
import { getMoodRecommendations } from "@/lib/recommendations";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string, mood?: string, genre?: string, year?: string, lang?: string, page?: string }> }) {
    const { q, mood, genre, year, lang, page: pageParam } = await searchParams;
    const page = parseInt(pageParam || "1");
    const { userId } = await auth();

    let results = [];
    let title: any = "Browse Movies";
    let totalPages = 1;

    if (mood) {
        const data = await getMoodRecommendations(mood, userId);
        results = data.results || [];
        totalPages = 1;
        title = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles className="text-purple-500" size={24} color="#a855f7" />
                <span>AI Vibe: {mood}</span>
            </div>
        );
    } else if (q) {
        const data = await fetchFromTMDB("/search/movie", { query: q, page: page.toString() });
        results = data.results || [];
        totalPages = data.total_pages || 1;
        title = `Search results for "${q}"`;
    } else if (genre || year || lang) {
        const params: any = {
            sort_by: "popularity.desc",
            "vote_count.gte": 100, // Minimal quality filter to show "Top" movies
            page: page.toString()
        };
        if (genre) params.with_genres = genre;
        if (lang) params.with_original_language = lang;

        if (year) {
            if (year.endsWith('s')) {
                const decadeStart = parseInt(year);
                params["primary_release_date.gte"] = `${decadeStart}-01-01`;
                params["primary_release_date.lte"] = `${decadeStart + 9}-12-31`;
            } else {
                params.primary_release_year = year;
            }
        }

        const data = await fetchFromTMDB("/discover/movie", params);
        results = data.results || [];
        totalPages = data.total_pages || 1;

        const langName = lang ? MOVIE_LANGUAGES[lang] : "";
        const genreName = genre ? MOVIE_GENRES[parseInt(genre)] : "";

        if (genre && lang) title = `${langName} ${genreName} Movies`;
        else if (genre) title = `${genreName} Movies`;
        else if (lang) title = `${langName} Movies`;
        else if (year) title = year.endsWith('s') ? `${year} Movies` : `Movies from ${year}`;
        else title = "Discover Movies";
    } else {
        const data = await fetchFromTMDB("/movie/popular", { page: page.toString() });
        results = data.results || [];
        totalPages = data.total_pages || 1;
    }

    const yearFilters = ["2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "1950s", "1940s"];

    // Helper for pagination links
    const getPageLink = (p: number) => {
        const params = new URLSearchParams({
            ...(q && { q }),
            ...(mood && { mood }),
            ...(genre && { genre }),
            ...(year && { year }),
            ...(lang && { lang }),
            page: p.toString()
        });
        return `/search?${params.toString()}`;
    };

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="search-container">
                <aside className="sidebar-filters glass">
                    <div className="sidebar-header">
                        <h3>Filters</h3>
                        {(genre || year || lang) && (
                            <Link href="/search" className="clear-link">Clear All</Link>
                        )}
                    </div>

                    <div className="filter-group">
                        <h4>Genres</h4>
                        <div className="filter-list">
                            {Object.entries(MOVIE_GENRES).map(([id, name]) => (
                                <Link
                                    key={id}
                                    href={`/search?${new URLSearchParams({
                                        ...(genre !== id && { genre: id }),
                                        ...(year && { year }),
                                        ...(lang && { lang })
                                        // Reset page on filter change
                                    }).toString()}`}
                                    className={`filter-item ${genre === id ? 'active' : ''}`}
                                >
                                    {name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <h4>Language</h4>
                        <div className="filter-list">
                            {Object.entries(MOVIE_LANGUAGES).map(([code, name]) => (
                                <Link
                                    key={code}
                                    href={`/search?${new URLSearchParams({
                                        ...(genre && { genre }),
                                        ...(year && { year }),
                                        ...(lang !== code && { lang: code })
                                        // Reset page on filter change
                                    }).toString()}`}
                                    className={`filter-item ${lang === code ? 'active' : ''}`}
                                >
                                    {name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <h4>Release Year</h4>
                        <div className="filter-list">
                            {yearFilters.map((y) => {
                                return (
                                    <Link
                                        key={y}
                                        href={`/search?${new URLSearchParams({
                                            ...(genre && { genre }),
                                            ...(year !== y && { year: y }),
                                            ...(lang && { lang })
                                            // Reset page on filter change
                                        }).toString()}`}
                                        className={`filter-item ${year === y ? 'active' : ''}`}
                                    >
                                        {y}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <section className="results-section">
                    <h1 className="section-title">{title}</h1>
                    <div className="shelf-container">
                        <div className="movie-grid shelf-grid">
                            {results.map((movie: any) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                        {results.length > 0 && (
                            <div className="shelf-indicator mobile-only mt-4 mb-1">
                                <div className="swipe-line">
                                    <div className="swipe-dot"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {results.length === 0 ? (
                        <div className="empty-results">
                            <p>No movies found matching these criteria.</p>
                            <Link href="/search" className="action-btn" style={{ marginTop: '20px' }}>Reset All Filters</Link>
                        </div>
                    ) : !mood && (
                        <div className="pagination">
                            <div className="page-actions">
                                {page > 1 && (
                                    <Link href={getPageLink(page - 1)} className="page-nav-btn" title="Previous Page">
                                        <ChevronLeft size={20} />
                                    </Link>
                                )}

                                <div className="page-numbers">
                                    {(() => {
                                        const maxPages = Math.min(totalPages, 500);
                                        const pagesToShow = 7;
                                        let startPage = Math.max(1, page - Math.floor(pagesToShow / 2));
                                        let endPage = Math.min(maxPages, startPage + pagesToShow - 1);

                                        if (endPage - startPage + 1 < pagesToShow) {
                                            startPage = Math.max(1, endPage - pagesToShow + 1);
                                        }

                                        const links = [];
                                        for (let i = startPage; i <= endPage; i++) {
                                            links.push(
                                                <Link
                                                    key={i}
                                                    href={getPageLink(i)}
                                                    className={`page-num ${page === i ? 'active' : ''}`}
                                                >
                                                    {i}
                                                </Link>
                                            );
                                        }
                                        return links;
                                    })()}
                                </div>

                                {page < Math.min(totalPages, 500) && (
                                    <Link href={getPageLink(page + 1)} className="page-nav-btn" title="Next Page">
                                        <ChevronRight size={20} />
                                    </Link>
                                )}
                            </div>
                            <div className="page-info">
                                <span>Page <strong>{page}</strong> of {Math.min(totalPages, 500)}</span>
                            </div>
                        </div>
                    )}
                </section>
            </div>
            <Footer />
        </main>
    );
}
