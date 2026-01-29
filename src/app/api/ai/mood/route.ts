import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMoodRecommendations } from "@/lib/recommendations";

export async function POST(req: NextRequest) {
    try {
        const { query, excludeTitles = [] } = await req.json();
        const { userId } = await auth();

        const data = await getMoodRecommendations(query, userId, excludeTitles);

        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
