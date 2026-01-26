import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
});

export async function getGroqRecommendations(mood: string, context?: string, watchedMovies?: string): Promise<any[]> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn("[Groq] No API Key found in environment variables.");
        return [];
    }

    // Extract year from mood if present (e.g., "movies of 2025")
    const yearMatch = mood.match(/\b(19|20)\d{2}\b/);
    const forcedYear = yearMatch ? yearMatch[0] : null;

    const systemPrompt = `You are a movie expert.
    Current Date: ${new Date().toDateString()}
    ${context ? `Here are some reviews from our database to help you understand the user's taste and similar movies:\n${context}` : ""}
    ${watchedMovies ? `CRITICAL: The user has already watched the following movies. DO NOT RECOMMEND THEM:\n${watchedMovies}` : ""}
    Return a JSON object with a key "movies" containing 30 objects. Each object must have "title" and "year".
    - User Request: "${mood}"
    ${forcedYear ? `- STRICTURE: The user is specifically asking for the year ${forcedYear}. ALL 30 movies MUST be released in ${forcedYear}. NO EXCEPTIONS.` : "- Requirement: Provide the EXACT title and the correct release year for each movie."}
    - PRIORITY: For general prompts (like "top movies of...", "best of...", "director/actor films"), ONLY suggest Hollywood and International English-language movies. 
    - CRITICAL: NO FOREIGN LANGUAGE TITLES (unless specifically asked for a region like "Indian", "French", etc.). If you recommend a foreign movie by mistake, it will be discarded.
    - CRITICAL: Provide FACTUALLY CORRECT titles and years. Double-check release dates.
    - Output JSON ONLY. No markdown. No conversational text.
    Example: { "movies": [{ "title": "Inception", "year": 2010 }, { "title": "The Godfather", "year": 1972 }] }`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Provide 30 movies for: ${mood}` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: forcedYear ? 0.1 : 0.4, // ultra-low temperature if a year is forced
            response_format: { type: "json_object" },
            max_tokens: 2000,
        });

        const content = completion.choices[0]?.message?.content;
        console.log(`[Groq] Response received. Content length: ${content?.length || 0}`);

        if (!content) {
            console.error("[Groq] Error: No content in response choices");
            return ["ERROR: No content from Groq"];
        }

        let cleanContent = content.trim();
        cleanContent = cleanContent.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

        try {
            const parsed = JSON.parse(cleanContent);
            return parsed.movies || [];
        } catch (parseError: any) {
            console.error("[Groq] JSON Parse Error. Raw content was:", cleanContent);
            return [`ERROR: JSON Parse failed - ${parseError.message}`];
        }

    } catch (error: any) {
        console.error("[Groq] CRITICAL API ERROR:", error);
        return [];
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
