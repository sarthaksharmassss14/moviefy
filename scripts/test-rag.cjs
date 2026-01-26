
const { createClient } = require('@supabase/supabase-js');
const { HfInference } = require('@huggingface/inference');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hfToken = process.env.HF_TOKEN;

const supabase = createClient(supabaseUrl, supabaseKey);
const hf = new HfInference(hfToken);

async function testRAG() {
    console.log("--- Testing RAG Recommendations ---");
    
    // 1. Simulate a taste vector (e.g., Sci-fi fan)
    const probeText = "I love mind-bending space adventures and black holes.";
    console.log(`Probe: "${probeText}"`);
    
    const embedding = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: probeText,
    });

    // 2. Call the RPC
    const { data: matched, error: rpcError } = await supabase.rpc('match_movie_recommendations', {
        query_embedding: embedding,
        match_threshold: 0.3, // Even lower for testing
        match_count: 5,
        excluded_ids: []
    });

    if (rpcError) {
        console.error("RPC Error:", rpcError.message);
        return;
    }

    console.log(`Found ${matched?.length || 0} matches.`);
    
    if (matched) {
        for (const m of matched) {
            // Get title from reviews table for confirmation if possible
            const { data: rev } = await supabase.from('reviews').select('movie_id').eq('movie_id', m.movie_id).limit(1).single();
            console.log(`Movie ID: ${m.movie_id}, Similarity: ${m.similarity.toFixed(4)}`);
        }
    }
}

testRAG();
