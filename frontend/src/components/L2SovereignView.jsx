import React, { useState } from 'react'
import { useWeb3 } from '../context/Web3Context'

export function L2SovereignView() {
  const { contractData, executeGuildTrade, tradeLogs } = useWeb3()
  const [quickGuild, setQuickGuild] = useState(0)

  const recentTrades = tradeLogs.filter(l => l.type === 'SOV_TRADE' || l.type === 'SC_TRADE' || l.type === 'TRADE').slice(0, 8)

  return (
    <div className="panel-sovereign p-6 border-nexus-void/20">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-nexus-void text-lg">◎</span>
        <h2 className="text-sm uppercase tracking-[0.2em] text-gray-400 font-bold">L2 Sovereign Trading</h2>
        <div className="flex-1" />
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-void/10 border border-nexus-void/30 text-nexus-void">
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-nexus-darker rounded-md p-4 border border-nexus-border/50">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Guild Volume</div>
          <div className="text-2xl font-bold text-nexus-void">
            {formatNum(contractData.totalGuildVolume)} <span className="text-xs text-gray-500">ETH</span>
          </div>
        </div>
        <div className="bg-nexus-darker rounded-md p-4 border border-nexus-border/50">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Active Guilds</div>
          <div className="text-2xl font-bold text-nexus-glow">
            {contractData.guilds.filter(g => g.active).length}<span className="text-xs text-gray-500">/5</span>
          </div>
        </div>
        <div className="bg-nexus-darker rounded-md p-4 border border-nexus-border/50">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Overhead Captured</div>
          <div className="text-2xl font-bold text-nexus-gold">
            {formatNum(parseFloat(contractData.totalGuildVolume) * 0.45)} <span className="text-xs text-gray-500">ETH</span>
          </div>
        </div>
      </div>

      {/* Quick Sovereign Trade */}
      <div className="bg-nexus-darker/80 rounded-lg p-5 border border-nexus-void/10 mb-4">
        <h3 className="text-xs uppercase tracking-wider text-nexus-void mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Sovereign Trade
        </h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Guild</label>
            <select 
              value={quickGuild} 
              onChange={e => setQuickGuild(Number(e.target.value))}
              className="bg-nexus-panel border border-nexus-border rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-nexus-void/50"
            >
              {contractData.guilds.map((g, i) => <option key={i} value={i}>{g.name}</option>)}
            </select>
          </div>
          <button onClick={() => executeGuildTrade(quickGuild, '1.0')} className="btn-void">1 ETH</button>
          <button onClick={() => executeGuildTrade(quickGuild, '5.0')} className="btn-void">5 ETH</button>
          <button onClick={() => executeGuildTrade(quickGuild, '25.0')} className="btn-void">25 ETH</button>
          <button onClick={() => executeGuildTrade(quickGuild, '100.0')} className="btn-void">100 ETH</button>
        </div>
      </div>

      {/* Live Trade Feed */}
      <div className="bg-nexus-darker/50 rounded-lg p-4 border border-nexus-border/30">
        <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Live SC/SOV Trade Feed</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {recentTrades.map(trade => (
            <div key={trade.id} className="flex items-center gap-3 text-[10px] py-1 border-b border-nexus-border/20">
              <span className={`px-1.5 py-0.5 rounded ${
                trade.type === 'SOV_TRADE' ? 'bg-nexus-void/20 text-nexus-void' : 
                trade.type === 'SC_TRADE' ? 'bg-nexus-glow/20 text-nexus-glow' : 
                'bg-gray-700 text-gray-400'
              }`}>{trade.type}</span>
              <span className="text-gray-500">Guild #{trade.guildId}</span>
              <span className="text-gray-400 truncate max-w-[100px]">{trade.trader}</span>
              <span className="ml-auto font-bold text-gray-300">{parseFloat(trade.amount).toFixed(2)} ETH</span>
              <span className="text-nexus-gold text-[9px]">-{trade.tax} tax</span>
            </div>
          ))}
          {recentTrades.length === 0 && <div className="text-gray-600 text-center py-4">Awaiting trades...</div>}
        </div>
      </div>
    </div>
  )
}

function formatNum(n) {
  const num = parseFloat(n)
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(2)
}
