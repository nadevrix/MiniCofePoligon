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
  const safeAmount = Number(amount).toFixed(decimals)
  // Quitar el punto decimal para emular el shift (equivalente manual seguro o podemos usar BigInt en base string)
  const [intPart, fracPart = ''] = safeAmount.split('.')
  const rawAmount = BigInt(intPart + fracPart.padEnd(decimals, '0')).toString()
  return `ethereum:${contractAddress}@137/transfer?address=${toAddress}&uint256=${rawAmount}`
}
