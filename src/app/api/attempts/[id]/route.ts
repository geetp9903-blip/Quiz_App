import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attemptId = Number(id);
    const supabase = createSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the attempt to verify ownership
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 });
    }

    // 3. Fetch answered questions via get_quiz_result RPC
    const { data: answersRows, error: ansError } = await supabase.rpc('get_quiz_result', {
      p_attempt_id: attemptId
    });

    if (ansError) throw ansError;

    const answeredQuestions = answersRows || [];
    const answeredQuestionIds = answeredQuestions.map((r: any) => r.question_id);
    const remainingCount = attempt.total_questions - answeredQuestionIds.length;

    let newQuestions: any[] = [];
    
    // 4. Fetch remaining new questions if necessary
    if (remainingCount > 0) {
      const { data: qData, error: qError } = await supabase.rpc('get_random_questions', {
        p_subject_id: attempt.subject_id,
        p_limit: remainingCount,
        p_exclude_ids: answeredQuestionIds
      });
      
      if (qError) throw qError;
      newQuestions = qData || [];
    }

    // Format answered questions to match Question type required by frontend
    const recoveredQuestions = answeredQuestions.map((row: any) => ({
      id: row.question_id,
      question_text: row.question_text,
      options: row.all_options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        text: opt.text
      }))
    }));

    const allQuestions = [...recoveredQuestions, ...newQuestions];

    // Format answers state to send to frontend
    const answersState = answeredQuestions.map((row: any) => ({
      questionId: row.question_id,
      selectedOptionId: row.selected_option_id,
      isCorrect: row.is_correct,
      correctOption: {
        id: row.correct_option_id,
        label: row.correct_label,
        text: row.correct_text
      }
    }));

    return NextResponse.json({
      attemptId: attempt.id,
      subjectId: attempt.subject_id,
      mode: attempt.mode,
      totalQuestions: attempt.total_questions,
      startedAt: attempt.started_at,
      score: attempt.score,
      questions: allQuestions,
      answersState
    });

  } catch (err) {
    console.error('Failed to get attempt state:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attemptId = Number(id);
    const supabase = createSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Delete the attempt (verifying ownership)
    const { error } = await supabase
      .from('quiz_attempts')
      .delete()
      .eq('id', attemptId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete attempt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
