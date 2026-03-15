import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attemptId, questionId, selectedOptionId } = body;

    if (!attemptId || !questionId || !selectedOptionId) {
      return NextResponse.json(
        { error: 'attemptId, questionId, and selectedOptionId are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Get the correct option for this question
    const { data: correctOption, error: optError } = await supabase
      .from('options')
      .select('id, option_label, option_text')
      .eq('question_id', questionId)
      .eq('is_correct', true)
      .single();

    if (optError || !correctOption) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isCorrect = correctOption.id === selectedOptionId;

    // Insert or update the answer
    const { error: ansError } = await supabase
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

    if (ansError) throw ansError;

    // Update score in attempt
    if (isCorrect) {
      await supabase.rpc('increment_score', { p_attempt_id: attemptId });
    }

    return NextResponse.json({
      isCorrect,
      correctOption: {
        id: correctOption.id,
        label: correctOption.option_label,
        text: correctOption.option_text,
      },
    });
  } catch (err) {
    console.error('Failed to submit answer:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
