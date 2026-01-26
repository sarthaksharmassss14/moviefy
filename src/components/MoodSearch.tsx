"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import MovieCard from "./MovieCard";
import ConfirmModal from "./ConfirmModal";

export default function MoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [pastRecommendations, setPastRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: "danger" | "success" | "info" }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info"
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Refresh everything if query changed
    let currentHistory = pastRecommendations;
    if (query.trim().toLowerCase() !== lastQuery.toLowerCase()) {
      currentHistory = [];
      setPastRecommendations([]);
    }
    setLastQuery(query.trim());

    setIsLoading(true);
    setResults([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch("/api/ai/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          excludeTitles: currentHistory
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      const newResults = data.results || [];
      setResults(newResults);

      // Update history for next skip
      if (newResults.length > 0) {
        const newTitles = newResults.map((m: any) => m.title);
        setPastRecommendations(prev => [...prev, ...newTitles]);
      }

      if (!data.results || data.results.length === 0) {
        setAlertConfig({
          isOpen: true,
          title: "No Matches",
          message: "No movies found for this mood. Try describing it with different words or genres!",
          variant: "info"
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[MoodSearch] Error:", err);

      if (err.name === 'AbortError') {
        setAlertConfig({
          isOpen: true,
          title: "Taking too long",
          message: "The AI is taking a bit longer than usual. Please try again!",
          variant: "info"
        });
      } else {
        setAlertConfig({
          isOpen: true,
          title: "Search Issue",
          message: err.message || "Something went wrong. Please try again.",
          variant: "danger"
        });
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

      {isLoading && (
        <div className="mood-loading-container">
          <motion.div
            className="loader-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="purple-pulsar">
              <motion.div
                className="pulsar-inner"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <Sparkles className="loader-sparkle" size={32} />
            </div>
            <motion.p
              className="loader-text"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              AI is analyzing your vibe...
            </motion.p>
          </motion.div>
        </div>
      )}

      {results.length > 0 && !isLoading && (
        <div className="mood-results">
          <h3 className="results-title">AI Picks for your mood:</h3>
          <motion.div
            key={JSON.stringify(results.map(r => r.id))} // Dynamic key to force re-animation
            className="movie-grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {results.slice(0, 5).map((movie) => (
              <motion.div
                key={movie.id}
                variants={{
                  hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
                  show: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { type: "spring", stiffness: 80, damping: 12 }
                  }
                }}
              >
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </motion.div>
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

        .mood-loading-container {
          display: flex;
          justify-content: center;
          padding: 60px 0;
        }
        .loader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .purple-pulsar {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulsar-inner {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(10px);
        }
        .loader-sparkle {
          color: white;
          z-index: 1;
          filter: drop-shadow(0 0 10px #a855f7);
          animation: spin 3s linear infinite;
        }
        .loader-text {
          font-family: var(--font-heading);
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #a855f7;
          font-size: 1.1rem;
        }
      `}</style>

      <ConfirmModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        mode="alert"
        confirmLabel="Got it"
      />
    </div>
  );
}
