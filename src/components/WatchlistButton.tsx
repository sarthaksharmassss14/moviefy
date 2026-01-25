"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleWatchlist } from "@/app/actions";
import { useRouter } from "next/navigation";

interface WatchlistButtonProps {
    movieId: number;
    initialState: boolean;
}

export default function WatchlistButton({ movieId, initialState }: WatchlistButtonProps) {
    const [isInWatchlist, setIsInWatchlist] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = async () => {
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
    );
}
