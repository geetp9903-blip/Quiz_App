import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    const { data: subjectsData, error } = await supabase
      .from('subjects')
      .select('id, name, questions(count)')
      .order('name');

    if (error) throw error;

    const subjects = subjectsData.map((s: any) => ({
      id: s.id,
      name: s.name,
      questionCount: s.questions[0].count,
    }));

    return NextResponse.json({ subjects });
  } catch (err: any) {
    console.error('Failed to fetch subjects:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
