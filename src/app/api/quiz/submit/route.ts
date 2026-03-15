import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attemptId, answers } = body;

    if (!attemptId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'attemptId and answers array are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    let score = 0;

    // Process each answer
    for (const answer of answers) {
      const { questionId, selectedOptionId } = answer;

      // Get correct option
      const { data: correctOption } = await supabase
        .from('options')
        .select('id')
        .eq('question_id', questionId)
        .eq('is_correct', true)
        .single();

      const isCorrect = correctOption && correctOption.id === selectedOptionId;
      if (isCorrect) score++;

      // Insert answer
      await supabase
        .from('quiz_answers')
        .upsert(
          {
            attempt_id: attemptId,
            question_id: questionId,
            selected_option_id: selectedOptionId,
            is_correct: isCorrect,
            answered_at: new Date().toISOString()
          },
          { onConflict: 'attempt_id,question_id' }
        );
    }

    // Update attempt with final score
    const { data: attemptData, error: updateError } = await supabase
      .from('quiz_attempts')
      .update({ score, finished_at: new Date().toISOString() })
      .eq('id', attemptId)
      .select('id, total_questions, score, started_at, finished_at')
      .single();

    if (updateError || !attemptData) throw updateError;

    return NextResponse.json({
      attemptId: attemptData.id,
      score: attemptData.score,
      totalQuestions: attemptData.total_questions,
      percentage: Math.round((attemptData.score / attemptData.total_questions) * 100),
      startedAt: attemptData.started_at,
      finishedAt: attemptData.finished_at,
    });
  } catch (err) {
    console.error('Failed to submit quiz:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
