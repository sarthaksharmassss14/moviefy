"use client";

import { UserProfile } from "@clerk/nextjs";
import MovieCard from "@/components/MovieCard";
import { Star, Heart, MessageSquare, Settings, Film, ArrowLeft, List, Home, PlusCircle, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

export default function ProfileView({ user, watchlist, reviews, lists = [] }: any) {
    const [activeTab, setActiveTab] = useState<"watchlist" | "reviews" | "lists" | "settings">("watchlist");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListDesc, setNewListDesc] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: "danger" | "success" | "info" }>({
        isOpen: false,
        title: "",
        message: "",
        variant: "info"
    });

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get("tab") as any;
        if (tab && ["watchlist", "reviews", "lists", "settings"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleCreateList = async () => {
        if (!newListName.trim()) return;

        setIsCreating(true);
        try {
            const { error } = await supabase
                .from('lists')
                .insert([
                    {
                        user_id: user.id,
                        name: newListName,
                        description: newListDesc
                    }
                ]);

            if (error) throw error;

            setShowCreateModal(false);
            setNewListName("");
            setNewListDesc("");
            router.refresh();
        } catch (error: any) {
            console.error('Error creating list:', error);
            setAlertConfig({
                isOpen: true,
                title: "Creation Failed",
                message: error.message || "Failed to create list",
                variant: "danger"
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <main className="profile-container">
            {/* Header */}
            <div className="profile-header glass animate-fade-in">
                <div className="user-section">
                    <img
                        src={user.imageUrl}
                        alt={user.firstName || "User"}
                        className="profile-avatar"
                    />
                    <div className="profile-info">
                        <h1 className="welcome-text">
                            Hello, <span className="gradient-text">{user.firstName}</span>
                        </h1>
                        <p className="subtitle">Welcome to your personal dashboard</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="tab-switcher">
                    <Link href="/" className="tab-btn link-home">
                        Home
                    </Link>
                    <div className="divider"></div>
                    <button
                        onClick={() => setActiveTab("watchlist")}
                        className={`tab-btn ${activeTab === "watchlist" ? "active" : ""}`}
                    >
                        <Heart size={18} />
                        Watchlist
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                    >
                        <MessageSquare size={18} />
                        Reviews
                    </button>
                    <button
                        onClick={() => setActiveTab("lists")}
                        className={`tab-btn ${activeTab === "lists" ? "active" : ""}`}
                    >
                        <List size={18} />
                        My Lists
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                    >
                        <Settings size={18} />
                        Settings
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: WATCHLIST */}
            {activeTab === "watchlist" && (
                <div className="dashboard-content animate-fade-in">
                    <section className="section-block">
                        <h2 className="section-title">
                            <Heart className="icon" size={24} fill="#ef4444" color="#ef4444" />
                            My Watchlist <span className="count">({watchlist.length})</span>
                        </h2>
                        {watchlist.length > 0 ? (
                            <div className="movie-grid-compact">
                                {watchlist.map((movie: any) => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>Your watchlist is empty. Start adding movies you love!</p>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* TAB CONTENT: REVIEWS */}
            {activeTab === "reviews" && (
                <div className="dashboard-content animate-fade-in">
                    <section className="section-block">
                        <h2 className="section-title">
                            <MessageSquare className="icon" size={24} color="#a855f7" />
                            My Reviews <span className="count">({reviews.length})</span>
                        </h2>
                        <div className="reviews-list">
                            {reviews.map((item: any) => (
                                <div key={item.id} className="review-item glass">
                                    <Link
                                        href={`/movies/${item.movie?.id}`}
                                        className="review-link-wrapper"
                                        style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'flex-start', width: '100%' }}
                                    >
                                        <div
                                            className="review-sidebar"
                                            style={{ width: '90px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                                        >
                                            <div className="review-movie-poster" style={{ width: '100%' }}>
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w200${item.movie?.poster_path}`}
                                                    alt={item.movie?.title}
                                                    style={{ width: '100%', borderRadius: '6px', objectFit: 'cover', aspectRatio: '2/3', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                                                />
                                            </div>
                                            <h3 className="review-movie-title" style={{ fontSize: '0.8rem', textAlign: 'center', lineHeight: '1.2', color: 'white', wordBreak: 'break-word' }}>
                                                {item.movie?.title || "Unknown Movie"}
                                            </h3>
                                            <div className="rating-stars" style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={10}
                                                        fill={i < item.rating ? "#facc15" : "none"}
                                                        color={i < item.rating ? "#facc15" : "gray"}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="review-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                            <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                                <span className="date" style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                            </div>
                                            {item.content && (
                                                <p className="review-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>
                                                    {item.content}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                            {reviews.length === 0 && (
                                <div className="empty-state">
                                    <p>You haven't reviewed any movies yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* TAB CONTENT: LISTS */}
            {activeTab === "lists" && (
                <div className="dashboard-content animate-fade-in">
                    <section className="section-block">
                        <div className="collections-header">
                            <h2 className="section-title no-margin">
                                <List className="icon" size={24} color="#3b82f6" />
                                My Collections
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="create-list-btn"
                            >
                                <PlusCircle size={20} />
                                Create List
                            </button>
                        </div>

                        {lists && lists.length > 0 ? (
                            <div className="lists-grid">
                                {lists.map((list: any) => (
                                    <Link key={list.id} href={`/lists/${list.id}`} className="list-card-premium group">
                                        <div className="poster-stack">
                                            {list.posters && list.posters.length > 0 ? (
                                                list.posters.slice(0, 5).map((path: string, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="stack-item"
                                                        style={{ zIndex: 10 - i }}
                                                    >
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w185${path}`}
                                                            alt=""
                                                            className="stack-poster"
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-stack">
                                                    <List size={32} className="text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="list-card-info">
                                            <h3 className="list-name-premium">{list.name}</h3>
                                            <div className="list-meta-premium">
                                                <span>{new Date(list.created_at).toLocaleDateString()}</span>
                                                <span className="dot">•</span>
                                                <span>Collection</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-content">
                                    <div className="empty-icon-box">
                                        <List size={40} className="text-gray-400" />
                                    </div>
                                    <h3 className="empty-title">No lists yet</h3>
                                    <p className="empty-desc">
                                        Create your first custom list to organize your favorite movies!
                                    </p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="empty-action-btn"
                                    >
                                        <PlusCircle size={18} />
                                        Create New List
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* CREATE LIST MODAL */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Create New List</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="modal-close"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">List Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Weekend Horror Marathon"
                                    className="form-input"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description <span className="subtitle">(Optional)</span></label>
                                <textarea
                                    rows={3}
                                    placeholder="What is this list about?"
                                    className="form-textarea"
                                    value={newListDesc}
                                    onChange={(e) => setNewListDesc(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateList}
                                disabled={!newListName.trim() || isCreating}
                                className="btn-primary flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Creating...
                                    </>
                                ) : (
                                    "Create List"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === "settings" && (
                <div className="settings-container animate-fade-in">
                    <UserProfile
                        routing="hash"
                        appearance={{
                            elements: {
                                rootBox: "w-full mx-auto max-w-4xl",
                                card: "glass w-full shadow-xl border border-gray-800",
                                navbar: "hidden",
                                headerTitle: "text-2xl font-bold text-white",
                                headerSubtitle: "text-gray-400",
                                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                                formFieldInput: "bg-gray-900 border-gray-700 text-white"
                            },
                            variables: {
                                colorBackground: "#121215",
                                colorText: "white",
                                colorInputText: "white",
                                colorInputBackground: "#1e1e24"
                            }
                        }}
                    />
                </div>
            )}

            <ConfirmModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
                mode="alert"
                confirmLabel="Got it"
            />

            <style jsx>{`
        .profile-container {
            min-height: 100vh;
            padding: 60px 20px 80px;
            max-width: 1280px;
            margin: 0 auto;
        }

        .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 20px;
        }

        .user-section {
            display: flex;
            align-items: center;
            gap: 24px;
        }

        .profile-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 2px solid var(--accent-color);
        }

        .welcome-text {
            font-size: 2rem;
            font-weight: 700;
            color: white;
            line-height: 1.2;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 0.95rem;
        }

        .tab-switcher {
            display: flex;
            gap: 12px;
            background: rgba(255,255,255,0.05);
            padding: 6px;
            border-radius: 12px;
            align-items: center;
        }

        .divider {
            width: 1px;
            height: 24px;
            background: rgba(255,255,255,0.1);
            margin: 0 4px;
        }

        .tab-btn {
            background: transparent;
            color: var(--text-secondary);
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tab-btn:hover, .tab-btn.link-home:hover {
            color: white;
            background: rgba(255,255,255,0.05);
        }

        .tab-btn.active {
            background: var(--primary-gradient);
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .section-block {
            margin-bottom: 40px;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 24px;
            color: white;
        }

        .section-title.no-margin {
            margin-bottom: 0;
        }

        .count {
            font-size: 1.1rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .movie-grid-compact {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
        }

        /* Reviews */
        .reviews-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .review-item {
            padding: 16px;
            transition: transform 0.2s;
        }

        .review-item:hover {
            transform: translateX(4px);
        }

        .review-link-wrapper {
            display: flex;
            gap: 16px;
            width: 100%;
            align-items: flex-start;
        }

        .review-link-wrapper:hover .review-movie-title {
            color: #818cf8;
        }

        .review-movie-poster img {
            width: 70px;
            border-radius: 8px;
            aspect-ratio: 2/3;
            object-fit: cover;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .review-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .review-header-inner {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 8px;
        }

        .review-movie-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
            transition: color 0.2s;
        }

        .review-meta {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .rating-stars {
            display: flex;
        }

        .dot { color: var(--text-secondary); }
        .date { color: var(--text-secondary); font-size: 0.9rem; }

        .review-text {
            color: #d1d1d6;
            font-style: italic;
            line-height: 1.6;
        }

        /* Lists */
        .collections-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .create-list-btn {
            background: var(--primary-gradient);
            color: white;
            padding: 10px 20px;
            border-radius: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
            transition: all 0.2s;
        }

        .create-list-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(168, 85, 247, 0.6);
        }

        .lists-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 32px;
        }

        .list-card-premium {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .list-card-premium:hover {
            transform: translateY(-10px) scale(1.02);
            background: rgba(255, 255, 255, 0.07);
            border-color: rgba(129, 140, 248, 0.4);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.1);
        }

        .poster-stack {
            position: relative;
            height: 160px;
            display: flex;
            align-items: center;
            background: #0d0d0f;
            border-radius: 12px;
            padding: 0 10px;
            border: 1px solid rgba(255,255,255,0.05);
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            transition: all 0.3s ease;
        }

        .list-card-premium:hover .poster-stack {
            border-color: rgba(129, 140, 248, 0.4);
            background: #121216;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(99, 102, 241, 0.1);
        }

        .stack-item {
            width: 100px;
            height: 140px;
            flex-shrink: 0;
            margin-right: -70px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 5px 0 15px rgba(0,0,0,0.5);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            background: #1a1a1e;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
        }

        .list-card-premium:hover .stack-item {
            margin-right: -30px;
        }

        .stack-item:hover {
            transform: translateY(-12px) scale(1.1) rotate(0deg) !important;
            z-index: 100 !important;
            border-color: #818cf8;
            box-shadow: 0 15px 30px rgba(0,0,0,0.8), 0 0 20px rgba(129, 140, 248, 0.3);
        }

        .stack-poster {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: filter 0.3s ease;
        }

        .list-card-premium:hover .stack-poster {
            filter: brightness(1.1);
        }

        .empty-stack {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.02);
        }

        .list-card-info {
            padding: 0 4px;
        }

        .list-name-premium {
            font-size: 1.15rem;
            font-weight: 800;
            color: white;
            margin-bottom: 4px;
            transition: color 0.2s;
        }

        .list-card-premium:hover .list-name-premium {
            color: #818cf8;
        }

        .list-meta-premium {
            font-size: 0.85rem;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }

        /* Empty State */
        .empty-state {
            padding: 60px 20px;
            display: flex;
            justify-content: center;
        }

        .empty-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 400px;
        }

        .empty-icon-box {
            padding: 16px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
            margin-bottom: 16px;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .empty-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: white;
        }

        .empty-desc {
            color: var(--text-secondary);
            margin-bottom: 24px;
        }

        .empty-action-btn {
            color: #60a5fa;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .empty-action-btn:hover {
            color: #93c5fd;
        }

        .settings-container {
            display: flex;
            justify-content: center;
            padding: 20px 0;
        }

        @media (max-width: 900px) {
            .profile-header {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }
            .user-section {
                flex-direction: column;
                gap: 16px;
            }
            .tab-switcher {
                flex-wrap: wrap;
                justify-content: center;
            }
        }
      `}</style>
        </main>
    );
}
