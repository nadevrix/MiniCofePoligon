import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { derivePaymentAddress, registerAddressWithAlchemy } from '@/lib/wallet'
import { Token } from '@/types'

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { description, amount, token, payment_limit_minutes = 15 } = body as {
    description: string
    amount: number
    token: Token
    payment_limit_minutes?: number
  }

  if (!description || !amount || !token) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (!['USDC', 'USDT'].includes(token)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }
  if (amount <= 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }

  const { rows: countRows } = await pool.query('SELECT COUNT(*) AS cnt FROM orders')
  const walletIndex = parseInt(countRows[0].cnt)
  const paymentAddress = derivePaymentAddress(walletIndex)
  const expiresAt = new Date(Date.now() + payment_limit_minutes * 60 * 1000)

  const { rows } = await pool.query(
    `INSERT INTO orders
      (description, amount, token, wallet_index, payment_address, expires_at, payment_limit_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [description, amount, token, walletIndex, paymentAddress, expiresAt, payment_limit_minutes]
  )

  const order = rows[0]

  try {
    await registerAddressWithAlchemy(paymentAddress)
  } catch (err) {
    console.error('Alchemy registration failed:', err)
  }

  return NextResponse.json(order, { status: 201 })
}
