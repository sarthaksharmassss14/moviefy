"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions";

export default function ReviewForm({ movieId, movieDescription }: { movieId: number, movieDescription: string }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("movieId", movieId.toString());
        formData.append("rating", rating.toString());
        formData.append("content", content);
        formData.append("movieDescription", movieDescription);

        try {
            await submitReview(formData);
            setContent("");
            setRating(0);
            alert("Review submitted!");
        } catch (err) {
            alert("Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="review-form glass">
            <h3>Leave a Review</h3>

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
                            size={24}
                            fill={(hover || rating) >= star ? "#facc15" : "none"}
                            color={(hover || rating) >= star ? "#facc15" : "var(--text-secondary)"}
                        />
                    </button>
                ))}
            </div>

            <textarea
                placeholder="What did you think of this movie?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
            />

            <button type="submit" disabled={isSubmitting} className="submit-btn">
                {isSubmitting ? "Submitting..." : "Post Review"}
            </button>

            <style jsx>{`
        .review-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .star-rating {
          display: flex;
          gap: 8px;
        }
        .star-btn {
          transition: transform 0.2s ease;
        }
        .star-btn:hover {
          transform: scale(1.2);
        }
        textarea {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 12px;
          color: white;
          min-height: 100px;
          font-family: inherit;
          resize: vertical;
        }
        .submit-btn {
          background: var(--primary-gradient);
          color: white;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
        }
        .submit-btn:disabled {
          opacity: 0.5;
        }
      `}</style>
        </form>
    );
}
