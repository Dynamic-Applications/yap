"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface AvatarUploadProps {
    currentAvatar?: string;
    name: string;
    size?: number;
    onUpload?: (url: string) => void;
}

export default function AvatarUpload({
    currentAvatar,
    name,
    size = 80,
    onUpload,
}: AvatarUploadProps) {
    const [avatar, setAvatar] = useState(currentAvatar);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function getInitials(name: string) {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediately
        const localUrl = URL.createObjectURL(file);
        setAvatar(localUrl);
        setUploading(true);

        const formData = new FormData();
        formData.append("avatar", file);

        try {
            const res = await fetch("/api/user/avatar", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setAvatar(data.avatarUrl);
                onUpload?.(data.avatarUrl);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className="relative cursor-pointer group"
            style={{ width: size, height: size }}
            onClick={() => inputRef.current?.click()}
        >
            {avatar ? (
                <Image
                    src={avatar}
                    alt={name}
                    width={size}
                    height={size}
                    className="rounded-full object-cover w-full h-full"
                />
            ) : (
                <div
                    className="rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold"
                    style={{ width: size, height: size, fontSize: size * 0.3 }}
                >
                    {getInitials(name)}
                </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
