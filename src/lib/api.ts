import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// ── Types ───────────────────────────────────────────────────
export interface Subject {
  id: number;
  name: string;
  questionCount: number;
}

export interface Option {
  id: number;
  label: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: number;
  question_text: string;
  options: Option[];
}

export interface QuizStartResponse {
  attemptId: number;
  mode: string;
  totalQuestions: number;
  startedAt: string;
  questions: Question[];
}

export interface AnswerResponse {
  isCorrect: boolean;
  correctOption: { id: number; label: string; text: string };
}

export interface QuizSubmitResponse {
  attemptId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  startedAt: string;
  finishedAt: string;
}

export interface ResultAnswer {
  questionId: number;
  questionText: string;
  selectedOption: { id: number; label: string; text: string } | null;
  correctOption: { id: number; label: string; text: string };
  isCorrect: boolean;
  allOptions: Option[];
}

export interface QuizResult {
  attempt: {
    id: number;
    subjectId: number;
    subjectName: string;
    mode: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    startedAt: string;
    finishedAt: string;
  };
  answers: ResultAnswer[];
}

// ── API Functions ───────────────────────────────────────────
export const getSubjects = async (): Promise<Subject[]> => {
  const res = await api.get('/subjects');
  return res.data.subjects;
};

export const startQuiz = async (
  subjectId: number,
  mode: 'practice' | 'quiz',
  questionCount?: number
): Promise<QuizStartResponse> => {
  const res = await api.post('/quiz/start', { subjectId, mode, questionCount });
  return res.data;
};

export const submitAnswer = async (
  attemptId: number,
  questionId: number,
  selectedOptionId: number
): Promise<AnswerResponse> => {
  const res = await api.post('/quiz/answer', {
    attemptId,
    questionId,
    selectedOptionId,
  });
  return res.data;
};

export const submitQuiz = async (
  attemptId: number,
  answers: { questionId: number; selectedOptionId: number }[]
): Promise<QuizSubmitResponse> => {
  const res = await api.post('/quiz/submit', { attemptId, answers });
  return res.data;
};

export const getQuizResult = async (attemptId: number): Promise<QuizResult> => {
  const res = await api.get(`/quiz/result/${attemptId}`);
  return res.data;
};

export default api;
