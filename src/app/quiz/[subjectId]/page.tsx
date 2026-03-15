"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { startQuiz, submitQuiz, Question } from "@/lib/api";

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = Number(params.subjectId);
  const count = Number(searchParams.get("count") || 20);

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const urlAttemptId = searchParams.get("attemptId");

  useEffect(() => {
    if (urlAttemptId) {
      fetch(`/api/attempts/${urlAttemptId}`)
        .then(res => res.json())
        .then(data => {
          setAttemptId(data.attemptId);
          setQuestions(data.questions);
          
          const newAnswers: Record<number, number> = {};
          if (data.answersState) {
            data.answersState.forEach((ans: any) => {
               newAnswers[ans.questionId] = ans.selectedOptionId;
            });
          }
          setAnswers(newAnswers);

          // Timer calculation (1 min per question normally)
          const totalTime = data.questions.length * 60;
          const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000);
          const remaining = Math.max(0, totalTime - elapsed);
          setTimeLeft(remaining);

          // Find first unanswered
          const answeredIndexList = (data.answersState || []).map((a: any) => data.questions.findIndex((q: any) => q.id === a.questionId));
          let firstUnanswered = 0;
          while (answeredIndexList.includes(firstUnanswered) && firstUnanswered < data.questions.length) {
              firstUnanswered++;
          }
          if (firstUnanswered >= data.questions.length) firstUnanswered = 0;
          setCurrentIndex(firstUnanswered);

          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      startQuiz(subjectId, "quiz", count)
        .then((data) => {
          setAttemptId(data.attemptId);
          setQuestions(data.questions);
          setTimeLeft(data.questions.length * 60); // 1 min per question
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [subjectId, count, urlAttemptId]);

  // Timer
  useEffect(() => {
    if (loading || submitting) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, submitting]);

  const handleOptionSelect = (questionId: number, optionId: number) => {
    if (submitting) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const answerArray = Object.entries(answers).map(([qId, optId]) => ({
      questionId: Number(qId),
      selectedOptionId: optId,
    }));

    try {
      await submitQuiz(attemptId, answerArray);
      router.push(`/results/${attemptId}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [attemptId, answers, submitting, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  const question = questions[currentIndex];
  const progress = (Object.keys(answers).length / questions.length) * 100;
  const isTimeLow = timeLeft < 60;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Timer */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
          Quiz Mode
        </span>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
            isTimeLow ? "animate-pulse-glow" : ""
          }`}
          style={{
            background: isTimeLow ? "var(--color-incorrect-bg)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isTimeLow ? "var(--color-incorrect)" : "var(--color-border)"}`,
            color: isTimeLow ? "var(--color-incorrect)" : "var(--color-text-primary)",
          }}
        >
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar-track mb-6">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Question Area */}
        <div className="flex-1">
          <div className="glass-card p-6 sm:p-8" key={currentIndex}>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(124,92,255,0.12)", color: "var(--color-accent-light)" }}
              >
                {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {Object.keys(answers).length} of {questions.length} answered
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold mb-6 leading-relaxed">
              {question.question_text}
            </h2>

            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  className={`option-btn ${
                    answers[question.id] === option.id ? "selected" : ""
                  }`}
                  onClick={() => handleOptionSelect(question.id, option.id)}
                >
                  <span className="option-label">{option.label}</span>
                  <span className="pt-1">{option.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}
            >
              ← Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: "rgba(124,92,255,0.12)", border: "1px solid rgba(124,92,255,0.3)", color: "var(--color-accent-light)" }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #7c5cff, #a78bfa)",
                  boxShadow: "0 4px 15px rgba(124, 92, 255, 0.3)",
                }}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="glass-card p-4 lg:sticky lg:top-24">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-secondary)" }}>
              Questions
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className="w-10 h-10 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center"
                    style={{
                      background: isCurrent
                        ? "rgba(124,92,255,0.25)"
                        : isAnswered
                        ? "rgba(52,211,153,0.12)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        isCurrent
                          ? "rgba(124,92,255,0.5)"
                          : isAnswered
                          ? "rgba(52,211,153,0.25)"
                          : "var(--color-border)"
                      }`,
                      color: isCurrent
                        ? "var(--color-accent-light)"
                        : isAnswered
                        ? "var(--color-correct)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Submit Button in Sidebar */}
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
              className="w-full mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #7c5cff, #a78bfa)",
                boxShadow: "0 4px 15px rgba(124, 92, 255, 0.2)",
              }}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
