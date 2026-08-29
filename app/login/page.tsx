"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, TriangleAlert } from "lucide-react";
import { CATEGORY_TOKENS } from "@/lib/categories";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await authClient.signIn.email({ email, password });

        if (error) {
            setError("That email and password don't match. Try again.");
            setLoading(false);
            return;
        }

        router.push("/");
        router.refresh();
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background p-4">
            <div className="flex justify-end">
                <ThemeToggle />
            </div>

            <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-raised">
                            <Gem className="size-7" strokeWidth={1.6} />
                        </span>
                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            Boutique
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Sign in to open the counter.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-raised">
                        {/* The full category spectrum, stated once. It is the
                            system's signature, and it is the first thing anyone
                            opening the app sees. */}
                        <div aria-hidden className="flex h-1">
                            {CATEGORY_TOKENS.map((token) => (
                                <span
                                    key={token}
                                    className="flex-1"
                                    style={{ background: `var(--cat-${token})` }}
                                />
                            ))}
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@shop.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11"
                                    required
                                />
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
                                >
                                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                                    {error}
                                </p>
                            )}

                            <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? "Signing in…" : "Sign in"}
                            </Button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        Forgotten your password? Ask the shop owner to reset it.
                    </p>
                </div>
            </div>
        </div>
    );
}
