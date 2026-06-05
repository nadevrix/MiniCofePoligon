import { Token } from '@/types'

export const TOKEN_CONTRACTS: Record<Token, string> = {
  USDC: '0x41E94Eb019C0762f9Bfcf9Fb1e58725bFb0e7582', // Circle USDC en Amoy
  USDT: '0x41E94Eb019C0762f9Bfcf9Fb1e58725bFb0e7582', // Usando la misma de prueba mientras tanto
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
  return `ethereum:${contractAddress}/transfer?address=${toAddress}&uint256=${rawAmount}`
}
