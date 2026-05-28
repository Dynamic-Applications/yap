"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"signin" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        setLoading(false);
        if (res?.error) setError("Invalid email or password");
        else router.push("/");
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
            const data = await res.json();
            setError(data.message || "Something went wrong");
            setLoading(false);
            return;
        }
        await signIn("credentials", { email, password, redirect: false });
        setLoading(false);
        router.push("/");
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Yap
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {tab === "signin"
                            ? "Welcome back"
                            : "Create your account"}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
                    <button
                        onClick={() => {
                            setTab("signin");
                            setError("");
                        }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                            tab === "signin"
                                ? "bg-white shadow-sm text-gray-900"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Sign in
                    </button>
                    <button
                        onClick={() => {
                            setTab("signup");
                            setError("");
                        }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                            tab === "signup"
                                ? "bg-white shadow-sm text-gray-900"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Sign up
                    </button>
                </div>

                {/* Sign In Form */}
                {tab === "signin" && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" />
                                <Label
                                    htmlFor="remember"
                                    className="font-normal text-sm"
                                >
                                    Remember me
                                </Label>
                            </div>
                            <button
                                type="button"
                                className="text-sm font-medium underline text-muted-foreground"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                )}

                {/* Sign Up Form */}
                {tab === "signup" && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </Button>
                    </form>
                )}
            </div>
        </main>
    );
}
