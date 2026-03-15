import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `
      SELECT q.id, q.question_text, q.subject_id,
        json_agg(
          json_build_object(
            'id', o.id,
            'label', o.option_label,
            'text', o.option_text
          ) ORDER BY o.option_label
        ) AS options
      FROM questions q
      JOIN options o ON o.question_id = q.id
      WHERE q.id = $1
      GROUP BY q.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question: result.rows[0] });
  } catch (err) {
    console.error('Failed to fetch question:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
