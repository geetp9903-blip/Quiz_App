"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSubjects, Subject } from "@/lib/api";
import Link from "next/link";

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = Number(params.id);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questionCount, setQuestionCount] = useState(20);

  useEffect(() => {
    getSubjects().then((subjects) => {
      const found = subjects.find((s) => s.id === subjectId);
      if (found) {
        setSubject(found);
        setQuestionCount(Math.min(20, found.questionCount));
      }
    });
  }, [subjectId]);

  if (!subject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">{subject.name}</h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          {subject.questionCount} questions available
        </p>
      </div>

      {/* Question Count Selector */}
      <div className="glass-card p-5 mb-6">
        <div className="text-sm font-medium mb-3 flex items-center justify-between" style={{ color: "var(--color-text-secondary)" }}>
          <span>Number of Questions</span>
          <button 
            onClick={() => setQuestionCount(subject.questionCount)}
            className="px-2 py-0.5 text-xs font-bold rounded bg-violet-500/20 text-violet-400 hover:bg-violet-500/40 transition-colors"
          >
            MAX
          </button>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={subject.questionCount}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="flex-1 accent-violet-500"
          />
          <span className="text-xl font-bold min-w-[3ch] text-center gradient-text">
            {questionCount}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
          <span>5</span>
          <span>{subject.questionCount}</span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Practice Mode */}
        <Link
          href={`/practice/${subjectId}?count=${questionCount}`}
          className="glass-card p-6 group block text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            📖
          </div>
          <h2 className="text-xl font-semibold mb-2">Practice Mode</h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Learn at your own pace with instant feedback after each question
          </p>
          <span
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(20,184,166,0.15))",
              border: "1px solid rgba(52,211,153,0.25)",
              color: "#34d399",
            }}
          >
            Start Practice →
          </span>
        </Link>

        {/* Quiz Mode */}
        <Link
          href={`/quiz/${subjectId}?count=${questionCount}`}
          className="glass-card p-6 group block text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            🏆
          </div>
          <h2 className="text-xl font-semibold mb-2">Quiz Mode</h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Test yourself on {questionCount} questions. Get your score at the end
          </p>
          <span
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, rgba(124,92,255,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(124,92,255,0.25)",
              color: "#a78bfa",
            }}
          >
            Start Quiz →
          </span>
        </Link>
      </div>
    </div>
  );
}
