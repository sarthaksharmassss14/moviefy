"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions";
import ConfirmModal from "./ConfirmModal";

export default function ReviewForm({
  movieId,
  movieDescription,
  initialRating = 0,
  initialContent = ""
}: {
  movieId: number,
  movieDescription: string,
  initialRating?: number,
  initialContent?: string
}) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if props change (e.g. after revalidation)
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "success" | "danger" | "info"
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "success",
  });

  const handleStarClick = async (newRating: number) => {
    if (newRating === rating) return;

    setRating(newRating);
    const formData = new FormData();
    formData.append("movieId", movieId.toString());
    formData.append("rating", newRating.toString());
    formData.append("content", content); // Keep existing content
    formData.append("movieDescription", movieDescription);

    try {
      await submitReview(formData);
      setModalConfig({
        isOpen: true,
        title: "Rating Saved!",
        message: "Your rating has been successfully saved. It will help personalize your recommendations!",
        variant: "success"
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: "Update Failed",
        message: "We couldn't save your rating. Please check your connection and try again.",
        variant: "danger"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("movieId", movieId.toString());
    formData.append("rating", rating.toString());
    formData.append("content", content);
    formData.append("movieDescription", movieDescription);

    try {
      await submitReview(formData);
      setModalConfig({
        isOpen: true,
        title: "Review Saved!",
        message: "Your review has been saved. The community will appreciate your input!",
        variant: "success"
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: "Submission Error",
        message: "Something went wrong while updating your review. Please try again.",
        variant: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReviewChanged = content.trim() !== initialContent.trim();
  const isButtonDisabled = isSubmitting || !hasReviewChanged || !content.trim();

  return (
    <>
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        mode="alert"
        confirmLabel="Awesome"
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
                onClick={() => handleStarClick(star)}
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
          <span className="section-label">Your Review</span>
          <textarea
            placeholder="What did you think of the movie?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isButtonDisabled}
          className="submit-btn"
          style={{ marginTop: '10px' }}
        >
          {isSubmitting ? "Saving..." : "Submit Review"}
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
