const https = require('https');
const fs = require('fs');
const path = require('path');

// Basic .env parser
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/TMDB_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

const url = `https://api.themoviedb.org/3/movie/popular?api_key=${key}`;

console.log('Testing connection to TMDB...');
console.log('Key extracted:', !!key ? 'YES' : 'NO');

const req = https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', (d) => {});
}).on('error', (e) => {
  console.error('FETCH FAILED ERROR:');
  console.error(e);
});

req.end();
