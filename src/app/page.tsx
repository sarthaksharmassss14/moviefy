import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchFromTMDB } from "@/lib/tmdb";
import { auth } from "@clerk/nextjs/server";
import MoodSearch from "@/components/MoodSearch";
import HeroCarousel from "@/components/HeroCarousel";
import { Suspense } from "react";
import AIPickedSection from "@/components/AIPickedSection";
import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { Users, Play } from "lucide-react";
import DeletePartyButton from "@/components/DeletePartyButton";

async function ActiveWatchPartiesSection({ userId }: { userId: string | null }) {
  if (!userId) return null;

  const { data: parties } = await supabase
    .from("watch_parties")
    .select("*")
    .eq("host_id", userId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (!parties || parties.length === 0) return null;

  // Fetch movie details for each party
  const partyMovies = await Promise.all(
    parties.map(async (party) => {
      const movie = await fetchFromTMDB(`/movie/${party.movie_id}`);
      return { ...party, movie };
    })
  );

  return (
    <section className="movie-section animate-fade-in" style={{ marginBottom: '60px' }}>
      <div className="section-header">
        <h2 className="section-title">Your Active Parties</h2>
        <div className="section-badge">{parties.length} Running</div>
      </div>
      <div className="movie-grid">
        {partyMovies.map((p: any) => (
          <div key={p.id} className="party-card-wrapper">
            <Link href={`/party/${p.id}`} className="party-resume-card glass">
              <div className="party-card-poster">
                <img src={`https://image.tmdb.org/t/p/w500${p.movie?.poster_path}`} alt="" />
                <div className="party-card-overlay">
                  <Play fill="white" size={32} />
                </div>
              </div>
              <div className="party-card-info">
                <h3>{p.room_name || p.movie?.title}</h3>
                <div className="party-card-meta">
                  <Users size={14} />
                  <span>Host Session</span>
                </div>
              </div>
            </Link>
            <DeletePartyButton partyId={p.id} />
          </div>
        ))}
      </div>
    </section>
  );
}

async function ContinueWatchingSection({ userId }: { userId: string | null }) {
  if (!userId) return null;

  const { data: history } = await supabase
    .from("watch_history")
    .select("movie_id")
    .eq("user_id", userId)
    .eq("status", "watching")
    .order("last_watched_at", { ascending: false })
    .limit(5);

  if (!history || history.length === 0) return null;

  const movies = (await Promise.all(
    history.map(async (h) => {
      try {
        return await fetchFromTMDB(`/movie/${h.movie_id}`);
      } catch { return null; }
    })
  )).filter(Boolean);

  if (movies.length === 0) return null;

  return (
    <section className="movie-section animate-fade-in" style={{ marginBottom: '60px' }}>
      <div className="section-header">
        <h2 className="section-title">Continue Watching</h2>
        <Link href="/profile" className="section-filter-btn">
          <SlidersHorizontal size={20} />
        </Link>
      </div>
      <div className="movie-grid">
        {movies.map((movie: any) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}

async function MovieShelf({ title, endpoint, filterIndian = false }: { title: string, endpoint: string, filterIndian?: boolean }) {
  const data = await fetchFromTMDB(endpoint);
  let movies = data?.results || [];

  if (filterIndian) {
    const indianLangs = ['hi', 'te', 'ta', 'kn', 'ml', 'pa', 'bn'];
    movies = movies.filter((m: any) => !indianLangs.includes(m.original_language));
  }

  return (
    <section className="movie-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <Link href="/search" className="section-filter-btn">
          <SlidersHorizontal size={20} />
        </Link>
      </div>
      <div className="movie-grid">
        {movies.slice(0, 10).map((movie: any) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const { userId } = await auth();

  // Hero needs to be fast, so we fetch only trending here
  const trendingData = await fetchFromTMDB("/trending/movie/day");
  const heroMovies = (trendingData?.results || []).slice(0, 5);

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroCarousel movies={heroMovies} />

      <div className="content-container">
        <MoodSearch />

        <Suspense fallback={<div className="section-loader" />}>
          <ActiveWatchPartiesSection userId={userId} />
        </Suspense>

        <Suspense fallback={<div className="section-loader" />}>
          <ContinueWatchingSection userId={userId} />
        </Suspense>

        <Suspense fallback={<div className="section-loader" />}>
          <AIPickedSection userId={userId} />
        </Suspense>

        <Suspense fallback={<div className="section-loader" />}>
          <MovieShelf title="Trending Today" endpoint="/trending/movie/day" filterIndian />
        </Suspense>

        <Suspense fallback={<div className="section-loader" />}>
          <MovieShelf title="Top Rated" endpoint="/movie/top_rated" filterIndian />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
