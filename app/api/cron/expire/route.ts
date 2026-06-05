import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  // Basic security to ensure only authorized cron can run this
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE orders 
       SET status = 'expired' 
       WHERE status = 'pending' AND expires_at < NOW()`
    )

    return NextResponse.json({ ok: true, expiredCount: rowCount })
  } catch (error) {
    console.error('Failed to expire orders:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
