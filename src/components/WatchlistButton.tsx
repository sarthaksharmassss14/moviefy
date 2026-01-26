"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleWatchlist } from "@/app/actions";
import { useRouter } from "next/navigation";
import ConfirmModal from "./ConfirmModal";

interface WatchlistButtonProps {
    movieId: number;
    initialState: boolean;
    userId: string;
}

export default function WatchlistButton({ movieId, initialState, userId }: WatchlistButtonProps) {
    const [isInWatchlist, setIsInWatchlist] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        if (!userId) {
            setShowLoginModal(true);
            return;
        }

        // Optimistic Update
        const newState = !isInWatchlist;
        setIsInWatchlist(newState);

        try {
            await toggleWatchlist(movieId);
            router.refresh();
        } catch (error) {
            console.error("Failed to toggle watchlist", error);
            // Revert on error
            setIsInWatchlist(!newState);
        }
    };

    return (
        <>
            <button
                onClick={handleToggle}
                disabled={isPending}
                className={`action-btn ${isInWatchlist ? 'active' : ''}`}
                style={{
                    borderColor: isInWatchlist ? '#ef4444' : '',
                    backgroundColor: isInWatchlist ? 'rgba(239, 68, 68, 0.1)' : ''
                }}
            >
                <Heart
                    size={20}
                    fill={isInWatchlist ? "#ef4444" : "none"}
                    color={isInWatchlist ? "#ef4444" : "currentColor"}
                />
                {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </button>

            <ConfirmModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onConfirm={() => router.push("/sign-in")}
                title="Login Required"
                message="You need to be logged in to manage your watchlist."
                confirmLabel="Login Now"
                variant="info"
            />
        </>
    );
}
