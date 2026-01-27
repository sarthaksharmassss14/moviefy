# 🎬 Moviefy

**Moviefy** is a state-of-the-art AI-powered movie discovery and social watch party platform. It goes beyond simple search by using Large Language Models and Vector Databases to understand your mood, learn your taste, and connect you with friends for shared cinematic experiences.

## 🚀 Key Features

* **🧠 AI Mood Discovery**: Instead of generic filters, just describe your vibe. "A mind-bending thriller for a rainy night" — powered by **Groq (Llama 3.3)**.
* **🍿 Social Watch Parties**: Create secure, private rooms to watch movies with friends. Includes real-time chat and session management.
* **✨ Picked For You (RAG)**: A truly personal shelf. Using **Retrieval-Augmented Generation**, Moviefy analyzes your past ratings and reviews to suggest movies that actually match your unique taste vector.
* **🔒 JWT-Secured Realtime**: Industry-standard security using **Clerk session tokens** to authorize **Supabase Realtime** and RLS, ensuring private chats stay private.
* **📱 Cinematic UI**: A premium experience with glassmorphism, viewport-locked watch rooms, and custom-built premium modals for a native-app feel.
* **🏠 Active Sessions**: Never lose your party. Hosts can see and resume their ongoing watch parties directly from the home dashboard.

## 🛠️ Tech Stack

- **Core**: [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database & Realtime**: [Supabase](https://supabase.com/) (Postgres Vector & Realtime)
- **AI Engine (LLM)**: [Groq](https://groq.com/) (Llama-3.3-70b)
- **Embeddings**: [Hugging Face Inference](https://huggingface.co/) (all-MiniLM-L6-v2)
- **Data APIs**: [TMDB](https://www.themoviedb.org/) & [OMDb](http://www.omdbapi.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

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
