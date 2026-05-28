"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProfileUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: "User" | "Admin" | "SuperAdmin";
    createdAt: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) {
                    router.push("/");
                } else {
                    console.log("Profile data:", data.user);
                    setProfile(data.user);
                }
            })
            .catch(() => setError("Failed to load profile"))
            .finally(() => setLoading(false));
    }, [router]);

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        setUploadError("");
        setUploading(true);
        const form = new FormData();
        form.append("avatar", file);

        try {
            const res = await fetch("/api/auth/me/avatar", {
                method: "POST",
                body: form,
            });
            const data = await res.json();
            if (!res.ok) {
                setUploadError(data.error ?? "Upload failed");
            } else {
                setProfile((p) =>
                    p ? { ...p, avatarUrl: data.avatarUrl } : p,
                );
            }
        } catch {
            setUploadError("Upload failed, please try again");
        } finally {
            setUploading(false);
        }
    }

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
            {/* Avatar */}
            <div className="flex items-center gap-5 mb-10">
                <label className="relative cursor-pointer group">
                    <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center text-2xl font-semibold text-foreground">
                        {profile.avatarUrl ? (
                            <Image
                                src={profile.avatarUrl}
                                alt={profile.name}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            profile.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                            {uploading ? "..." : "Edit"}
                        </span>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploading}
                    />
                </label>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {profile.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {profile.email}
                    </p>
                    {uploadError && (
                        <p className="text-xs text-destructive mt-1">
                            {uploadError}
                        </p>
                    )}
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
                            Profile photo
                        </span>
                        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold text-foreground">
                            {profile.avatarUrl ? (
                                <Image
                                    src={profile.avatarUrl}
                                    alt={profile.name}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                profile.name.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>
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
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                profile.role === "SuperAdmin"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : profile.role === "Admin"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                      : "bg-muted text-muted-foreground"
                            }`}
                        >
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
        </div>
    );
}
