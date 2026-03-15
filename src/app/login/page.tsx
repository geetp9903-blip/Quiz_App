"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (error.message.includes("Invalid login")) {
        // Try sign up if not found
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setErrorMsg(signUpError.message);
        } else {
          setMessage("Check your email for the confirmation link!");
        }
      } else {
        setErrorMsg(error.message);
      }
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
  };

  const handlePasskeyLogin = async () => {
    // Passkeys flow via standard Supabase Auth requires signInWithSSO or WebAuthn beta
    // Commeted out temporarily to fix compilation error.
    /*
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Passkey login failed");
    }
    setLoading(false);
    */
    setErrorMsg("Passkey login is not fully supported yet in this setup.");
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-fade-in-up">
      <div className="glass-card p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Sign in to save your quiz progress and resume later.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: "var(--color-incorrect-bg)", color: "var(--color-incorrect)" }}>
            {errorMsg}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: "var(--color-correct-bg)", color: "var(--color-correct)" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-6">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-violet-500 focus:outline-none transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-violet-500 focus:outline-none transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold transition-all duration-200 mt-2 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #7c5cff, #a78bfa)",
              boxShadow: "0 4px 15px rgba(124, 92, 255, 0.3)",
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : "Continue with Email"}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-white/[0.1] flex-1" />
          <span className="text-xs font-semibold uppercase" style={{ color: "var(--color-text-secondary)" }}>OR</span>
          <div className="h-px bg-white/[0.1] flex-1" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium transition-all duration-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handlePasskeyLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium transition-all duration-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] flex items-center justify-center gap-2"
          >
            🔑 Continue with Passkey
          </button>
        </div>
      </div>
    </div>
  );
}
