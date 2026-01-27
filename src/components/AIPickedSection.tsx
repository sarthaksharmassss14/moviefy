import { getPickedForYou } from "@/lib/ai";
import PickedForYouSection from "./PickedForYouSection";

export const revalidate = 0;

interface AIPickedSectionProps {
    userId: string | null;
}

export default async function AIPickedSection({ userId }: AIPickedSectionProps) {
    if (!userId) return null;

    try {
        const recommendations = await getPickedForYou(userId);

        if (!recommendations || recommendations.length === 0) return null;

        return <PickedForYouSection movies={recommendations.slice(0, 6)} />;
    } catch (error) {
        console.error("[AIPickedSection] Error:", error);
        return null;
    }
}
