import { fetchFromTMDB } from "@/lib/tmdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        const data = await fetchFromTMDB("/search/movie", { query });
        // Filter duplicates and limit to top 5
        const seen = new Set();
        const uniqueSuggestions = data.results
            .filter((m: any) => {
                if (seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
            })
            .slice(0, 5)
            .map((m: any) => ({
                id: m.id,
                title: m.title,
                release_date: m.release_date || "",
                poster_path: m.poster_path,
                vote_average: m.vote_average || 0
            }));

        return NextResponse.json({ results: uniqueSuggestions });
    } catch (err) {
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}
