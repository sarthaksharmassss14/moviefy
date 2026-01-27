import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
});

export async function getGroqRecommendations(mood: string, context?: string, watchedMovies?: string): Promise<{ analysis: any, movies: any[] }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn("[Groq] No API Key found in environment variables.");
        return { analysis: {}, movies: [] };
    }

    const systemPrompt = `You are a cinematic reasoning engine. 
    Analyze the user's request and provide a structured response.

    STRICT JSON OUTPUT FORMAT:
    {
      "analysis": {
        "negative_constraints": ["list of things to EXPLICITLY avoid/exclude"],
        "metadata_filters": {
          "excluded_directors": ["directors to skip"],
          "genres_to_avoid": ["genres to skip"]
        },
        "aesthetic_vibes": ["specific visual/tonal keywords like 'high saturation', 'industrial', 'dreamy'"],
        "refined_vector_query": "A search string optimized for a vector database (exclude the negative parts here)"
      },
      "movies": [
        { "title": "Movie Name", "year": 2024, "reasoning": "Brief why it matches the aesthetic" }
      ]
    }

    - Current Date: ${new Date().toDateString()}
    - Requirements:
      1. CRITICAL: Identify NEGATIVE CONSTRAINTS. If user says "not David Lynch", David Lynch movies MUST go in negative_constraints.
      2. RE-RANKING Logic: Avoid "obvious" over-recommended movies (like Donnie Darko or The Shining) unless they are perfectly essential. Try to find fresh options.
      3. For "Aesthetic" prompts (e.g., "bubblegum pop"): Focus on VISUALS (colors, fashion, era) in your refined_vector_query.
      4. Suggest EXACTLY 20 movies.
      5. ${context ? `Consider user taste: ${context}` : ""}
      6. DO NOT RECOMMEND: ${watchedMovies || "None"}
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Mood/Prompt: ${mood}` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2, // Lower for better adherence to structured negative constraints
            response_format: { type: "json_object" },
            max_tokens: 2500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { analysis: {}, movies: [] };

        const parsed = JSON.parse(content);
        return {
            analysis: parsed.analysis || {},
            movies: parsed.movies || []
        };

    } catch (error: any) {
        console.error("[Groq] Analysis Error:", error);
        return { analysis: {}, movies: [] };
    }
}

export async function getMovieScores(title: string, year: string): Promise<{ imdb: string, rotten: string, letterboxd: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { imdb: "N/A", rotten: "N/A", letterboxd: "N/A" };

    const systemPrompt = `You are a movie statistics expert. 
    Provide the current IMDb score (out of 10), Rotten Tomatoes Critics score (as a percentage), and Letterboxd score (out of 5) for the movie provided.
    Return ONLY JSON.
    Example: { "imdb": "7.8", "rotten": "85%", "letterboxd": "3.9" }`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Movie: ${title} (${year})` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No content");

        const parsed = JSON.parse(content);
        return {
            imdb: parsed.imdb || "N/A",
            rotten: parsed.rotten || "N/A",
            letterboxd: parsed.letterboxd || "N/A"
        };
    } catch (e) {
        console.error("[Groq] Scores Error:", e);
        return { imdb: "N/A", rotten: "N/A", letterboxd: "N/A" };
    }
}
