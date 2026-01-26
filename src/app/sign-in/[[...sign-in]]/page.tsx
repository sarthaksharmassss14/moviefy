"use client";

import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function Page() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black py-20 px-4 relative">
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10"
            >
                <ArrowLeft size={20} />
                Back
            </button>
            <SignIn />
        </div>
    );
}
