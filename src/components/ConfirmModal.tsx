"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Info, CheckCircle2 } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "primary" | "success" | "info";
    mode?: "confirm" | "alert";
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "primary",
    mode = "confirm",
}: ConfirmModalProps) {

    const getIcon = () => {
        switch (variant) {
            case "danger": return <AlertTriangle size={24} />;
            case "success": return <CheckCircle2 size={24} />;
            case "info": return <Info size={24} />;
            default: return <Info size={24} />;
        }
    };

    const getColorClasses = () => {
        switch (variant) {
            case "danger": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "success": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "info": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
            default: return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
        }
    };

    const getButtonClasses = () => {
        switch (variant) {
            case "danger": return "bg-red-500 hover:bg-red-600 shadow-red-500/20";
            case "success": return "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20";
            case "info": return "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/20";
            default: return "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/20";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden bg-[#0f0f12] border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        <div className="p-8">
                            <div className="flex flex-col items-center text-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${getColorClasses()}`}>
                                    {getIcon()}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
                                    <p className="text-gray-400 leading-relaxed px-4">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className={`flex gap-3 mt-10 ${mode === "alert" ? "justify-center" : ""}`}>
                                {mode === "confirm" && (
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 active:scale-95"
                                    >
                                        {cancelLabel}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (onConfirm) onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white transition-all shadow-xl active:scale-95 ${getButtonClasses()}`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
