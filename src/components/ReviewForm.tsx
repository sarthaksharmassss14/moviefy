"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions";
import Toast from "./Toast";

export default function ReviewForm({ movieId, movieDescription }: { movieId: number, movieDescription: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: "success" | "error" }>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 && !content.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("movieId", movieId.toString());
    if (rating > 0) formData.append("rating", rating.toString());
    formData.append("content", content);
    formData.append("movieDescription", movieDescription);

    try {
      await submitReview(formData);
      setContent("");
      setRating(0);
      setToast({ isVisible: true, message: "Review shared with the community!", type: "success" });
    } catch (err) {
      setToast({ isVisible: true, message: "Something went wrong. Try again!", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toast
        {...toast}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
      <form onSubmit={handleSubmit} className="review-form glass">
        <h3>Rate or Review</h3>

        <div className="review-section">
          <span className="section-label">Your Rating</span>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="star-btn"
              >
                <Star
                  size={28}
                  fill={(hover || rating) >= star ? "#facc15" : "none"}
                  color={(hover || rating) >= star ? "#facc15" : "var(--text-secondary)"}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="review-section">
          <span className="section-label">Your Thoughts (Optional)</span>
          <textarea
            placeholder="Write a few lines about the movie..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <button type="submit" disabled={isSubmitting || (rating === 0 && !content.trim())} className="submit-btn" style={{ marginTop: '10px' }}>
          {isSubmitting ? "Saving..." : "Submit My Rating"}
        </button>

        <style jsx>{`
        .review-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .review-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .section-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .star-rating {
          display: flex;
          gap: 12px;
        }
        .star-btn {
          padding: 4px;
          transition: transform 0.2s ease;
        }
        .star-btn:hover {
          transform: scale(1.2) rotate(5deg);
        }
        textarea {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 16px;
          color: white;
          min-height: 120px;
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
          transition: border-color 0.2s ease;
        }
        textarea:focus {
          border-color: #6366f1;
          outline: none;
          background: rgba(255, 255, 255, 0.08);
        }
        .submit-btn {
          background: var(--primary-gradient);
          color: white;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }
        .submit-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
      </form>
    </>
  );
}
