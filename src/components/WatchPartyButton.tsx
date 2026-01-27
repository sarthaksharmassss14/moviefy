"use client";

import { useState } from "react";
import { Users, Loader2, Link as LinkIcon, Check, Lock } from "lucide-react";
import { createWatchParty } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import ConfirmModal from "./ConfirmModal";

export default function WatchPartyButton({ movieId, movieTitle }: { movieId: number, movieTitle: string }) {
    const { userId } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [roomName, setRoomName] = useState(`${movieTitle}'s Party`);
    const router = useRouter();

    const handleCreate = async () => {
        try {
            setIsCreating(true);
            const res = await createWatchParty(movieId, roomName);
            if (res.success && res.id) {
                router.push(`/party/${res.id}`);
            } else {
                alert(`Error: ${res.error || "Failed to create room. Please check if you have run the SQL in Supabase."}`);
                setIsCreating(false);
            }
        } catch (error: any) {
            console.error("Failed to create party:", error);
            alert("Something went wrong. Make sure you are logged in and database is ready.");
            setIsCreating(false);
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    if (!userId) {
                        setShowLoginModal(true);
                    } else {
                        setShowModal(true);
                    }
                }}
                className="action-btn glass flex items-center gap-2"
                style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#a855f7' }}
            >
                <Users size={18} />
                Watch Party
            </button>

            <ConfirmModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onConfirm={() => router.push('/sign-in')}
                title="Login Required"
                message="You need to be logged in to start or join a watch party with your friends."
                confirmLabel="Sign In"
                variant="primary"
            />

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <Users className="text-purple-500" size={24} />
                                Start Watch Party
                            </h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-gray-400 mb-6">
                                Create a room to watch <strong>{movieTitle}</strong> together with up to 5 friends!
                            </p>
                            <div className="form-group">
                                <label className="form-label">Room Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="Give your room a name..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !roomName.trim()}
                                className="btn-primary flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                            >
                                {isCreating ? <Loader2 className="animate-spin" size={18} /> : "Create Room"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
