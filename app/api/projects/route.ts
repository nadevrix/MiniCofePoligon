import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { registerAddressWithAlchemy } from '@/lib/wallet'

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at DESC')
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, merchant_wallet } = body as { name: string; merchant_wallet: string }

  if (!name || !merchant_wallet) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(merchant_wallet)) {
    return NextResponse.json({ error: 'Wallet address inválida' }, { status: 400 })
  }

  const { rows } = await pool.query(
    'INSERT INTO projects (name, merchant_wallet) VALUES ($1, $2) RETURNING *',
    [name, merchant_wallet]
  )

  // Registrar la wallet del merchant en Alchemy para monitoreo
  try {
    await registerAddressWithAlchemy(merchant_wallet)
  } catch (err) {
    console.error('Alchemy registration failed:', err)
  }

  return NextResponse.json(rows[0], { status: 201 })
}
