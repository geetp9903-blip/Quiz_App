"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(10, 10, 26, 0.85)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{
              background: "linear-gradient(135deg, #7c5cff, #a78bfa)",
              boxShadow: "0 0 20px rgba(124, 92, 255, 0.3)",
            }}>
            Q
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:inline">QuizMaster</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {!isHome && (
            <Link
              href="/"
              className="text-sm px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/[0.06]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              ← Subjects
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm hidden sm:inline" style={{ color: "var(--color-text-secondary)" }}>
                {user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/[0.06]"
                style={{ color: "var(--color-incorrect)" }}
              >
                Logout
              </button>
            </div>
          ) : (
            pathname !== "/login" && (
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-white/[0.1] hover:bg-white/[0.15]"
                style={{ color: "var(--color-text-primary)" }}
              >
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
