"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus("error");
                setMessage(data.error || "Something went wrong.");
                return;
            }

            setStatus("success");
            setMessage(data.message);
        } catch {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="mt-6 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 px-5 py-6 text-center">
                <div className="text-3xl mb-3">📬</div>
                <p className="text-sm text-zinc-300">{message}</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Field
                label="Name"
                name="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
            />
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
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
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
                {status === "loading" ? "Creating account…" : "Create account"}
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
