import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limitParams = searchParams.get('limit');
    const limit = limitParams ? parseInt(limitParams) : null;
    const random = searchParams.get('random') === 'true';

    // Get subject info
    const subjectResult = await pool.query(
      'SELECT id, name FROM subjects WHERE id = $1',
      [id]
    );

    if (subjectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Build query
    let query = `
      SELECT q.id, q.question_text,
        json_agg(
          json_build_object(
            'id', o.id,
            'label', o.option_label,
            'text', o.option_text
          ) ORDER BY o.option_label
        ) AS options
      FROM questions q
      JOIN options o ON o.question_id = q.id
      WHERE q.subject_id = $1
      GROUP BY q.id, q.question_text
    `;

    if (random) {
      query += ' ORDER BY RANDOM()';
    } else {
      query += ' ORDER BY q.id';
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const questionsResult = await pool.query(query, [id]);

    return NextResponse.json({
      subject: subjectResult.rows[0],
      questions: questionsResult.rows,
    });
  } catch (err) {
    console.error('Failed to fetch questions:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
