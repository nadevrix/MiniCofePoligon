import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { pool } from '@/lib/db'
import { NETWORK_CONFIG, Network, Token } from '@/lib/tokens'

function verifySignature(body: string, signature: string, network: Network): boolean {
  const signingKey = network === 'mainnet'
    ? process.env.ALCHEMY_SIGNING_KEY_MAINNET
    : process.env.ALCHEMY_SIGNING_KEY_AMOY
  
  if (!signingKey) return false

  const hmac = createHmac('sha256', signingKey)
  hmac.update(body, 'utf8')
  return hmac.digest('hex') === signature
}

function getTokensFromContract(contractAddress: string, network: Network): Token[] {
  const lower = contractAddress.toLowerCase()
  const tokens: Token[] = []
  const contracts = NETWORK_CONFIG[network].contracts
  for (const [token, address] of Object.entries(contracts)) {
    if (address.toLowerCase() === lower) tokens.push(token as Token)
  }
  return tokens
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-alchemy-signature') ?? ''
  
  const networkParam = req.nextUrl.searchParams.get('network')
  const network: Network = networkParam === 'amoy' ? 'amoy' : 'mainnet'

  if (!verifySignature(rawBody, signature, network)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const activities = payload?.event?.activity ?? []

  for (const activity of activities) {
    if (activity.category !== 'token') continue

    const toAddress: string = activity.toAddress
    const fromAddress: string = activity.fromAddress
    const contractAddress: string = activity.rawContract?.address ?? ''
    const tokens = getTokensFromContract(contractAddress, network)
    if (tokens.length === 0) continue

    const amountReceived = Number(activity.value ?? 0)
    const tolerance = 0.001

    // Buscar orden cuya payment_address+token+monto coincida. Incluimos órdenes ya
    // marcadas como 'expired' porque la blockchain no respeta el countdown del backend:
    // si llega el dinero, lo registramos igual para no perder el pago en el dashboard.
    const { rows } = await pool.query(
      `SELECT * FROM orders
       WHERE payment_address = $1
         AND token = ANY($2::text[])
         AND status IN ('pending', 'expired')
         AND ABS(amount - $3) <= $4
       ORDER BY ABS(amount - $3) ASC, created_at DESC
       LIMIT 1`,
      [toAddress, tokens, amountReceived, tolerance]
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

    // Notificar al merchant si tiene configurada una webhook_url
    const { rows: projectRows } = await pool.query(
      `SELECT webhook_url FROM projects WHERE id = $1`,
      [order.project_id]
    )
    const webhookUrl = projectRows[0]?.webhook_url

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'order.updated',
            order_id: order.id,
            order_number: order.order_number,
            status,
            amount: expected,
            amount_received: amountReceived,
            token: order.token
          })
        })
      } catch (err) {
        console.error('Failed to dispatch webhook for order', order.id, err)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
