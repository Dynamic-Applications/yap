"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn } from "next-auth/react";

type View = "login" | "signup" | "closed";

function AuthDialogs({
    initialView,
    trigger,
}: {
    initialView: "login" | "signup";
    trigger: React.ReactNode;
}) {
    const { setUser } = useAuth();
    const [view, setView] = useState<View>("closed");

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupError, setSignupError] = useState("");
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState("");

    useEffect(() => {
        function handleOpenLogin() {
            setView("login");
        }
        window.addEventListener("open-login-dialog", handleOpenLogin);
        return () =>
            window.removeEventListener("open-login-dialog", handleOpenLogin);
    }, []);

    async function handleLogin() {
        setLoginError("");
        setLoginLoading(true);
        try {
            const res = await fetch("/api/auth/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginError(data.error ?? "Something went wrong");
            } else {
                setUser(data.data.user);
                setView("closed");
                // redirect to intended video if stored
                const redirect = sessionStorage.getItem("redirectAfterLogin");
                if (redirect) {
                    sessionStorage.removeItem("redirectAfterLogin");
                    window.open(redirect, "_blank");
                }
            }
        } catch {
            setLoginError("Network error, please try again");
        } finally {
            setLoginLoading(false);
        }
    }

    async function handleSignup() {
        setSignupError("");
        setSignupLoading(true);
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: signupEmail,
                    name: signupName,
                    password: signupPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setSignupError(data.error ?? "Something went wrong");
            } else {
                setUser(data.data.user);
                setSignupSuccess(data.message ?? "Account created!");
                setTimeout(() => {
                    setView("closed");
                    setSignupSuccess("");
                }, 3000);
            }
        } catch {
            setSignupError("Network error, please try again");
        } finally {
            setSignupLoading(false);
        }
    }

    return (
        <>
            <span onClick={() => setView(initialView)}>{trigger}</span>

            {/* Login */}
            <Dialog
                open={view === "login"}
                onOpenChange={(o) => !o && setView("closed")}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Welcome back</DialogTitle>
                        <DialogDescription>
                            Enter your credentials to access your account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                                id="login-email"
                                placeholder="you@example.com"
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input
                                id="login-password"
                                type="password"
                                value={loginPassword}
                                onChange={(e) =>
                                    setLoginPassword(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleLogin()
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" />
                                <Label
                                    className="font-normal text-sm"
                                    htmlFor="remember"
                                >
                                    Remember me
                                </Label>
                            </div>
                            <button
                                className="font-medium text-sm underline"
                                type="button"
                            >
                                Forgot password?
                            </button>
                        </div>
                        {loginError && (
                            <p className="text-sm text-destructive">
                                {loginError}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={handleLogin}
                            disabled={loginLoading}
                        >
                            {loginLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </DialogFooter>
                    <p className="text-center text-muted-foreground text-sm">
                        Don't have an account?{" "}
                        <button
                            className="font-medium underline"
                            type="button"
                            onClick={() => setView("signup")}
                        >
                            Sign up
                        </button>
                    </p>
                </DialogContent>
            </Dialog>

            {/* Signup */}
            <Dialog
                open={view === "signup"}
                onOpenChange={(o) => !o && setView("closed")}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create an account</DialogTitle>
                        <DialogDescription>
                            Enter your details below to create your account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-name">Full name</Label>
                            <Input
                                id="signup-name"
                                placeholder="John Doe"
                                value={signupName}
                                onChange={(e) => setSignupName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
                                placeholder="you@example.com"
                                type="email"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                value={signupPassword}
                                onChange={(e) =>
                                    setSignupPassword(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSignup()
                                }
                            />
                        </div>
                        {signupSuccess && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <svg
                                    className="h-4 w-4 shrink-0"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <p className="text-sm font-medium">
                                    {signupSuccess}
                                </p>
                            </div>
                        )}
                        {signupError && (
                            <p className="text-sm text-destructive">
                                {signupError}
                            </p>
                        )}
                        <Button
                            className="w-full"
                            onClick={handleSignup}
                            disabled={signupLoading}
                        >
                            {signupLoading
                                ? "Creating account..."
                                : "Create Account"}
                        </Button>
                        <div className="relative flex items-center gap-2">
                            <Separator className="flex-1" />
                            <span className="shrink-0 px-2 text-muted-foreground text-xs uppercase">
                                Or continue with
                            </span>
                            <Separator className="flex-1" />
                        </div>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() =>
                                signIn("google", { callbackUrl: "/" })
                            }
                        >
                            <svg
                                aria-label="Google"
                                className="mr-2 h-4 w-4"
                                role="img"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <p className="text-muted-foreground text-sm">
                            Already have an account?{" "}
                            <button
                                className="font-medium underline"
                                type="button"
                                onClick={() => setView("login")}
                            >
                                Sign in
                            </button>
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function LoginDialog({ trigger }: { trigger: React.ReactNode }) {
    return <AuthDialogs initialView="login" trigger={trigger} />;
}

export function SignupDialog({ trigger }: { trigger: React.ReactNode }) {
    return <AuthDialogs initialView="signup" trigger={trigger} />;
}
