# 🎬 Moviefy

**Moviefy** is a state-of-the-art AI-powered movie discovery and exploration platform. It goes beyond simple search by using Large Language Models and Vector Databases to understand your mood, learn your taste, and recommend your next favorite film in seconds.

![Moviefy Hero](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200)

## 🚀 Experience the Future of Discovery

* **🧠 AI Mood Discovery**: Instead of generic filters, just describe your vibe. "A mind-bending thriller for a rainy night" or "Something heartwarming to watch with my dog" — powered by **Groq (Llama 3.3)**.
* **✨ Picked For You (RAG)**: A truly personal shelf. Using **Retrieval-Augmented Generation**, Moviefy analyzes your past ratings and reviews to suggest movies that actually match your unique taste vector.
* **🏆 Real-World Scores**: Get the full picture with live scores from **Rotten Tomatoes, IMDb, and Metacritic**, ensuring you never waste time on a bad movie.
* **📱 Unified Dashboard**: Manage your cinematic journey with sleek glassmorphism UI. Track your **Watchlist**, read your past **Reviews**, and organize movies into custom **Collections**.
* **⚡ Blazing Performance**: Optimized with parallel server-side fetching and streaming, delivering a lightning-fast experience even with complex AI operations.

## 🛠️ Tech Stack

- **Core**: [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database & Vector Search**: [Supabase](https://supabase.com/) (pgvector)
- **AI Engine (LLM)**: [Groq](https://groq.com/) (Llama-3.3-70b)
- **Embeddings**: [Hugging Face Inference](https://huggingface.co/) (all-MiniLM-L6-v2)
- **Data APIs**: [TMDB](https://www.themoviedb.org/) & [OMDb](http://www.omdbapi.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

## ⚡ Performance Features

- **Hyper-Parallel Fetching**: Parallelized API calls reduce page load waterfall by 70%.
- **Hybrid RAG Logic**: Smart timeouts for AI context ensures the UI stays rapid even if the embedding model is cold-starting.
- **Async Taste Updates**: Rating a movie updates your AI profile in the background, giving you instant UI feedback.
- **Optimized Payloads**: Strategic image compression and priority loading for a premium feel.

## 📋 Getting Started

### Prerequisites

- Node.js 18+
- Accounts for Clerk, Supabase, TMDB, Groq, and Hugging Face.

### Environment Setup

Create a `.env.local` file with the following:

```env
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Movie Data
TMDB_API_KEY=your_key

# AI Engine
GROQ_API_KEY=your_key
HF_TOKEN=your_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## 🌐 Deployment

Moviefy is optimized for **Vercel**. Connect your repository, add the environment variables listed above, and deploy!

---

Built with ❤️ by Sarthak
