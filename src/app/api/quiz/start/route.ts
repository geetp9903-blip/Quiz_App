import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subjectId, mode, questionCount } = body;

    if (!subjectId || !mode) {
      return NextResponse.json({ error: 'subjectId and mode are required' }, { status: 400 });
    }

    if (!['practice', 'quiz'].includes(mode)) {
      return NextResponse.json({ error: 'mode must be "practice" or "quiz"' }, { status: 400 });
    }

    const limit = questionCount || (mode === 'quiz' ? 20 : 10);
    const supabase = createSupabaseClient();

    // Get the authenticated user (if any)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get random questions for this subject
    const { data: questionsData, error: qError } = await supabase.rpc('get_random_questions', {
      p_subject_id: subjectId,
      p_limit: limit,
    });

    if (qError) throw qError;

    if (!questionsData || questionsData.length === 0) {
      return NextResponse.json({ error: 'No questions found for this subject' }, { status: 404 });
    }

    // Create quiz attempt
    const attemptPayload: any = {
      subject_id: subjectId,
      mode,
      total_questions: questionsData.length,
    };

    if (user?.id) {
      attemptPayload.user_id = user.id;
    }

    const { data: attemptData, error: aError } = await supabase
      .from('quiz_attempts')
      .insert(attemptPayload)
      .select('id, mode, total_questions, started_at')
      .single();

    if (aError) throw aError;

    return NextResponse.json(
      {
        attemptId: attemptData.id,
        mode: attemptData.mode,
        totalQuestions: attemptData.total_questions,
        startedAt: attemptData.started_at,
        questions: questionsData,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Failed to start quiz:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
