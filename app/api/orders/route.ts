import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { Token } from '@/types'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')

  const { rows } = projectId
    ? await pool.query(
        'SELECT * FROM orders WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      )
    : await pool.query('SELECT * FROM orders ORDER BY created_at DESC')

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { project_id, description, amount, token, payment_limit_minutes = 15 } = body as {
    project_id: string
    description: string
    amount: number
    token: Token
    payment_limit_minutes?: number
  }

  if (!project_id || !description || !amount || !token) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (!['USDC', 'USDT'].includes(token)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }
  if (amount <= 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }

  // Obtener la wallet del merchant desde el proyecto
  const { rows: projectRows } = await pool.query(
    'SELECT * FROM projects WHERE id = $1',
    [project_id]
  )
  const project = projectRows[0]
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  // Verificar que no haya otra orden pending con el mismo monto en este proyecto
  const { rows: conflict } = await pool.query(
    `SELECT id FROM orders
     WHERE project_id = $1 AND token = $2 AND amount = $3
     AND status = 'pending' AND expires_at > NOW()`,
    [project_id, token, amount]
  )
  if (conflict.length > 0) {
    return NextResponse.json(
      { error: 'Ya hay una orden pendiente con ese monto. Espera a que expire o usa un monto diferente.' },
      { status: 409 }
    )
  }

  const expiresAt = new Date(Date.now() + payment_limit_minutes * 60 * 1000)

  const { rows } = await pool.query(
    `INSERT INTO orders
      (project_id, description, amount, token, payment_address, expires_at, payment_limit_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [project_id, description, amount, token, project.merchant_wallet, expiresAt, payment_limit_minutes]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
