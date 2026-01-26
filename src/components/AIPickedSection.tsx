import { getRecommendedMovies, getPickedForYou } from "@/lib/ai";
import PickedForYouSection from "./PickedForYouSection";

interface AIPickedSectionProps {
    userId: string | null;
    trendingMovies: any[];
}

export default async function AIPickedSection({ userId, trendingMovies }: AIPickedSectionProps) {
    if (!userId) return null;

    try {
        const [proactive, scored] = await Promise.all([
            getPickedForYou(userId),
            getRecommendedMovies(userId, trendingMovies)
        ]);

        // Combine and de-duplicate
        const combined = [...proactive, ...scored];
        const uniqueIds = new Set();
        const recommendations = combined.filter(m => {
            if (!m || uniqueIds.has(m.id)) return false;
            uniqueIds.add(m.id);
            return true;
        }).slice(0, 6);

        if (recommendations.length === 0) return null;

        return <PickedForYouSection movies={recommendations} />;
    } catch (error) {
        console.error("[AIPickedSection] Error:", error);
        return null;
    }
}
