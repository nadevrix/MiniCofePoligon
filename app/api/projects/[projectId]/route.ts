import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId])

  if (!rows[0]) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  return NextResponse.json(rows[0])
}
