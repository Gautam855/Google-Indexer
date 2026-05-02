"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Zap, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get("mode") === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.push("/dashboard");
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[128px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold">IndexForge</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p className="text-text-secondary text-sm mb-8">{isRegister ? "Start indexing your URLs in minutes" : "Sign in to your indexing dashboard"}</p>
          {error && <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="John Doe" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-12" placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-text-secondary">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-accent-light hover:text-accent font-medium transition-colors">
              {isRegister ? "Sign In" : "Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
