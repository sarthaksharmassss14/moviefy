"use client";

import Link from "next/link";
import { UserButton, useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import { Film, List, LogOut, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const { isSignedIn } = useUser();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/suggestions?query=${encodeURIComponent(search)}`);
        const data = await res.json();
        setSuggestions(data.results);
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  const navLinks = [
    { href: "/directors", label: "Directors" },
  ];

  return (
    <nav className="navbar glass">
      <div className="nav-content">
        <div className="nav-left">
          <Link
            href="/"
            className="logo"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Film className="logo-icon" />
            <span className="gradient-text">Moviefy</span>
          </Link>
        </div>

        <div className="search-wrapper" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-bar">
            {isLoading ? <Loader2 className="search-icon spinning" /> : <Search className="search-icon" />}
            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.length >= 2 && setShowSuggestions(true)}
            />
            <Link href="/search" className="filter-btn" title="Advanced Filters">
              <SlidersHorizontal size={18} />
            </Link>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/movies/${movie.id}`}
                  className="suggestion-link"
                  onClick={() => {
                    setShowSuggestions(false);
                    setSearch("");
                  }}
                >
                  <div className="suggestion-item">
                    <div className="suggestion-poster">
                      {movie.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          width={45}
                          height={65}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="poster-placeholder" />
                      )}
                    </div>
                    <div className="suggestion-info">
                      <span className="suggestion-title">{movie.title}</span>
                      <span className="suggestion-year">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isSignedIn && (
            <Link
              href="/profile"
              className="nav-link-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Dashboard
            </Link>
          )}
          <div className="auth-section">
            {isSignedIn ? (
              <div className="user-control">
                <div className="user-btn-wrapper">
                  <UserButton afterSignOutUrl="/" />
                </div>
                <SignOutButton>
                  <button className="logout-btn-nav">
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="login-btn" onClick={() => setIsMobileMenuOpen(false)}>Sign In</button>
              </SignInButton>
            )}
          </div>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <div className="close-icon">×</div> : <List />}
        </button>
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
        .search-wrapper {
          position: relative;
          width: 400px;
        }
        .search-bar {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
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
        .filter-btn {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          left: 0;
          right: 0;
          background: rgba(15, 15, 18, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          z-index: 2000;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          padding: 4px 0;
        }
        .suggestion-link {
          display: block;
          text-decoration: none;
        }
        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
        }
        .suggestion-link:last-child .suggestion-item { border-bottom: none; }
        .suggestion-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .suggestion-poster {
          width: 45px;
          height: 65px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
          position: relative;
        }
        .suggestion-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .suggestion-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .suggestion-year {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
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
        .logout-btn-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          transition: all 0.2s;
        }
        .logout-btn-nav:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }
        .nav-link-item {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: color 0.2s;
          white-space: nowrap;
        }
        .nav-link-item:hover {
          color: white;
        }
        .mobile-toggle {
          display: none;
          color: white;
          z-index: 2001;
          font-size: 1.5rem;
        }
        .close-icon {
            font-size: 2rem;
            line-height: 1;
        }
        .auth-section {
          display: flex;
          align-items: center;
        }
        .user-control {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .navbar {
            margin: 10px;
            padding: 0 16px;
          }
          .search-wrapper { 
            position: relative;
            top: 0;
            flex: 1;
            margin: 0 12px;
            width: auto;
            z-index: 999;
          }
          .search-bar {
            background: rgba(255, 255, 255, 0.05);
            padding: 6px 12px;
          }
          .search-bar input {
            font-size: 0.85rem;
          }
          .mobile-toggle {
            display: block;
          }
          .nav-links {
            position: fixed;
            top: 0;
            right: -100%;
            width: 250px;
            height: 100vh;
            background: rgba(10, 10, 12, 0.98);
            backdrop-filter: blur(20px);
            display: flex;
            flex-direction: column;
            padding: 80px 24px;
            gap: 30px;
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 2000;
            align-items: flex-start;
          }
          .nav-links.mobile-active {
            right: 0;
          }
          .auth-section {
            width: 100%;
            margin-top: auto;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          .user-control {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }
          .logout-btn-nav {
            width: 100%;
            justify-content: center;
          }
        }

        .user-btn-wrapper {
            display: flex;
            align-items: center;
        }
        @media (max-width: 500px) {
          .logo span {
            display: none;
          }
          .search-wrapper {
            margin: 0 8px;
          }
        }
      `}</style>
    </nav>
  );
}
