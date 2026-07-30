import React from 'react'
import { useWeb3 } from '../context/Web3Context'

const TYPE_STYLES = {
  TRADE: 'bg-gray-700/50 text-gray-300',
  SC_TRADE: 'bg-nexus-glow/10 text-nexus-glow',
  SOV_TRADE: 'bg-nexus-void/10 text-nexus-void',
  BOT_CONFIG: 'bg-nexus-gold/10 text-nexus-gold',
  SOLAR_EXPORT: 'bg-nexus-celestial/10 text-nexus-celestial',
}

const STATUS_STYLES = {
  confirmed: 'text-nexus-glow',
  pending: 'text-nexus-gold animate-pulse',
  settled: 'text-nexus-celestial',
}

export function TradeLogPanel() {
  const { tradeLogs } = useWeb3()

  return (
    <div className="panel-sovereign p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-nexus-glow text-sm">◈</span>
        <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Live Trade Log</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-nexus-glow animate-pulse" />
          <span className="text-[9px] text-gray-500">{tradeLogs.length} events</span>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
        {tradeLogs.slice(0, 30).map(log => (
          <div key={log.id} className="bg-nexus-darker/50 rounded p-2 border border-nexus-border/30">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${TYPE_STYLES[log.type] || TYPE_STYLES.TRADE}`}>
                {log.type}
              </span>
              <span className="text-[9px] text-gray-600">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`text-[9px] ml-auto ${STATUS_STYLES[log.status] || 'text-gray-500'}`}>
                {log.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500 truncate max-w-[120px]">{log.trader}</span>
              <div>
                <span className="text-gray-300 font-bold">{parseFloat(log.amount).toFixed(3)}</span>
                {parseFloat(log.tax) > 0 && (
                  <span className="text-nexus-gold ml-1">(-{log.tax})</span>
                )}
              </div>
            </div>
            {log.detail && <div className="text-[9px] text-gray-600 mt-1">{log.detail}</div>}
          </div>
        ))}
        {tradeLogs.length === 0 && (
          <div className="text-center text-gray-600 py-8 text-xs">
            Waiting for activity...
          </div>
        )}
      </div>
    </div>
  )
}
