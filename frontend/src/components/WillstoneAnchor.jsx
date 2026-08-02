import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../context/Web3Context'

export function WillstoneAnchor() {
  const { contractData } = useWeb3()
  const [pulsePhase, setPulsePhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const glowIntensity = Math.sin(pulsePhase * Math.PI / 180) * 0.3 + 0.5

  return (
    <div className="panel-sovereign p-6 relative overflow-hidden">
      {/* Background effect */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(0,255,136,${glowIntensity * 0.2}) 0%, transparent 60%)`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-nexus-glow text-lg">◆</span>
          <h2 className="text-sm uppercase tracking-[0.2em] text-gray-400 font-bold">Willstone Anchor</h2>
          <div className="flex-1" />
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-glow/10 border border-nexus-glow/30 text-nexus-glow uppercase">
            Sovereign Active
          </span>
        </div>

        {/* Central Anchor Display */}
        <div className="text-center py-6">
          <div className="inline-block relative">
            {/* Hexagonal container */}
            <div 
              className="w-40 h-40 mx-auto mb-4 relative flex items-center justify-center"
              style={{
                background: `conic-gradient(from ${pulsePhase}deg, rgba(0,255,136,0.1), rgba(123,47,255,0.1), rgba(0,212,255,0.1), rgba(0,255,136,0.1))`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            >
              <div 
                className="w-36 h-36 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0a0a0f, #0d0d14)',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              >
                <div className="text-center">
                  <div className="text-3xl font-black text-nexus-glow glow-text">450M</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">ETH Anchor</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-6">
            Immutable Sovereign Foundation — <span className="text-nexus-gold">$1.08T USD</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard 
            label="Guild Volume" 
            value={formatLargeNumber(contractData.totalGuildVolume)} 
            unit="ETH"
            color="text-nexus-glow" 
          />
          <StatCard 
            label="Bridged to L1" 
            value={formatLargeNumber(contractData.totalBridgedToL1)} 
            unit="ETH"
            color="text-nexus-celestial" 
          />
          <StatCard 
            label="Bridged from L1" 
            value={formatLargeNumber(contractData.totalBridgedFromL1)} 
            unit="ETH"
            color="text-nexus-void" 
          />
          <StatCard 
            label="Overhead Tax" 
            value="45" 
            unit="%"
            color="text-nexus-gold" 
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="bg-nexus-darker/50 rounded-md p-3 border border-nexus-border/50">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>
        {value}<span className="text-xs text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  )
}

function formatLargeNumber(num) {
  const n = parseFloat(num)
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toFixed(2)
}
