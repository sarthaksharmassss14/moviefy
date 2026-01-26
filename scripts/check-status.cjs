
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
    console.log("--- DB Status Check (JS) ---");
    
    // Check reviews
    const { count: reviewCount, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });
    
    if (reviewError) console.error("Error fetching reviews:", reviewError.message);
    else console.log("Total reviews in 'reviews' table:", reviewCount);

    // Check embeddings in reviews
    const { data: embeddingSample, error: embError } = await supabase
        .from('reviews')
        .select('movie_id, embedding')
        .not('embedding', 'is', null)
        .limit(1);
    
    if (embError) console.error("Error fetching embedding sample:", embError.message);
    else console.log("Reviews with embeddings found:", !!(embeddingSample && embeddingSample[0] && embeddingSample[0].embedding));

    // Check user tastes
    const { data: tastes, error: tasteError } = await supabase
        .from('user_tastes')
        .select('*');
    
    if (tasteError) console.error("Error fetching user tastes:", tasteError.message);
    else {
        console.log("User taste profiles count:", tastes ? tastes.length : 0);
        if (tastes) {
            tastes.forEach(t => {
                console.log(`User: ${t.user_id}, Rating Count: ${t.rating_count}, Has Vector: ${!!t.taste_vector}`);
                if (t.taste_vector) {
                     const vec = typeof t.taste_vector === 'string' ? JSON.parse(t.taste_vector) : t.taste_vector;
                     console.log(`Vector Length: ${vec.length}`);
                }
            });
        }
    }
}

checkDB();
