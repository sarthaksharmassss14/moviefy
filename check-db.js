const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
    const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
    const key = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1];
    return { url, key };
}

async function checkDB() {
    const { url, key } = getEnv();
    if (!url || !key) {
        console.error("Credentials missing in .env");
        return;
    }

    const supabase = createClient(url, key);
    console.log("Checking 'user_tastes' table...");
    
    const { data, error } = await supabase
        .from('user_tastes')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ TABLE ERROR:", error.message);
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
            console.log("--> HUGE ISSUE: The table 'user_tastes' has NOT been created yet!");
        }
    } else {
        console.log("✅ Table exists and is readable.");
       
    }
}

checkDB();
