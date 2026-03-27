"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { startQuiz, submitAnswer, Question, AnswerResponse, getActiveAttempts, deleteAttempt, ActiveAttempt } from "@/lib/api";

export default function PracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = Number(params.subjectId);
  const count = Number(searchParams.get("count") || 10);

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [existingSession, setExistingSession] = useState<ActiveAttempt | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Track selected options and feedbacks per question index
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, AnswerResponse>>({});

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const urlAttemptId = searchParams.get("attemptId");

  const loadExistingAttempt = useCallback((id: string | number) => {
    setLoading(true);
    fetch(`/api/attempts/${id}`)
      .then(res => res.json())
      .then(data => {
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        
        const newFeedbacks: Record<number, AnswerResponse> = {};
        const newSelectedOptions: Record<number, number> = {};
        let newScore = 0;
        let newAnswered = 0;

        if (data.answersState) {
          data.answersState.forEach((ans: any) => {
             const qIndex = data.questions.findIndex((q: any) => q.id === ans.questionId);
             if (qIndex !== -1) {
                newSelectedOptions[qIndex] = ans.selectedOptionId;
                newFeedbacks[qIndex] = {
                  isCorrect: ans.isCorrect,
                  correctOption: ans.correctOption
                };
                newAnswered++;
                if (ans.isCorrect) newScore++;
             }
          });
        }

        setSelectedOptions(newSelectedOptions);
        setFeedbacks(newFeedbacks);
        setScore(newScore);
        setAnswered(newAnswered);
        
        const firstUnanswered = data.questions.findIndex((_: any, idx: number) => !newFeedbacks[idx]);
        setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
        
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const startNewQuizSession = useCallback(() => {
    setLoading(true);
    startQuiz(subjectId, "practice", count)
      .then((data) => {
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [subjectId, count]);

  useEffect(() => {
    if (urlAttemptId) {
      loadExistingAttempt(urlAttemptId);
    } else {
      // Check for active sessions before starting a new one
      getActiveAttempts()
        .then((attempts) => {
          const activeForSubject = attempts.find(
            (a) => a.subject_id === subjectId && a.mode === "practice"
          );
          if (activeForSubject) {
            setExistingSession(activeForSubject);
            setShowPrompt(true);
            setLoading(false);
          } else {
            startNewQuizSession();
          }
        })
        .catch((err) => {
          console.error("Failed to check active attempts, starting new quiz:", err);
          startNewQuizSession();
        });
    }
  }, [subjectId, count, urlAttemptId, loadExistingAttempt, startNewQuizSession]);

  const handleStartFresh = async () => {
    if (existingSession) {
      setLoading(true);
      setShowPrompt(false);
      try {
        await deleteAttempt(existingSession.id);
        startNewQuizSession();
      } catch (err) {
        console.error("Failed to delete old attempt:", err);
        startNewQuizSession(); // Fallback to starting new quiz anyway
      }
    }
  };

  const handleResumeSession = () => {
    if (existingSession) {
      setShowPrompt(false);
      // Update URL to reflect the attempt ID, but load it directly to avoid full refresh
      window.history.replaceState(null, "", `/practice/${subjectId}?count=${count}&attemptId=${existingSession.id}`);
      loadExistingAttempt(existingSession.id);
    }
  };

  const handleOptionSelect = useCallback(
    async (optionId: number) => {
      // Prevent selecting if already answered for this index
      if (feedbacks[currentIndex] || !attemptId) return;
      
      setSelectedOptions(prev => ({ ...prev, [currentIndex]: optionId }));

      const result = await submitAnswer(
        attemptId,
        questions[currentIndex].id,
        optionId
      );
      
      setFeedbacks(prev => ({ ...prev, [currentIndex]: result }));
      setAnswered((a) => a + 1);
      if (result.isCorrect) setScore((s) => s + 1);
    },
    [feedbacks, attemptId, questions, currentIndex]
  );

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.push(`/results/${attemptId}`);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (showPrompt && existingSession) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[50vh] px-4">
        <div className="glass-card p-8 text-center animate-fade-in-up border border-violet-500/20 w-full">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold mb-3">Session Already Exists</h2>
          <p className="text-[15px] mb-8 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            You have an unfinished practice session for this subject. Starting a new session will permanently delete your previous progress.
          </p>
          
          <div className="flex items-center justify-between mb-8 px-6 py-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-left">
              <span className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>Current Progress</span>
              <span className="text-lg font-bold">
                {existingSession.score} <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>/ {existingSession.total_questions} answered</span>
              </span>
            </div>
            <div className="text-right">
              <span className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>Started</span>
              <span className="text-[15px] font-medium">
                {new Date(existingSession.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleStartFresh}
              className="px-6 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              Start Fresh
            </button>
            <button
              onClick={handleResumeSession}
              className="px-6 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #7c5cff, #a78bfa)",
                color: "white",
                boxShadow: "0 4px 15px rgba(124, 92, 255, 0.3)",
              }}
            >
              Resume Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center py-20" style={{ color: "var(--color-text-secondary)" }}>No questions found.</div>;
  }

  const question = questions[currentIndex];
  // Progress based on answered questions, not current index
  const progress = (answered / questions.length) * 100;

  const currentFeedback = feedbacks[currentIndex];
  const currentSelectedOption = selectedOptions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
          Practice Mode
        </span>
        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
          Score: <span className="text-emerald-400 font-bold">{score}</span> / {answered}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-track mb-6">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question Card */}
      <div className="glass-card p-6 sm:p-8 mb-6 animate-fade-in-up" key={`question-${currentIndex}`}>
        <div className="flex items-center gap-3 mb-5">
          <span
            className="px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(124,92,255,0.12)", color: "var(--color-accent-light)" }}
          >
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold mb-6 leading-relaxed">
          {question.question_text}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            let state = "";
            if (currentFeedback) {
              if (option.id === currentFeedback.correctOption.id) state = "correct";
              else if (option.id === currentSelectedOption) state = "incorrect";
            } else if (option.id === currentSelectedOption) {
              state = "selected";
            }

            return (
              <button
                key={option.id}
                className={`option-btn ${state}`}
                onClick={() => handleOptionSelect(option.id)}
                disabled={!!currentFeedback}
              >
                <span className="option-label">{option.label}</span>
                <span className="pt-1">{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {currentFeedback && (
          <div
            className="mt-6 p-4 rounded-xl border animate-fade-in-up"
            style={{
              background: currentFeedback.isCorrect
                ? "var(--color-correct-bg)"
                : "var(--color-incorrect-bg)",
              borderColor: currentFeedback.isCorrect
                ? "var(--color-correct)"
                : "var(--color-incorrect)",
            }}
          >
            <p className="font-semibold mb-1" style={{ color: currentFeedback.isCorrect ? "var(--color-correct)" : "var(--color-incorrect)" }}>
              {currentFeedback.isCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </p>
            {!currentFeedback.isCorrect && (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                The correct answer is:{" "}
                <strong style={{ color: "var(--color-correct)" }}>
                  {currentFeedback.correctOption.label}. {currentFeedback.correctOption.text}
                </strong>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}
        >
          ← Previous
        </button>

        {currentFeedback && (
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #7c5cff, #a78bfa)",
              boxShadow: "0 4px 15px rgba(124, 92, 255, 0.3)",
            }}
          >
            {currentIndex < questions.length - 1 ? "Next Question →" : "View Results →"}
          </button>
        )}
      </div>
    </div>
  );
}
