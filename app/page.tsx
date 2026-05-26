import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
            {/* Logo mark */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-4xl">
                💬
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Yap
            </h1>
            <p className="mt-4 max-w-sm text-lg text-zinc-400">
                A fast, friendly messenger for people who have things to say.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                    href="/auth/signup"
                    className="rounded-xl bg-cyan-400 px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-cyan-300 active:scale-95"
                >
                    Create account
                </Link>
                <Link
                    href="/auth/signin"
                    className="rounded-xl border border-zinc-700 px-8 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white active:scale-95"
                >
                    Sign in
                </Link>
            </div>

            <p className="mt-16 text-xs text-zinc-600">
                By signing up you agree to our Terms &amp; Privacy Policy.
            </p>
        </main>
    );
}
