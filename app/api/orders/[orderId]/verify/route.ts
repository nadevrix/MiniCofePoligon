import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { ethers } from 'ethers'
import { NETWORK_CONFIG, TOKEN_DECIMALS } from '@/lib/tokens'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  
  let txHash: string
  try {
    const body = await req.json()
    txHash = body.txHash
    if (!txHash) throw new Error()
  } catch {
    return NextResponse.json({ error: 'txHash es requerido' }, { status: 400 })
  }

  // Obtener la orden de la base de datos junto con la red del proyecto
  const { rows } = await pool.query(
    `SELECT orders.*, projects.network, projects.webhook_url 
     FROM orders 
     JOIN projects ON orders.project_id = projects.id 
     WHERE orders.id = $1`,
    [orderId]
  )
  const order = rows[0]

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  // Si ya está pagada no hacemos nada
  if (['paid', 'underpaid', 'overpaid'].includes(order.status)) {
    return NextResponse.json({ ok: true, status: order.status })
  }

  const network = order.network === 'amoy' ? 'amoy' : 'mainnet'
  const rpcUrl = network === 'amoy' 
    ? 'https://rpc-amoy.polygon.technology/' 
    : 'https://polygon-rpc.com/'

  const provider = new ethers.JsonRpcProvider(rpcUrl)

  try {
    // 1. Esperar confirmación de la tx (1 bloque de confirmación)
    // Usamos waitForTransaction para asegurarnos de que se minó. Si ya se minó, retorna el recibo casi de inmediato.
    const receipt = await provider.waitForTransaction(txHash, 1, 15000) // Timeout 15s

    if (!receipt || receipt.status !== 1) {
      return NextResponse.json({ error: 'La transacción falló en la blockchain o aún no ha sido minada' }, { status: 400 })
    }

    // 2. Obtener los detalles de la transacción para leer los parámetros
    const tx = await provider.getTransaction(txHash)
    if (!tx) {
      return NextResponse.json({ error: 'No se encontraron detalles de la transacción' }, { status: 400 })
    }

    // 3. Validar el contrato destino
    const expectedContractAddress = NETWORK_CONFIG[network].contracts[order.token as 'USDC' | 'USDT']
    if (tx.to?.toLowerCase() !== expectedContractAddress.toLowerCase()) {
      return NextResponse.json({ error: 'La transacción no fue enviada al contrato correcto de ' + order.token }, { status: 400 })
    }

    // 4. Decodificar la data (transfer(address to, uint256 amount))
    const iface = new ethers.Interface(['function transfer(address to, uint256 amount)'])
    let decoded
    try {
      decoded = iface.parseTransaction({ data: tx.data })
    } catch {
      return NextResponse.json({ error: 'No se pudo decodificar la transacción. Verifica que sea una transferencia de ERC20' }, { status: 400 })
    }

    if (!decoded || decoded.name !== 'transfer') {
      return NextResponse.json({ error: 'La transacción no es una transferencia válida' }, { status: 400 })
    }

    const toAddress: string = decoded.args[0]
    const rawAmount: bigint = decoded.args[1]

    // 5. Validar que la billetera destino sea la merchant_wallet esperada
    if (toAddress.toLowerCase() !== order.payment_address.toLowerCase()) {
      return NextResponse.json({ error: 'Los fondos no fueron enviados a la dirección del proyecto' }, { status: 400 })
    }

    // 6. Validar monto
    const decimals = TOKEN_DECIMALS[order.token as 'USDC' | 'USDT']
    const amountReceived = Number(ethers.formatUnits(rawAmount, decimals))
    const expectedAmount = Number(order.amount)
    
    const tolerance = 0.001
    const diff = Math.abs(amountReceived - expectedAmount)
    const newStatus = diff <= tolerance ? 'paid' : amountReceived < expectedAmount ? 'underpaid' : 'overpaid'

    // 7. Actualizar la base de datos
    await pool.query(
      `UPDATE orders SET status = $1, amount_received = $2, payer_wallet = $3, paid_at = NOW()
       WHERE id = $4`,
      [newStatus, amountReceived, tx.from, order.id]
    )

    // 8. Disparar webhook al comercio (Igual que en Alchemy API)
    if (order.webhook_url) {
      try {
        await fetch(order.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'order.updated',
            order_id: order.id,
            order_number: order.order_number,
            status: newStatus,
            amount: expectedAmount,
            amount_received: amountReceived,
            token: order.token
          })
        })
      } catch (err) {
        console.error('Failed to dispatch merchant webhook during direct verify:', err)
      }
    }

    return NextResponse.json({ ok: true, status: newStatus })

  } catch (err: any) {
    console.error('Direct verify error:', err)
    return NextResponse.json({ error: 'Error al verificar la transacción on-chain' }, { status: 500 })
  }
}
