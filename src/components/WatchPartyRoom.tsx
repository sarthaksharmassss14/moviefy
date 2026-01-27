"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Users, Share2, LogOut, Check, Copy, MessageSquare, Play, Pause, RotateCcw, RotateCw, RefreshCw, Zap } from "lucide-react";
import { sendPartyMessage } from "@/app/actions";
import { useRouter } from "next/navigation";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseClient } from "@/lib/supabase";

export default function WatchPartyRoom({ party, movie, user }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [participants, setParticipants] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);
    const [isFull, setIsFull] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncKey, setSyncKey] = useState(0);

    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: "", isVisible: false });

    const broadcastPlayback = (time: number, playing: boolean) => {
        const channel = (window as any).party_channel;
        if (channel) {
            console.log("➡️ Broadcasting Sync Event:", { time, playing });
            channel.send({
                type: 'broadcast',
                event: 'playback-sync',
                payload: { time, playing, senderId: user.id }
            });
        }
    };

    useEffect(() => {
        // Scroll to bottom on new message
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const { getToken } = useAuth();
    const isHost = String(user.id) === String(party.host_id);

    useEffect(() => {
        console.log("Party Identity Check:", { userId: user.id, hostId: party.host_id, isHost });
    }, [user.id, party.host_id, isHost]);

    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            const token = await getToken({ template: 'supabase' });
            const authSupabase = getSupabaseClient(token || undefined);

            // 1. Initial Load: Fetch last 50 messages
            const { data } = await authSupabase
                .from("watch_party_messages")
                .select("*")
                .eq("party_id", party.id)
                .order("created_at", { ascending: true })
                .limit(50);
            if (data) setMessages(data);

            // 2. Setup Realtime Channel
            channel = authSupabase.channel(`party-${party.id}`, {
                config: {
                    presence: {
                        key: String(user.id),
                    },
                    broadcast: { self: true }
                },
            });

            (window as any).party_channel = channel;

            channel
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "watch_party_messages",
                    },
                    (payload: any) => {
                        console.log("DB Realtime Payload:", payload);
                        if (payload.new && payload.new.party_id === party.id) {
                            setMessages((prev) => {
                                if (prev.some(m => m.id === payload.new.id)) return prev;
                                return [...prev, payload.new];
                            });
                        }
                    }
                )
                .on('broadcast', { event: 'chat-msg' }, (payload: any) => {
                    setMessages((prev) => prev.some(m => m.id === payload.payload.id) ? prev : [...prev, payload.payload]);
                })
                .on('broadcast', { event: 'playback-sync' }, (payload: any) => {
                    const { time, playing, senderId } = payload.payload;

                    // Don't sync if WE are the one who sent it (unless we are testing)
                    if (senderId === user.id) return;

                    console.log("⬅️ Sync Event Received:", { time, playing });
                    setCurrentTime(time);
                    setIsPlaying(playing);
                    setSyncKey(prev => prev + 1); // Force iframe reload

                    setSyncLoading(true);
                    setTimeout(() => setSyncLoading(false), 1200);
                })
                .on("presence", { event: "sync" }, () => {
                    const newState = channel.presenceState();
                    const allPresences = Object.values(newState).flat();
                    const uniqueMembersMap = new Map();
                    allPresences.forEach((p: any) => { if (p.user) uniqueMembersMap.set(p.user.id, p.user); });
                    const members = Array.from(uniqueMembersMap.values());

                    setParticipants((prev) => {
                        // Optional: Detect changes here if sync runs periodically, but join/leave events are better for notifications
                        return members;
                    });

                    if (!isHost && !members.some((m: any) => m.id === user.id) && members.length >= 5) setIsFull(true);
                })
                .on("presence", { event: "join" }, ({ newPresences }: any) => {
                    newPresences.forEach((p: any) => {
                        if (p.user && p.user.id !== user.id) {
                            console.log("User Joined:", p.user.name);
                            setToast({ message: `${p.user.name} joined the party!`, isVisible: true });
                            setMessages(prev => [...prev, {
                                id: `sys-join-${Date.now()}-${p.user.id}`,
                                isSystem: true,
                                content: `${p.user.name} joined the party`
                            }]);
                        }
                    });
                })
                .on("presence", { event: "leave" }, ({ leftPresences }: any) => {
                    leftPresences.forEach((p: any) => {
                        if (p.user && p.user.id !== user.id) {
                            console.log("User Left:", p.user.name);
                            setToast({ message: `${p.user.name} left the room.`, isVisible: true });
                            setMessages(prev => [...prev, {
                                id: `sys-leave-${Date.now()}-${p.user.id}`,
                                isSystem: true,
                                content: `${p.user.name} left the room`
                            }]);
                        }
                    });
                })
                .subscribe(async (status: string) => {
                    if (status === "SUBSCRIBED") {
                        console.log("✅ Realtime Subscribed!");
                        await channel.track({ user: { id: user.id, name: user.name, image: user.image } });
                    }
                });
        };

        setupRealtime();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [party.id, user.id, user.name, user.image, getToken, isHost]);

    const handleSyncClick = () => {
        if (!isHost) return;
        setSyncLoading(true);
        setTimeout(() => setSyncLoading(false), 600);
        broadcastPlayback(currentTime, isPlaying);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgStr = newMessage;
        setNewMessage("");

        try {
            const token = await getToken({ template: 'supabase' });
            const authSupabase = getSupabaseClient(token || undefined);

            const { data, error } = await authSupabase
                .from("watch_party_messages")
                .insert({
                    party_id: party.id,
                    user_id: user.id,
                    user_name: user.name,
                    content: msgStr
                })
                .select()
                .single();

            if (error) {
                console.error("Insert Error:", error);
                alert("Failed to send message: " + error.message);
            } else {
                console.log("Message sent successfully!");
                // BROADCAST to everyone instantly!
                const currentChannel = (window as any).party_channel;
                if (currentChannel) {
                    currentChannel.send({
                        type: 'broadcast',
                        event: 'chat-msg',
                        payload: data
                    });
                }
            }
        } catch (err: any) {
            console.error("Send Error:", err);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isFull) {
        return (
            <div className="party-error-screen glass">
                <Users size={48} className="text-red-500 mb-4" />
                <h2>Room is Full</h2>
                <p>This watch party has already reached its limit of 5 people.</p>
                <button onClick={() => router.push('/')} className="action-btn mt-6">Go Home</button>
            </div>
        );
    }

    const videoUrl = movie.imdb_id
        ? `https://vidsrc.cc/v2/embed/movie/${movie.imdb_id}`
        : `https://vidsrc.cc/v2/embed/movie/${movie.id}`;

    return (
        <div className="party-layout">
            {/* MAIN PLAYER AREA */}
            <div className="party-main">
                <div className="party-header-bar">
                    <div className="movie-mini-info">
                        <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="" />
                        <div>
                            <h1>{party.room_name || movie.title}</h1>
                            <p>Watching: {movie.title}</p>
                        </div>
                    </div>
                </div>

                <div className="party-video-container">
                    <iframe
                        src={videoUrl}
                        allowFullScreen
                        frameBorder="0"
                    />
                </div>
            </div>

            {/* SIDEBAR */}
            <aside className="party-sidebar glass">
                <div className="party-sidebar-header">
                    <div className="sidebar-tabs">
                        <div className="sidebar-tab active">
                            <MessageSquare size={18} />
                            Chat
                        </div>
                        <div className="sidebar-participants-count">
                            <Users size={16} />
                            {participants.length}/5
                        </div>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.map((msg: any) => {
                        if (msg.isSystem) {
                            return (
                                <div key={msg.id} className="chat-system-msg">
                                    <span>{msg.content}</span>
                                </div>
                            );
                        }
                        return (
                            <div key={msg.id} className={`chat-msg ${msg.user_id === user.id ? 'sent' : 'received'}`}>
                                {msg.user_id !== user.id && <span className="chat-user-name">{msg.user_name}</span>}
                                <div className="chat-bubble">
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                <div className="sidebar-footer-actions">
                    <button
                        onClick={handleCopyLink}
                        className="invite-btn-primary flex-1"
                    >
                        {copied ? <Check size={16} /> : <Share2 size={16} />}
                        <span>{copied ? "Copied!" : "Invite"}</span>
                    </button>
                    <button
                        onClick={() => setShowExitConfirm(true)}
                        className="exit-btn-secondary"
                        title="Exit Party"
                    >
                        <LogOut size={16} />
                        <span>Exit</span>
                    </button>
                </div>

                <ConfirmModal
                    isOpen={showExitConfirm}
                    onClose={() => setShowExitConfirm(false)}
                    onConfirm={() => router.push('/')}
                    title="Leave Watch Party?"
                    message="Are you sure you want to leave the room? You can re-join later using the same invite link."
                    confirmLabel="Yes, Leave"
                    cancelLabel="Stay"
                    variant="danger"
                />

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        placeholder="Say something..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()}>
                        <Send size={18} />
                    </button>
                </form>
            </aside>

            <Toast
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type="success"
            />

            <style jsx>{`
                .party-layout {
                    display: grid;
                    grid-template-columns: 1fr 350px;
                    position: fixed;
                    top: 70px;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    background: #000;
                    overflow: hidden;
                }
                .party-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow: hidden;
                    border-right: 1px solid rgba(255,255,255,0.05);
                }
                .party-header-bar {
                    flex-shrink: 0;
                    padding: 16px 24px;
                    background: rgba(10, 10, 12, 0.8);
                    backdrop-filter: blur(10px);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 10;
                }
                .movie-mini-info { display: flex; gap: 12px; align-items: center; }
                .movie-mini-info img { height: 32px; border-radius: 4px; }
                .movie-mini-info h1 { font-size: 0.9rem; font-weight: 700; margin: 0; color: white; }
                .movie-mini-info p { font-size: 0.7rem; color: #a1a1aa; margin: 0; }
                
                .party-video-container { 
                    flex: 1; 
                    background: black; 
                    position: relative; 
                    overflow: hidden;
                }
                .party-video-container iframe { width: 100%; height: 100%; border: none; }
                
                .party-controls-bar, .participant-info-bar {
                    flex-shrink: 0;
                    height: 80px;
                    background: #0a0a0c;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 24px;
                }
                .sync-info-badge.busy {
                    background: rgba(99, 102, 241, 0.1);
                    border-color: rgba(99, 102, 241, 0.2);
                    color: #818cf8;
                }
                
                .party-sidebar {
                    width: 380px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #0f0f12;
                    border-left: 1px solid rgba(255,255,255,0.05);
                }
                .party-sidebar-header {
                    flex-shrink: 0;
                    padding: 16px;
                    background: #141418;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .sidebar-tabs {
                    padding: 0; /* Removed padding from here as it's now in header */
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sidebar-invite-section {
                    padding: 0 16px 16px;
                }
                .sidebar-footer-actions {
                    padding: 12px 16px;
                    background: rgba(0,0,0,0.2);
                    border-top: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    gap: 8px;
                }
                .invite-btn-primary {
                    flex: 2;
                    padding: 10px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
                    color: white;
                    border: none;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.2);
                    font-size: 0.85rem;
                }
                .exit-btn-secondary {
                    flex: 1;
                    padding: 10px;
                    border-radius: 10px;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.85rem;
                }
                .exit-btn-secondary:hover {
                    background: #ef4444;
                    color: white;
                }
                .invite-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
                }
                .invite-btn-primary:active {
                    transform: translateY(0);
                }
                .sidebar-tab { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #818cf8; }
                .sidebar-participants-count { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #a1a1aa; }
                
                .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
                .chat-msg { max-width: 85%; display: flex; flex-direction: column; }
                .chat-msg.sent { align-self: flex-end; }
                .chat-msg.received { align-self: flex-start; }
                .chat-user-name { font-size: 0.7rem; color: #a1a1aa; margin-bottom: 4px; margin-left: 10px; }
                .chat-bubble { padding: 10px 14px; border-radius: 18px; font-size: 0.9rem; color: white; line-height: 1.4; }
                .sent .chat-bubble { background: #6366f1; border-bottom-right-radius: 4px; }
                .received .chat-bubble { background: rgba(255,255,255,0.08); border-bottom-left-radius: 4px; }
                
                .chat-system-msg {
                    align-self: center;
                    font-size: 0.75rem;
                    color: #a1a1aa;
                    background: rgba(255,255,255,0.05);
                    padding: 4px 12px;
                    border-radius: 20px;
                    margin: 8px 0;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .chat-input-area {
                    padding: 16px;
                    display: flex;
                    gap: 10px;
                    background: rgba(0,0,0,0.2);
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .chat-input-area input {
                    flex: 1;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 8px 16px;
                    color: white;
                    outline: none;
                }
                .chat-input-area button {
                    width: 36px; height: 36px; border-radius: 50%; background: #6366f1; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
                }
                .chat-input-area button:disabled { background: #3f3f46; cursor: not-allowed; }

                .host-sync-controls {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .sync-info-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    background: rgba(234, 179, 8, 0.1);
                    border: 1px solid rgba(234, 179, 8, 0.2);
                    border-radius: 20px;
                    font-size: 0.7rem;
                    color: #eab308;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .sync-btn-group {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .sync-tool-btn {
                    background: transparent;
                    color: #a1a1aa;
                    border: none;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .sync-tool-btn:hover { background: rgba(255,255,255,0.1); color: white; }
                .sync-main-btn {
                    background: #6366f1;
                    color: white;
                    border: none;
                    width: 38px;
                    height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: 10px;
                    margin: 0 4px;
                    transition: all 0.2s;
                }
                .sync-main-btn:hover { transform: scale(1.05); background: #4f46e5; }
                .sync-now-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .sync-now-btn:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }
                .sync-now-btn.primary {
                    background: #6366f1;
                    border: none;
                }
                .sync-now-btn.primary:hover {
                    background: #4f46e5;
                }

                .sync-manual-input {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255,255,255,0.05);
                    padding: 4px 4px 4px 12px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    font-size: 0.85rem;
                    color: #a1a1aa;
                }
                .sync-time-field {
                    width: 60px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    padding: 4px 8px;
                    color: white;
                    outline: none;
                    font-weight: 600;
                    text-align: center;
                }
                .sync-time-field:focus {
                    border-color: #6366f1;
                }
                
                .sync-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 50;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(4px);
                }
                .sync-loader {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .sync-loader p { color: white; font-weight: 600; font-size: 1.1rem; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
