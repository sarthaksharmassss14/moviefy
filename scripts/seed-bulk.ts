
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { pipeline } from '@xenova/transformers';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const tmdbKey = process.env.TMDB_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchMovies(page: number, retries = 3) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbKey}&page=${page}`;
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (res.ok) {
                const data = await res.json();
                return data.results || [];
            }
            if (res.status === 429) {
                console.log(`\n⏳ Rate limited. Waiting 5s before retry ${i + 1}...`);
                await new Promise(r => setTimeout(r, 5000));
            }
        } catch (e: any) {
            console.log(`\n⚠️ Fetch attempt ${i + 1} failed: ${e.message}. Retrying...`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    return [];
}

async function seed() {
    console.log("🚀 Starting Bulk Movie Knowledge Base Seed (1000 Movies)...");

    try {
        console.log("[AI] Loading local embedding model...");
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true,
        });
        console.log("✅ AI Model Loaded.");

        let totalSeeded = 0;
        const targetCount = 1000;
        const moviesPerPage = 20;
        const pagesNeeded = Math.ceil(targetCount / moviesPerPage);

        for (let page = 1; page <= pagesNeeded; page++) {
            console.log(`\n📦 Fetching Page ${page}...`);
            const movies = await fetchMovies(page);

            for (const m of movies) {
                if (!m.overview) continue;

                try {
                    // Generate Embedding
                    const output = await extractor(m.overview, { pooling: 'mean', normalize: true });
                    const embedding = output.tolist()[0];

                    // Upsert to Supabase
                    const { error } = await supabase.from('reviews').upsert({
                        user_id: 'system_knowledge_base',
                        movie_id: m.id,
                        rating: 5,
                        content: `System auto-seed: ${m.title}`,
                        embedding: embedding,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'user_id,movie_id' });

                    if (error) {
                        console.error(`❌ Error seeding ${m.title}:`, error.message);
                    } else {
                        totalSeeded++;
                        process.stdout.write(`✅ [${totalSeeded}/1000] Seeded: ${m.title.slice(0, 20)}... \r`);
                    }
                } catch (e: any) {
                    console.error(`💥 Failed for ${m.title}:`, e.message);
                }
            }
        }

        console.log("\n\n✨ SEEDING COMPLETE!");
        console.log(`🎉 Total Movies in Knowledge Base: ${totalSeeded}`);
        console.log("💡 Tip: Go to Supabase SQL Editor and run 'CREATE INDEX' for faster search.");
    } catch (err: any) {
        console.error("❌ CRITICAL SEED ERROR:", err.message);
    }
}

seed();
