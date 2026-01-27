
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
    console.log("--- DB Status Check ---");

    // Check reviews
    const { count: reviewCount, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

    if (reviewError) console.error("Error fetching reviews:", reviewError);
    else console.log("Total reviews in 'reviews' table:", reviewCount);

    // Check embeddings in reviews
    const { data: embeddingSample, error: embError } = await supabase
        .from('reviews')
        .select('movie_id, embedding')
        .not('embedding', 'is', null)
        .limit(1);

    if (embError) console.error("Error fetching embedding sample:", embError);
    else console.log("Reviews with embeddings found:", !!embeddingSample?.[0]?.embedding);

    // Check user tastes
    const { data: tastes, error: tasteError } = await supabase
        .from('user_tastes')
        .select('*');

    if (tasteError) console.error("Error fetching user tastes:", tasteError);
    else {
        console.log("User taste profiles:", tastes?.length);
        tastes?.forEach(t => {
            console.log(`User: ${t.user_id}, Rating Count: ${t.rating_count}, Has Vector: ${!!t.taste_vector}`);
        });
    }
}

checkDB();
