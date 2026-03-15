"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getQuizResult, QuizResult } from "@/lib/api";

export default function ResultsPage() {
  const params = useParams();
  const attemptId = Number(params.attemptId);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    getQuizResult(attemptId)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return <div className="text-center py-20" style={{ color: "var(--color-text-secondary)" }}>Result not found.</div>;
  }

  const { attempt, answers } = result;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (attempt.percentage / 100) * circumference;

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: "Excellent!", color: "#34d399", emoji: "🏆" };
    if (pct >= 75) return { label: "Great Job!", color: "#a78bfa", emoji: "🌟" };
    if (pct >= 60) return { label: "Good Effort", color: "#fbbf24", emoji: "👍" };
    if (pct >= 40) return { label: "Keep Trying", color: "#fb923c", emoji: "💪" };
    return { label: "Needs Practice", color: "#f87171", emoji: "📚" };
  };

  const grade = getGrade(attempt.percentage);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Score Card */}
      <div className="glass-card p-8 text-center mb-8 animate-fade-in-up">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
          {attempt.subjectName} — {attempt.mode === "practice" ? "Practice" : "Quiz"} Results
        </p>

        {/* Score Ring */}
        <div className="relative w-36 h-36 mx-auto my-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={grade.color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="score-ring"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{attempt.percentage}%</span>
          </div>
        </div>

        <div className="text-4xl mb-2">{grade.emoji}</div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: grade.color }}>
          {grade.label}
        </h2>
        <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
          {attempt.score} out of {attempt.totalQuestions} correct
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{attempt.score}</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Correct</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-400">
              {attempt.totalQuestions - attempt.score}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Incorrect</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-accent-light)" }}>
              {attempt.totalQuestions}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Total</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={() => setShowReview(!showReview)}
          className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: showReview ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showReview ? "rgba(124,92,255,0.4)" : "var(--color-border)"}`,
            color: showReview ? "var(--color-accent-light)" : "var(--color-text-primary)",
          }}
        >
          {showReview ? "Hide Review" : "📋 Review Answers"}
        </button>
        <Link
          href={`/${attempt.mode === 'quiz' ? 'quiz' : 'practice'}/${attempt.subjectId}?count=${attempt.totalQuestions}`}
          className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200"
          style={{
            background: "rgba(52,211,153,0.15)",
            border: "1px solid rgba(52,211,153,0.4)",
            color: "var(--color-correct)",
          }}
        >
          🔄 Retry {attempt.mode === "practice" ? "Practice" : "Quiz"}
        </Link>
        <Link
          href="/"
          className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #7c5cff, #a78bfa)",
            boxShadow: "0 4px 15px rgba(124, 92, 255, 0.3)",
          }}
        >
          🏠 Back to Subjects
        </Link>
      </div>

      {/* Question Review */}
      {showReview && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Question Review</h3>
          {answers.map((answer, idx) => (
            <div
              key={answer.questionId}
              className="glass-card p-5 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="flex items-center justify-center w-7 h-7 min-w-[28px] rounded-lg text-xs font-bold"
                  style={{
                    background: answer.isCorrect ? "var(--color-correct-bg)" : "var(--color-incorrect-bg)",
                    color: answer.isCorrect ? "var(--color-correct)" : "var(--color-incorrect)",
                  }}
                >
                  {answer.isCorrect ? "✓" : "✗"}
                </span>
                <p className="font-medium text-sm leading-relaxed">
                  {idx + 1}. {answer.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-10">
                {answer.allOptions.map((opt) => {
                  const isSelected = answer.selectedOption?.id === opt.id;
                  const isCorrect = opt.isCorrect;

                  return (
                    <div
                      key={opt.id}
                      className="flex items-start gap-3 py-2 px-3 rounded-lg text-sm"
                      style={{
                        background: isCorrect
                          ? "var(--color-correct-bg)"
                          : isSelected
                          ? "var(--color-incorrect-bg)"
                          : "transparent",
                      }}
                    >
                      <span
                        className="text-xs font-bold min-w-[20px]"
                        style={{
                          color: isCorrect
                            ? "var(--color-correct)"
                            : isSelected
                            ? "var(--color-incorrect)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {opt.label}.
                      </span>
                      <span
                        style={{
                          color: isCorrect
                            ? "var(--color-correct)"
                            : isSelected
                            ? "var(--color-incorrect)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {opt.text}
                        {isCorrect && " ✓"}
                        {isSelected && !isCorrect && " ✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
