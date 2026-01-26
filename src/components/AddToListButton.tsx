"use client";

import { useState } from "react";
import { ListPlus, Check, X, Plus, List } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

interface UserList {
    id: number;
    name: string;
    poster_path?: string | null;
}

export default function AddToListButton({ movieId, lists, userId }: { movieId: number, lists: UserList[], userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loadingListId, setLoadingListId] = useState<number | null>(null);
    const [successListId, setSuccessListId] = useState<number | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: "danger" | "success" | "info" }>({
        isOpen: false,
        title: "",
        message: "",
        variant: "info"
    });
    const router = useRouter();

    const handleAddToList = async (listId: number) => {
        setLoadingListId(listId);
        try {
            const { error } = await supabase
                .from('list_items')
                .insert([
                    { list_id: listId, movie_id: movieId }
                ]);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setAlertConfig({
                        isOpen: true,
                        title: "Already Added",
                        message: "This movie is already in that collection!",
                        variant: "info"
                    });
                } else {
                    console.error("Error adding to list:", error);
                    setAlertConfig({
                        isOpen: true,
                        title: "Add Failed",
                        message: "We couldn't add this movie to your collection. Please try again.",
                        variant: "danger"
                    });
                }
            } else {
                setSuccessListId(listId);
                setTimeout(() => setSuccessListId(null), 2000);
                router.refresh(); // Refresh to reflect changes if necessary
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setAlertConfig({
                isOpen: true,
                title: "Something Went Wrong",
                message: "An unexpected error occurred. Please refresh the page.",
                variant: "danger"
            });
        } finally {
            setLoadingListId(null);
        }
    };

    // Removed early null return for guest users to allow showing a login prompt

    if (!lists || lists.length === 0) {
        return (
            <div className="relative">
                <button
                    className="action-btn disabled"
                    title="Create a list first in your profile"
                    onClick={() => setAlertConfig({
                        isOpen: true,
                        title: "No Collections Found",
                        message: "You need to create a list in your profile first before adding movies!",
                        variant: "info"
                    })}
                >
                    <ListPlus size={20} />
                    Add to List
                </button>
            </div>
        );
    }

    return (
        <div className="add-to-list-wrapper">
            <button
                className={`action-btn ${isOpen ? 'active' : ''}`}
                onClick={() => {
                    if (!userId) {
                        setAlertConfig({
                            isOpen: true,
                            title: "Login Required",
                            message: "You need to be logged in to create or add movies to collections.",
                            variant: "info"
                        });
                        return;
                    }
                    setIsOpen(!isOpen);
                }}
            >
                <ListPlus size={20} />
                Add to List
            </button>

            {isOpen && (
                <>
                    <div className="fixed-overlay" onClick={() => setIsOpen(false)}></div>
                    <div className="dropdown-menu animate-fade-in">
                        <div className="dropdown-header">
                            <span className="dropdown-title">Add to Collection</span>
                            <button onClick={() => setIsOpen(false)} className="close-btn">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="dropdown-content custom-scrollbar">
                            {lists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => handleAddToList(list.id)}
                                    disabled={loadingListId === list.id}
                                    className="list-item-btn"
                                >
                                    <div className="list-info">
                                        <div className="list-thumbnail">
                                            {list.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${list.poster_path}`}
                                                    alt=""
                                                    className="thumb-img"
                                                />
                                            ) : (
                                                <List size={14} className="text-zinc-500" />
                                            )}
                                        </div>
                                        <span className="list-name">{list.name}</span>
                                    </div>

                                    {loadingListId === list.id ? (
                                        <div className="spinner"></div>
                                    ) : successListId === list.id ? (
                                        <div className="success-icon">
                                            <Check size={14} color="#4ade80" />
                                        </div>
                                    ) : (
                                        <Plus size={16} className="plus-icon" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .add-to-list-wrapper {
                    position: relative;
                    display: inline-block;
                }
                
                .fixed-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 99;
                }

                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    width: 280px;
                    background-color: #121214;
                    border: 1px solid #27272a;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    z-index: 100;
                    padding: 4px;
                    transform-origin: top right;
                }

                .dropdown-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    margin-bottom: 4px;
                }

                .dropdown-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .close-btn {
                    color: #6b7280;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    color: white;
                }

                .dropdown-content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    max-height: 250px;
                    overflow-y: auto;
                    padding: 4px;
                }

                .list-item-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    transition: background 0.2s;
                    color: #e5e7eb;
                    text-align: left;
                }

                .list-item-btn:hover {
                    background: rgba(255,255,255,0.05);
                    color: white;
                }

                .list-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    overflow: hidden;
                }

                .list-thumbnail {
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .thumb-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .list-name {
                    font-size: 0.9rem;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 180px;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #6366f1;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .success-icon {
                    background: rgba(74, 222, 128, 0.1);
                    padding: 4px;
                    border-radius: 50%;
                    display: flex;
                }

                .plus-icon {
                    color: #6b7280;
                    transition: all 0.2s;
                }

                .list-item-btn:hover .plus-icon {
                    color: white;
                    transform: scale(1.1);
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                }
            `}</style>

            <ConfirmModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    if (!userId) router.push("/sign-in");
                }}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
                mode={!userId ? "confirm" : "alert"}
                confirmLabel={!userId ? "Login Now" : "Got it"}
            />
        </div>
    );
}
