const fs = require('fs');
const path = require('path');
const https = require('https');

function testTMDB() {
    try {
        const envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
        const match = envContent.match(/TMDB_API_KEY=(.*)/);
        
        if (!match || !match[1]) {
            console.error("Could not find TMDB_API_KEY in .env file.");
            return;
        }

        const key = match[1].trim().replace(/['"]/g, '');
        console.log(`Testing Key: [${key}]`);

        const url = `https://api.themoviedb.org/3/movie/popular?api_key=${key}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const parsed = JSON.parse(data);
                console.log("Status Code:", res.statusCode);
                if (res.statusCode === 200) {
                    console.log("SUCCESS! TMDB key is valid.");
                    console.log("First movie found:", parsed.results?.[0]?.title);
                } else {
                    console.error("FAIL! Error from TMDB:", parsed.status_message || data);
                }
            });
        }).on('error', (err) => {
            console.error("Error:", err.message);
        });
    } catch (e) {
        console.error("Execution Error:", e.message);
    }
}

testTMDB();
