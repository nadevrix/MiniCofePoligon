export type Token = 'USDC' | 'USDT'
export type Network = 'mainnet' | 'amoy'

export const NETWORK_CONFIG: Record<Network, { chainId: number, contracts: Record<Token, string> }> = {
  mainnet: {
    chainId: 137,
    contracts: {
      USDC: process.env.NEXT_PUBLIC_USDC_MAINNET || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      USDT: process.env.NEXT_PUBLIC_USDT_MAINNET || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    }
  },
  amoy: {
    chainId: 80002,
    contracts: {
      USDC: process.env.NEXT_PUBLIC_USDC_AMOY || '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
      USDT: process.env.NEXT_PUBLIC_USDT_AMOY || '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
    }
  }
}

export const TOKEN_DECIMALS: Record<Token, number> = {
  USDC: 6,
  USDT: 6,
}

// EIP-681 QR payload: ethereum:<address>/transfer?address=<to>&uint256=<amount>
export function buildPaymentQR(network: Network, token: Token, toAddress: string, amount: number): string {
  const config = NETWORK_CONFIG[network]
  const contractAddress = config.contracts[token]
  const decimals = TOKEN_DECIMALS[token]
  const safeAmount = Number(amount).toFixed(decimals)
  // Quitar el punto decimal para emular el shift (equivalente manual seguro o podemos usar BigInt en base string)
  const [intPart, fracPart = ''] = safeAmount.split('.')
  const rawAmount = BigInt(intPart + fracPart.padEnd(decimals, '0')).toString()
  return `ethereum:${contractAddress}@${config.chainId}/transfer?address=${toAddress}&uint256=${rawAmount}`
}
