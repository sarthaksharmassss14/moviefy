"use client";

import { SignInButton } from "@clerk/nextjs";
import { MessageSquare } from "lucide-react";

export default function LoginPrompt() {
    return (
        <div className="login-prompt glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <MessageSquare size={40} style={{ margin: '0 auto 16px', color: 'rgba(255,255,255,0.2)' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'white' }}>Share your thoughts</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Sign in to rate this movie and join the conversation.</p>

            <SignInButton mode="modal">
                <button className="action-btn" style={{
                    display: 'inline-flex',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}>
                    Sign In to Review
                </button>
            </SignInButton>
        </div>
    );
}
