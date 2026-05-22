import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { pool } from '@/lib/db'
import { TOKEN_CONTRACTS, TOKEN_DECIMALS } from '@/lib/tokens'
import { Token } from '@/types'

function verifySignature(body: string, signature: string): boolean {
  const signingKey = process.env.ALCHEMY_SIGNING_KEY!
  const hmac = createHmac('sha256', signingKey)
  hmac.update(body, 'utf8')
  return hmac.digest('hex') === signature
}

function getTokenFromContract(contractAddress: string): Token | null {
  const lower = contractAddress.toLowerCase()
  for (const [token, address] of Object.entries(TOKEN_CONTRACTS)) {
    if (address.toLowerCase() === lower) return token as Token
  }
  return null
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-alchemy-signature') ?? ''

  if (process.env.ALCHEMY_SIGNING_KEY && !verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const activities = payload?.event?.activity ?? []

  for (const activity of activities) {
    if (activity.category !== 'token') continue

    const toAddress: string = activity.toAddress
    const fromAddress: string = activity.fromAddress
    const contractAddress: string = activity.rawContract?.address ?? ''
    const token = getTokenFromContract(contractAddress)
    if (!token) continue

    const amountReceived = Number(activity.value ?? 0)

    const { rows } = await pool.query(
      "SELECT * FROM orders WHERE payment_address = $1 AND status = 'pending'",
      [toAddress]
    )
    const order = rows[0]
    if (!order) continue

    if (new Date(order.expires_at) < new Date()) {
      await pool.query("UPDATE orders SET status = 'expired' WHERE id = $1", [order.id])
      continue
    }

    const expected = Number(order.amount)
    const diff = Math.abs(amountReceived - expected)
    const tolerance = 0.001

    const status = diff <= tolerance ? 'paid' : amountReceived < expected ? 'underpaid' : 'overpaid'

    await pool.query(
      `UPDATE orders
       SET status = $1, amount_received = $2, payer_wallet = $3, paid_at = NOW()
       WHERE id = $4`,
      [status, amountReceived, fromAddress, order.id]
    )
  }

  return NextResponse.json({ ok: true })
}
