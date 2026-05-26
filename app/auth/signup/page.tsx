"use client";

import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-blue-500">
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-white">
                    Create Your Account
                </h1>
                <SignUpForm />
            </div>
        </div>
    );
}