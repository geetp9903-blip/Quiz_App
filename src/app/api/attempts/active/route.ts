import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('id, subject_id, mode, score, total_questions, started_at, subjects(name)')
      .eq('user_id', user.id)
      .is('finished_at', null)
      .order('started_at', { ascending: false });

    if (error) throw error;
    
    // Format response
    const formattedAttempts = attempts?.map(a => ({
      ...a,
      subjectName: (a.subjects as any)?.name
    })) || [];

    return NextResponse.json({ attempts: formattedAttempts });
  } catch (err) {
    console.error('Failed to get active attempts:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
