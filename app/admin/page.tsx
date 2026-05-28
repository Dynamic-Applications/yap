"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface AdminUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: "User" | "Admin" | "SuperAdmin";
    createdAt: string;
}

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    const isSuperAdmin = user?.role === "SuperAdmin";

    useEffect(() => {
        if (user === null && !authChecked) return; // still loading auth
        setAuthChecked(true);

        if (!user || !["SuperAdmin", "Admin"].includes(user.role)) {
            router.push("/");
            return;
        }

        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setUsers(data.data);
                } else {
                    setError("Failed to load users");
                }
            })
            .catch(() => setError("Failed to load users"))
            .finally(() => setLoading(false));
    }, [user, router, authChecked]);

    async function handleRoleChange(id: string, newRole: "User" | "Admin") {
        setUpdating(id);
        setSuccessId(null);
        try {
            const res = await fetch(`/api/admin/users/${id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (data.success) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === id ? { ...u, role: newRole } : u,
                    ),
                );
                setSuccessId(id);
                setTimeout(() => setSuccessId(null), 2000);
            } else {
                setError(data.error ?? "Failed to update role");
            }
        } catch {
            setError("Failed to update role");
        } finally {
            setUpdating(null);
        }
    }

    if (!authChecked || (loading && user)) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        );
    }

    if (!user || !["SuperAdmin", "Admin"].includes(user.role)) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    User Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {users.length} total users
                </p>
            </div>

            {error && <p className="text-sm text-destructive mb-4">{error}</p>}

            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">
                                Avatar
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">
                                Name
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">
                                Email
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">
                                Role
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">
                                Joined
                            </th>
                            {isSuperAdmin && (
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={isSuperAdmin ? 6 : 5}
                                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                                >
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((u, i) => (
                                <tr
                                    key={u.id}
                                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold text-foreground">
                                            {u.avatarUrl ? (
                                                <Image
                                                    src={u.avatarUrl}
                                                    alt={u.name}
                                                    width={36}
                                                    height={36}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                u.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-foreground">
                                            {u.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-muted-foreground">
                                            {u.email}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                                u.role === "Admin"
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(
                                                u.createdAt,
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {successId === u.id && (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        Updated
                                                    </span>
                                                )}
                                                <select
                                                    value={u.role}
                                                    disabled={updating === u.id}
                                                    onChange={(e) =>
                                                        handleRoleChange(
                                                            u.id,
                                                            e.target.value as
                                                                | "User"
                                                                | "Admin",
                                                        )
                                                    }
                                                    className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground disabled:opacity-50"
                                                >
                                                    <option value="User">
                                                        User
                                                    </option>
                                                    <option value="Admin">
                                                        Admin
                                                    </option>
                                                </select>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
