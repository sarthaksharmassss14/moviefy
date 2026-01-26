import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
});

export async function getGroqRecommendations(mood: string): Promise<string[]> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn("[Groq] No API Key found in environment variables.");
        return [];
    }

    console.log(`[Groq] Generating recommendations for mood: "${mood}" using llama-3.1-8b-instant...`);

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a movie expert. Return a JSON object with a key "movies" containing 5 movie titles that match the user's mood. 
                    - Mood: "${mood}"
                    - Context: The user wants precise movie names. 
                    - Output JSON ONLY. No markdown.
                    Example: { "movies": ["Movie A", "Movie B"] }`
                },
                {
                    role: "user",
                    content: `Recommend 5 movies for: ${mood}`
                }
            ],
            model: "llama-3.1-8b-instant", // User requested instant model
            temperature: 0.5,
            response_format: { type: "json_object" },
            max_tokens: 200,
        });

        const content = completion.choices[0]?.message?.content;
        console.log(`[Groq] Raw output:`, content);

        if (!content) return [];

        const parsed = JSON.parse(content);
        return parsed.movies || [];

    } catch (error: any) {
        console.error("[Groq] API Error:", error.message || error);
        return [];
    }
}
