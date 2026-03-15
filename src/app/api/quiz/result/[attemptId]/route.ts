import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const supabase = createSupabaseClient();

    // Get attempt info
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*, subjects!inner(name)')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 });
    }

    // Get all answers with question details
    const { data: answersRows, error: ansError } = await supabase.rpc('get_quiz_result', {
      p_attempt_id: attemptId
    });

    if (ansError) throw ansError;

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        subjectId: attempt.subject_id,
        subjectName: attempt.subjects.name,
        mode: attempt.mode,
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        percentage:
          attempt.total_questions > 0
            ? Math.round((attempt.score / attempt.total_questions) * 100)
            : 0,
        startedAt: attempt.started_at,
        finishedAt: attempt.finished_at,
      },
      answers: (answersRows || []).map((row: any) => ({
        questionId: row.question_id,
        questionText: row.question_text,
        selectedOption: row.selected_option_id
          ? {
              id: row.selected_option_id,
              label: row.selected_label,
              text: row.selected_text,
            }
          : null,
        correctOption: {
          id: row.correct_option_id,
          label: row.correct_label,
          text: row.correct_text,
        },
        isCorrect: row.is_correct,
        allOptions: row.all_options,
      })),
    });
  } catch (err) {
    console.error('Failed to get quiz results:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
