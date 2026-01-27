"use client";

import { Trash2 } from "lucide-react";
import { deleteWatchParty } from "@/app/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "./ConfirmModal";

export default function DeletePartyButton({ partyId }: { partyId: string }) {
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await deleteWatchParty(partyId);
            if (res.success) {
                router.refresh(); // Refresh data
                window.location.reload(); // Hard force reload for home page
            } else {
                alert("Error: " + (res.error || "Could not delete party"));
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server");
        } finally {
            setLoading(false);
            setIsModalOpen(false);
        }
    };

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                disabled={loading}
                className="delete-party-btn"
                title="End Party"
            >
                <Trash2 size={14} className={loading ? "animate-pulse" : ""} />
            </button>

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
                title="End Watch Party?"
                message="Are you sure you want to end this session? All participants will be disconnected."
                confirmLabel={loading ? "Ending..." : "End Party"}
                variant="danger"
            />
        </>
    );
}
