import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { pool } from '@/lib/db'
import { TOKEN_CONTRACTS } from '@/lib/tokens'
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
    const tolerance = 0.001

    // Buscar orden cuya payment_address+token+monto coincida. Incluimos órdenes ya
    // marcadas como 'expired' porque la blockchain no respeta el countdown del backend:
    // si llega el dinero, lo registramos igual para no perder el pago en el dashboard.
    const { rows } = await pool.query(
      `SELECT * FROM orders
       WHERE payment_address = $1
         AND token = $2
         AND status IN ('pending', 'expired')
         AND ABS(amount - $3) <= $4
       ORDER BY ABS(amount - $3) ASC, created_at DESC
       LIMIT 1`,
      [toAddress, token, amountReceived, tolerance]
    )
    const order = rows[0]
    if (!order) continue

    const expected = Number(order.amount)
    const diff = Math.abs(amountReceived - expected)
    const status = diff <= tolerance ? 'paid' : amountReceived < expected ? 'underpaid' : 'overpaid'

    await pool.query(
      `UPDATE orders SET status = $1, amount_received = $2, payer_wallet = $3, paid_at = NOW()
       WHERE id = $4`,
      [status, amountReceived, fromAddress, order.id]
    )
  }

  return NextResponse.json({ ok: true })
}
