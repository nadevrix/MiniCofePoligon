'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import { ethers } from 'ethers'
import { buildPaymentQR, TOKEN_CONTRACTS, TOKEN_DECIMALS } from '@/lib/tokens'
import { Order } from '@/types'
import Link from 'next/link'

const STATUS_UI = {
  pending:  { label: 'Esperando pago',           color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.2)]' },
  paid:     { label: 'Pago confirmado',           color: 'text-green-400',  bg: 'bg-green-400/10', border: 'border-green-400/30', glow: 'shadow-[0_0_15px_rgba(74,222,128,0.2)]'  },
  underpaid:{ label: 'Monto incorrecto (menor)',  color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', glow: 'shadow-[0_0_15px_rgba(251,146,60,0.2)]' },
  overpaid: { label: 'Pago recibido (excedente)', color: 'text-blue-400',   bg: 'bg-blue-400/10', border: 'border-blue-400/30', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.2)]'   },
  expired:  { label: 'Orden expirada',            color: 'text-gray-400',   bg: 'bg-gray-500/10', border: 'border-gray-500/30', glow: 'shadow-none'    },
}

function useCountdown(expiresAt: string) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const calc = () => setSeconds(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return { display: `${m}:${s}`, expired: seconds === 0 }
}

export default function PayPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [walletConnecting, setWalletConnecting] = useState(false)
  const [paymentTx, setPaymentTx] = useState('')

  async function handleWalletPayment() {
    if (!order) return
    if (!(window as any).ethereum) {
      alert("No se encontró una billetera Web3 (ej. MetaMask).")
      return
    }

    setWalletConnecting(true)
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      
      const network = await provider.getNetwork()
      if (network.chainId !== 137n) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }], // 137 in hex
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/']
              }]
            })
          } else {
            throw new Error("Debes cambiar a la red Polygon Mainnet en tu billetera para pagar.")
          }
        }
      }
      
      const tokenContractAddress = TOKEN_CONTRACTS[order.token]
      const decimals = TOKEN_DECIMALS[order.token]
      const safeAmount = Number(order.amount).toFixed(decimals)
      const [intPart, fracPart = ''] = safeAmount.split('.')
      const rawAmount = BigInt(intPart + fracPart.padEnd(decimals, '0'))

      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)"
      ]
      
      const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, signer)
      const tx = await tokenContract.transfer(order.payment_address, rawAmount)
      
      setPaymentTx(tx.hash)
    } catch (err: any) {
      console.error(err)
      alert(err?.message || "Error al procesar el pago")
    } finally {
      setWalletConnecting(false)
    }
  }

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) setOrder(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
    // Polling cada 3s mientras la orden esté pending
    const interval = setInterval(() => {
      setOrder((prev) => {
        if (!prev || prev.status !== 'pending') return prev
        fetchOrder()
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  const countdown = useCountdown(order?.expires_at ?? new Date().toISOString())

  async function copyAddress() {
    if (!order) return
    await navigator.clipboard.writeText(order.payment_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl text-center border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Orden no encontrada</h2>
          <p className="text-gray-400 mb-6">El link de pago no es válido o ha sido eliminado.</p>
          <Link href="/" className="premium-button-primary px-6 py-2 rounded-xl inline-block">
            Ir al Inicio
          </Link>
        </div>
      </div>
    )
  }

  const ui = STATUS_UI[order.status]
  const qrValue = buildPaymentQR(order.token, order.payment_address, order.amount)
  const isActive = order.status === 'pending' && !countdown.expired

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        
        {isActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Pago
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">#{order.order_number} — {order.description}</p>
        </div>

        <div className={`glass-panel rounded-3xl p-8 border ${ui.border} transition-all duration-500 relative overflow-hidden`}>
          
          {/* Status Badge */}
          <div className={`${ui.bg} ${ui.glow} rounded-2xl px-4 py-3 text-center mb-6 transition-all`}>
            <p className={`${ui.color} font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-wide`}>
              {order.status === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>}
              {order.status === 'paid' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              {ui.label}
            </p>
            {order.status === 'underpaid' && order.amount_received && (
              <p className="text-gray-300 text-xs mt-1.5 font-medium">
                Recibido: ${order.amount_received} — Esperado: ${order.amount}
              </p>
            )}
            {order.status === 'overpaid' && order.amount_received && (
              <p className="text-gray-300 text-xs mt-1.5 font-medium">
                Recibido: ${order.amount_received} (excedente: ${(order.amount_received - order.amount).toFixed(6)})
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="text-center mb-8">
            <p className="text-5xl font-bold text-white tracking-tight">
              ${Number(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className="inline-flex items-center gap-2 mt-2 bg-black/30 px-3 py-1 rounded-full border border-white/5">
              <span className="text-violet-400 font-bold text-sm">{order.token}</span>
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-gray-400 text-sm font-medium">Polygon Network</span>
            </div>
          </div>

          {/* Pay Button Area */}
          {isActive && (
            <div className="mb-6 flex flex-col gap-3">
               <button
                 onClick={handleWalletPayment}
                 disabled={walletConnecting || !!paymentTx}
                 className="premium-button premium-button-primary w-full py-3.5 flex items-center justify-center gap-2 font-bold text-lg"
               >
                 {walletConnecting ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Conectando...
                   </>
                 ) : paymentTx ? (
                   'Pago enviado. Esperando confirmación...'
                 ) : (
                   <>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                     Pagar con Wallet
                   </>
                 )}
               </button>
               
               <div className="flex items-center gap-4 my-2">
                 <div className="h-px bg-white/10 flex-1"></div>
                 <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">o escanea</span>
                 <div className="h-px bg-white/10 flex-1"></div>
               </div>
            </div>
          )}

          {/* QR Area */}
          {isActive ? (
            <div className="mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-6 flex items-center justify-center shadow-2xl">
                <div className="bg-white p-2 rounded-xl">
                  <QRCode value={qrValue} size={220} className="w-full h-auto" />
                </div>
              </div>
            </div>
          ) : (
             <div className="mb-8 flex justify-center">
               <div className="w-24 h-24 rounded-full bg-white/5 border-4 border-white/10 flex items-center justify-center">
                 {order.status === 'paid' ? (
                   <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 ) : (
                   <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 )}
               </div>
             </div>
          )}

          {/* Address Copy */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dirección de pago</p>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold">POLYGON</span>
            </div>
            <button
              onClick={copyAddress}
              disabled={!isActive}
              className={`w-full relative overflow-hidden bg-black/40 hover:bg-black/60 border border-white/10 disabled:opacity-50 disabled:hover:bg-black/40 rounded-xl p-4 text-left transition-all group ${copied ? 'border-green-500/50' : ''}`}
            >
              <p className="text-gray-300 text-sm font-mono break-all leading-relaxed relative z-10">{order.payment_address}</p>
              
              <div className="mt-3 flex items-center justify-between relative z-10">
                <p className={`text-xs font-bold transition-colors ${copied ? 'text-green-400' : 'text-gray-500 group-hover:text-violet-400'}`}>
                  {copied ? '¡Copiado al portapapeles!' : 'Toca para copiar dirección'}
                </p>
                <svg className={`w-4 h-4 ${copied ? 'text-green-400' : 'text-gray-500 group-hover:text-violet-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {copied ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  )}
                </svg>
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            {isActive && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Tiempo Restante</p>
                <p className={`text-xl font-mono font-bold ${countdown.expired ? 'text-red-400' : 'text-white'}`}>
                  {countdown.display}
                </p>
              </div>
            )}

            {order.payer_wallet && (
              <div className={!isActive ? "col-span-2" : ""}>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Pagado desde</p>
                <p className="text-gray-300 text-xs font-mono break-all">{order.payer_wallet}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
