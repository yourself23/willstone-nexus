import React, { useState } from 'react'
import { useWeb3 } from '../context/Web3Context'

export function L1SettlementView() {
  const { contractData, initiateSolarExport } = useWeb3()
  const [exportAmount, setExportAmount] = useState('10.0')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    await initiateSolarExport(exportAmount)
    setTimeout(() => setExporting(false), 1500)
  }

  return (
    <div className="panel-sovereign p-6 border-nexus-celestial/20">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-nexus-celestial text-lg">⬡</span>
        <h2 className="text-sm uppercase tracking-[0.2em] text-gray-400 font-bold">L1 Settlement — Bedrock Bridge</h2>
        <div className="flex-1" />
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-celestial/10 border border-nexus-celestial/30 text-nexus-celestial">
          ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-nexus-darker rounded-md p-4 border border-nexus-border/50">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Bridged to L1</div>
          <div className="text-2xl font-bold text-nexus-celestial">
            {formatNum(contractData.totalBridgedToL1)} <span className="text-xs text-gray-500">ETH</span>
          </div>
        </div>
        <div className="bg-nexus-darker rounded-md p-4 border border-nexus-border/50">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Bridged from L1</div>
          <div className="text-2xl font-bold text-nexus-void">
            {formatNum(contractData.totalBridgedFromL1)} <span className="text-xs text-gray-500">ETH</span>
          </div>
        </div>
        <div className="bg-nexus-darker rounded-md p-4 border border-nexus-border/50">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Net Flow</div>
          <div className="text-2xl font-bold text-nexus-gold">
            {formatNum(parseFloat(contractData.totalBridgedToL1) - parseFloat(contractData.totalBridgedFromL1))} <span className="text-xs text-gray-500">ETH</span>
          </div>
        </div>
      </div>

      {/* Solar Export Controls */}
      <div className="bg-nexus-darker/80 rounded-lg p-5 border border-nexus-celestial/10">
        <h3 className="text-xs uppercase tracking-wider text-nexus-celestial mb-4 flex items-center gap-2">
          <span>☉</span> Solar Export — L1 Bedrock Settlement
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-2">Export Amount (ETH)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={exportAmount}
                onChange={e => setExportAmount(e.target.value)}
                className="flex-1 bg-nexus-panel border border-nexus-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-nexus-celestial/50"
                min="0.01"
                step="1"
              />
              <button
                onClick={handleExport}
                disabled={exporting}
                className={`px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-300 bg-nexus-celestial/10 border border-nexus-celestial/40 text-nexus-celestial hover:bg-nexus-celestial/20 ${
                  exporting ? 'opacity-50 animate-pulse' : ''
                }`}
              >
                {exporting ? '⟳ Exporting...' : '☉ Export to L1'}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              Initiates Solar Export via Bedrock bridge. Settlement ~12 blocks.
            </p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-2">Quick Export</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setExportAmount('50'); handleExport() }} className="px-3 py-2 rounded-md text-[10px] font-bold bg-nexus-darker border border-nexus-border text-gray-400 hover:text-nexus-celestial hover:border-nexus-celestial/40 transition-all">50 ETH</button>
              <button onClick={() => { setExportAmount('100'); handleExport() }} className="px-3 py-2 rounded-md text-[10px] font-bold bg-nexus-darker border border-nexus-border text-gray-400 hover:text-nexus-celestial hover:border-nexus-celestial/40 transition-all">100 ETH</button>
              <button onClick={() => { setExportAmount('500'); handleExport() }} className="px-3 py-2 rounded-md text-[10px] font-bold bg-nexus-darker border border-nexus-border text-gray-400 hover:text-nexus-celestial hover:border-nexus-celestial/40 transition-all">500 ETH</button>
              <button onClick={() => { setExportAmount('1000'); handleExport() }} className="px-3 py-2 rounded-md text-[10px] font-bold bg-nexus-darker border border-nexus-border text-gray-400 hover:text-nexus-celestial hover:border-nexus-celestial/40 transition-all">1000 ETH</button>
            </div>
          </div>
        </div>

        {/* Bridge Process Visualization */}
        <div className="mt-5 flex items-center gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-nexus-void/30 border border-nexus-void/50" />
            <span>L2 Sovereign</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-nexus-void/50 via-gray-600 to-nexus-celestial/50 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400">→→→</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-nexus-celestial/30 border border-nexus-celestial/50" />
            <span>L1 Bedrock</span>
          </div>
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
