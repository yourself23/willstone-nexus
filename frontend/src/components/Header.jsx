import React from 'react'
import { useWeb3 } from '../context/Web3Context'

export function Header() {
  const { connected, account, chainId, connect, disconnect } = useWeb3()

  return (
    <header className="border-b border-nexus-border bg-nexus-darker/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-nexus-glow/30 to-nexus-void/30 rounded-lg flex items-center justify-center border border-nexus-glow/20 animate-pulse-glow">
              <span className="text-xl">⬡</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-nexus-glow glow-text">WILLSTONE</span>
              <span className="text-gray-400 ml-1">NEXUS</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">Sovereign Authority Protocol</p>
          </div>
        </div>

        {/* Center - Network Info */}
        <div className="hidden md:flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-nexus-glow animate-pulse' : 'bg-red-500'}`} />
            <span className="text-gray-400">
              {connected ? `Chain ${chainId}` : 'Disconnected'}
            </span>
          </div>
          <div className="text-gray-600">|</div>
          <div className="text-gray-400">
            Tax: <span className="text-nexus-gold">45%</span>
          </div>
          <div className="text-gray-600">|</div>
          <div className="text-gray-400">
            Treasury: <span className="text-nexus-celestial">Timothy</span>
          </div>
        </div>

        {/* Wallet Button */}
        <button 
          onClick={connected ? disconnect : connect}
          className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            connected 
              ? 'bg-nexus-glow/10 border border-nexus-glow/30 text-nexus-glow hover:bg-nexus-glow/20'
              : 'bg-nexus-void/20 border border-nexus-void/40 text-nexus-void hover:bg-nexus-void/30'
          }`}
        >
          {connected 
            ? `${account?.slice(0,6)}...${account?.slice(-4)}`
            : '◈ Connect Wallet'
          }
        </button>
      </div>
    </header>
  )
}
