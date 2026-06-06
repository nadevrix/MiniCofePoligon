import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  const { rows } = await pool.query(
    'SELECT orders.*, projects.network FROM orders JOIN projects ON orders.project_id = projects.id WHERE orders.id = $1',
    [orderId]
  )
  const order = rows[0]

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  if (order.status === 'pending' && new Date(order.expires_at) < new Date()) {
    await pool.query("UPDATE orders SET status = 'expired' WHERE id = $1", [orderId])
    order.status = 'expired'
  }

  return NextResponse.json(order)
}
