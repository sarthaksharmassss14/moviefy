# Moviefy Setup Guide

Follow these steps to get your movie website up and running. All services used are **100% Free**.

## 1. TMDB API (Movie Data)
1. Go to [The Movie Database (TMDB)](https://www.themoviedb.org/).
2. Create an account.
3. Go to **Settings > API** and request an API Key (Developer).
4. Add it to `.env`: `TMDB_API_KEY=your_key_here`

## 2. Clerk (Authentication)
1. Go to [Clerk](https://clerk.com/).
2. Create a new application.
3. Select 'Next.js' and copy the **Publishable Key** and **Secret Key**.
4. Add them to `.env`.

## 3. Supabase (Database & RAG)
1. Go to [Supabase](https://supabase.com/).
2. Create a new project.
3. Copy the **Project URL** and **Anon Key** to `.env`.
4. Go to the **SQL Editor** in Supabase.
5. Copy the contents of `supabase_schema.sql` (in your project root) and run it. This enables `pgvector` for AI recommendations.

## 4. Hugging Face (AI Recommendations)
1. Go to [Hugging Face](https://huggingface.co/).
2. Go to **Settings > Access Tokens**.
3. Create a new token (Read).
4. Add it to `.env`: `HF_TOKEN=your_token_here`

## 5. Start the App
Run the following commands:
```bash
npm install
npm run dev
```

## How RAG works in this app:
1. When you rate a movie **4 or 5 stars**, the app generates an AI embedding (vector) of that movie's description.
2. This embedding is used to update your **User Taste Profile**.
3. On the Home page, the app fetches trending movies and compares their descriptions with your Taste Profile using **Cosine Similarity**.
4. The movies that match your taste most closely appear in the "**Picked For You**" section.
