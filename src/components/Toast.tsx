"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

export type ToastType = "success" | "error";

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
}

export default function Toast({ message, type = "success", isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-container ${isVisible ? 'show' : ''} ${type}`}>
            <div className="toast-content">
                <CheckCircle2 className="toast-icon" size={20} />
                <span>{message}</span>
                <button onClick={onClose} className="toast-close">
                    <X size={16} />
                </button>
            </div>

            <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: 40px;
          right: 40px;
          z-index: 9999;
          transform: translateY(100px);
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .toast-container.show {
          transform: translateY(0);
          opacity: 1;
        }
        .toast-content {
          background: rgba(18, 18, 20, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          min-width: 250px;
        }
        .success .toast-icon {
          color: #10b981;
        }
        .error .toast-icon {
          color: #ef4444;
        }
        .toast-close {
          margin-left: auto;
          color: var(--text-secondary);
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .toast-close:hover {
          opacity: 1;
        }
        .toast-container.success::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: 12px;
          right: 12px;
          height: 2px;
          background: #10b981;
          border-radius: 2px;
          animation: progress 4s linear forwards;
        }
        @keyframes progress {
          from { width: 0; }
          to { width: calc(100% - 24px); }
        }
      `}</style>
        </div>
    );
}
