"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ProfileUser {
    id: string;
    email: string;
    name: string;
    role: "User" | "Admin" | "SuperAdmin";
    createdAt: string;
}



export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) {
                    router.push("/auth/signin");
                } else {
                    setProfile(data.user);
                }
            })
            .catch(() => setError("Failed to load profile"))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16">
                <p className="text-destructive text-sm">{error}</p>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft size={16} />
                Back
            </button>
            {/* Avatar placeholder */}
            <div className="flex items-center gap-5 mb-10">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-foreground">
                    {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {profile.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {profile.email}
                    </p>
                </div>
            </div>
            {/* Info card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Account details
                </h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-sm text-muted-foreground">
                            Full name
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {profile.name}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-sm text-muted-foreground">
                            Email
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {profile.email}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-sm text-muted-foreground">
                            Role
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                            {profile.role}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border">
                        <span className="text-sm text-muted-foreground">
                            Member since
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {new Date(profile.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                },
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-sm text-muted-foreground">
                            Account ID
                        </span>
                        <span className="text-sm font-mono text-muted-foreground">
                            {profile.id}
                        </span>
                    </div>
                </div>
            </div>
            {/* Sign out */}
            <button
                onClick={async () => {
                    await fetch("/api/auth/signout", { method: "POST" });
                    router.push("/auth/signin");
                }}
                className="mt-6 w-full py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
                Sign out
            </button>
        </div>
    );
}