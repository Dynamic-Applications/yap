"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInForm() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        const result = await signIn("credentials", {
            redirect: false,
            email: form.email,
            password: form.password,
        });

        if (result?.error) {
            setStatus("error");
            setMessage("Invalid email or password, or email not yet verified.");
            return;
        }

        router.push("/chats");
    };

    return (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Field
                label="Email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
            />
            <Field
                label="Password"
                name="password"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
            />

            {status === "error" && (
                <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {message}
                </p>
            )}

            <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-cyan-300 disabled:opacity-50 active:scale-95"
            >
                {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
        </form>
    );
}

function Field({
    label,
    ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {label}
            </label>
            <input
                {...props}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
        </div>
    );
}
