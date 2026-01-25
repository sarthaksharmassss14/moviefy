"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import MovieCard from "./MovieCard";

export default function MoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const res = await fetch("/api/ai/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        alert(`AI Error: ${data.error || "Server issue"}`);
        return;
      }

      setResults(data.results || []);
      if (data.results?.length === 0) {
        alert("No movies found for this mood. Try describing it differently!");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        alert("AI is taking too long. The model might be loading on HuggingFace—please wait 10 seconds and try again!");
      } else {
        console.error(err);
        alert("The server is temporarily busy. Please refresh the page and try once more.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mood-search-container">
      <div className="mood-search-box glass">
        <div className="mood-header">
          <Sparkles className="sparkle-icon" size={24} />
          <h2 className="gradient-text">AI Mood Discovery</h2>
        </div>
        <p className="mood-desc">Describe how you're feeling or what kind of vibe you want (e.g., "A thriller with mind-bending twists" or "Something heartwarming for a rainy day")</p>

        <form onSubmit={handleSearch} className="mood-form">
          <input
            type="text"
            placeholder="Type your mood here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mood-input"
          />
          <button type="submit" className="mood-submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="spinning" /> : "Discover"}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="mood-results animate-fade-in">
          <h3 className="results-title">AI Picks for your mood:</h3>
          <div className="movie-grid">
            {results.slice(0, 5).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .mood-search-container {
          margin-bottom: 60px;
        }
        .mood-search-box {
          padding: 30px;
          margin-bottom: 30px;
        }
        .mood-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .sparkle-icon {
          color: #a855f7;
        }
        .mood-desc {
          color: var(--text-secondary);
          margin-bottom: 24px;
          font-size: 0.95rem;
        }
        .mood-form {
          display: flex;
          gap: 12px;
        }
        .mood-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          outline: none;
          transition: border-color 0.3s ease;
        }
        .mood-input:focus {
          border-color: #6366f1;
        }
        .mood-submit {
          background: var(--primary-gradient);
          color: white;
          padding: 0 24px;
          border-radius: 12px;
          font-weight: 600;
          transition: transform 0.2s ease;
          min-width: 120px;
        }
        .mood-submit:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .mood-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .results-title {
          font-size: 1.25rem;
          margin-bottom: 20px;
          color: var(--text-secondary);
        }
        .spinning {
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
