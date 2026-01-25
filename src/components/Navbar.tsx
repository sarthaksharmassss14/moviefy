"use client";

import Link from "next/link";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { Search, Film, Heart, List, Home } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { isSignedIn } = useUser();
    const [search, setSearch] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/search?q=${encodeURIComponent(search)}`);
        }
    };

    return (
        <nav className="navbar glass">
            <div className="nav-content">
                <Link href="/" className="logo">
                    <Film className="logo-icon" />
                    <span className="gradient-text">Moviefy</span>
                </Link>

                <form onSubmit={handleSearch} className="search-bar">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search movies, genres, mood..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                <div className="nav-links">
                    <Link href="/" className="nav-link"><Home size={20} /><span>Home</span></Link>
                    {isSignedIn && (
                        <>
                            <Link href="/watchlist" className="nav-link"><Heart size={20} /><span>Watchlist</span></Link>
                            <Link href="/lists" className="nav-link"><List size={20} /><span>Lists</span></Link>
                        </>
                    )}
                    <div className="auth-btn">
                        {isSignedIn ? (
                            <UserButton afterSignOutUrl="/" />
                        ) : (
                            <SignInButton mode="modal">
                                <button className="login-btn">Sign In</button>
                            </SignInButton>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          z-index: 1000;
          margin: 10px 20px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          padding: 0 24px;
        }
        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.5rem;
          font-family: var(--font-heading);
          font-weight: 800;
        }
        .logo-icon {
          color: #6366f1;
        }
        .search-bar {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 400px;
          transition: all 0.3s ease;
        }
        .search-bar:focus-within {
          background: rgba(255, 255, 255, 0.1);
          border-color: #6366f1;
        }
        .search-bar input {
          background: none;
          border: none;
          color: white;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
        }
        .search-icon {
          color: var(--text-secondary);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-weight: 500;
          transition: color 0.3s ease;
        }
        .nav-link:hover {
          color: white;
        }
        .login-btn {
          background: var(--primary-gradient);
          color: white;
          padding: 8px 20px;
          border-radius: 10px;
          font-weight: 600;
          transition: transform 0.2s ease;
        }
        .login-btn:hover {
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .search-bar { width: 150px; }
          .nav-link span { display: none; }
        }
      `}</style>
        </nav>
    );
}
