export type Token = 'USDC' | 'USDT'

export type OrderStatus = 'pending' | 'paid' | 'underpaid' | 'overpaid' | 'expired'

export interface Project {
  id: string
  name: string
  merchant_wallet: string
  created_at: string
}

export interface Order {
  id: string
  order_number: number
  project_id: string
  description: string
  amount: number
  token: Token
  payment_address: string
  status: OrderStatus
  expires_at: string
  payment_limit_minutes: number
  amount_received: number | null
  paid_at: string | null
  payer_wallet: string | null
  created_at: string
}
