import { Token } from '@/types'

export const TOKEN_CONTRACTS: Record<Token, string> = {
  USDC: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  USDT: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
}

export const TOKEN_DECIMALS: Record<Token, number> = {
  USDC: 6,
  USDT: 6,
}

// EIP-681 QR payload: ethereum:<address>/transfer?address=<to>&uint256=<amount>
export function buildPaymentQR(token: Token, toAddress: string, amount: number): string {
  const contractAddress = TOKEN_CONTRACTS[token]
  const decimals = TOKEN_DECIMALS[token]
  const rawAmount = BigInt(Math.round(amount * 10 ** decimals)).toString()
  return `ethereum:${contractAddress}@137/transfer?address=${toAddress}&uint256=${rawAmount}`
}
