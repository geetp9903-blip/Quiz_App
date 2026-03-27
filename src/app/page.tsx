"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSubjects, Subject, deleteAttempt } from "@/lib/api";

const subjectIcons: Record<string, string> = {
  "Business Laws": "⚖️",
  "Business Statistics": "📊",
  "Professional Comm Skills": "💬",
  "Research Methodology": "🔬",
  "Financial Management": "💰",
  "Organizational Behavior": "🏢",
};

const subjectGradients: Record<string, string> = {
  "Business Laws": "from-indigo-500/20 to-purple-500/20",
  "Business Statistics": "from-cyan-500/20 to-blue-500/20",
  "Professional Comm Skills": "from-emerald-500/20 to-teal-500/20",
  "Research Methodology": "from-amber-500/20 to-orange-500/20",
  "Financial Management": "from-rose-500/20 to-pink-500/20",
  "Organizational Behavior": "from-violet-500/20 to-fuchsia-500/20",
};

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeAttempts, setActiveAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subs, attemptsRes] = await Promise.all([
          getSubjects(),
          fetch("/api/attempts/active").then(r => r.ok ? r.json() : { attempts: [] })
        ]);
        setSubjects(subs);
        setActiveAttempts(attemptsRes.attempts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteSession = async (e: React.MouseEvent, attemptId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      try {
        await deleteAttempt(attemptId);
        setActiveAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      } catch (err) {
        console.error("Failed to delete session:", err);
        alert("Failed to delete session. Please try again.");
      }
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="gradient-text">Master Your Subjects</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
          Practice with 1,260+ MCQs across 6 subjects. Choose Practice Mode for instant feedback
          or Quiz Mode to test yourself.
        </p>
      </div>

      {/* Active Sessions Section */}
      {!loading && activeAttempts.length > 0 && (
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-400">⚡</span> Resume Session
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeAttempts.map((attempt) => (
              <Link
                href={`/${attempt.mode === 'quiz' ? 'quiz' : 'practice'}/${attempt.subject_id}?attemptId=${attempt.id}`}
                key={attempt.id}
                className="glass-card p-5 border border-blue-500/20 hover:border-blue-500/50 transition-colors group relative block"
              >
                <button
                  onClick={(e) => handleDeleteSession(e, attempt.id)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                  title="Delete Session"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
                <div className="flex justify-between items-start mb-2 pr-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                    {attempt.mode} Mode
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(attempt.started_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold group-hover:text-white transition-colors">
                  {attempt.subjectName}
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {attempt.total_questions} Questions
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-400">
                  Continue where you left off →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Subject Grid */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          📚 All Subjects
        </h2>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse h-44">
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] mb-4" />
              <div className="h-5 bg-white/[0.06] rounded w-3/4 mb-3" />
              <div className="h-4 bg-white/[0.06] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject, idx) => (
            <Link
              href={`/subjects/${subject.id}`}
              key={subject.id}
              className="glass-card p-6 group block"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-gradient-to-br ${
                  subjectGradients[subject.name] || "from-indigo-500/20 to-purple-500/20"
                }`}
              >
                {subjectIcons[subject.name] || "📚"}
              </div>
              <h2 className="text-lg font-semibold mb-1 group-hover:text-white transition-colors">
                {subject.name}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {subject.questionCount} questions
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-accent-light)" }}>
                Start practicing →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
