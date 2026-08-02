import React, { useState } from 'react'
import { useWeb3 } from '../context/Web3Context'

const GUILD_COLORS = {
  0: { border: 'border-nexus-glow/40', bg: 'bg-nexus-glow/5', text: 'text-nexus-glow', icon: '◈' },
  1: { border: 'border-nexus-celestial/40', bg: 'bg-nexus-celestial/5', text: 'text-nexus-celestial', icon: '◇' },
  2: { border: 'border-nexus-gold/40', bg: 'bg-nexus-gold/5', text: 'text-nexus-gold', icon: '☉' },
  3: { border: 'border-nexus-forge/40', bg: 'bg-nexus-forge/5', text: 'text-nexus-forge', icon: '⚒' },
  4: { border: 'border-nexus-void/40', bg: 'bg-nexus-void/5', text: 'text-nexus-void', icon: '◎' },
}

const BOT_BEHAVIORS = [
  { flag: 1, label: 'Auto-Trade', desc: 'Execute trades when spread detected' },
  { flag: 2, label: 'Arbitrage', desc: 'Cross-guild arbitrage scanning' },
  { flag: 4, label: 'Hedge', desc: 'Auto-hedge positions above threshold' },
  { flag: 8, label: 'Liquidate', desc: 'Liquidation bot enabled' },
]

export function GuildCommandCenter() {
  const { contractData, executeGuildTrade, updateGuildBotBehavior } = useWeb3()
  const [selectedGuild, setSelectedGuild] = useState(0)
  const [tradeAmount, setTradeAmount] = useState('1.0')
  const [executing, setExecuting] = useState(false)

  const guild = contractData.guilds[selectedGuild]
  const colors = GUILD_COLORS[selectedGuild]

  const handleTrade = async () => {
    setExecuting(true)
    await executeGuildTrade(selectedGuild, tradeAmount)
    setTimeout(() => setExecuting(false), 1000)
  }

  const toggleBotFlag = async (flag) => {
    const currentFlags = guild.botFlags
    const newFlags = currentFlags ^ flag
    await updateGuildBotBehavior(selectedGuild, newFlags)
  }

  return (
    <div className="panel-sovereign p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-nexus-gold text-lg">⚔</span>
        <h2 className="text-sm uppercase tracking-[0.2em] text-gray-400 font-bold">Guild Command Center</h2>
      </div>

      {/* Guild Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {contractData.guilds.map((g, idx) => {
          const c = GUILD_COLORS[idx]
          return (
            <button
              key={idx}
              onClick={() => setSelectedGuild(idx)}
              className={`flex-shrink-0 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                selectedGuild === idx 
                  ? `${c.bg} ${c.border} ${c.text}` 
                  : 'bg-nexus-darker/50 border-nexus-border text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="mr-1">{c.icon}</span> {g.name.split(' ')[0]}
            </button>
          )
        })}
      </div>

      {/* Selected Guild Detail */}
      <div className={`rounded-lg p-5 border ${colors.border} ${colors.bg} mb-5`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`text-lg font-bold ${colors.text}`}>
              {colors.icon} {guild.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Guild #{selectedGuild} • {guild.members} members • {guild.active ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${colors.text}`}>
              {formatVolume(guild.volume)} <span className="text-xs text-gray-500">ETH</span>
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Total Volume</div>
          </div>
        </div>

        {/* Trade Execution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-2">Execute Trade</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tradeAmount}
                onChange={e => setTradeAmount(e.target.value)}
                className="flex-1 bg-nexus-darker border border-nexus-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-nexus-glow/50"
                step="0.1"
                min="0.01"
              />
              <button
                onClick={handleTrade}
                disabled={executing}
                className={`btn-sovereign ${executing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {executing ? '⟳' : '⚡'} Trade
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">
              Tax: {(parseFloat(tradeAmount || 0) * 0.45).toFixed(4)} ETH → Treasury
            </p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-2">Quick Actions</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setTradeAmount('5.0'); handleTrade() }} className="btn-sovereign text-[10px] py-1 px-2">5 ETH</button>
              <button onClick={() => { setTradeAmount('10.0'); handleTrade() }} className="btn-sovereign text-[10px] py-1 px-2">10 ETH</button>
              <button onClick={() => { setTradeAmount('50.0'); handleTrade() }} className="btn-sovereign text-[10px] py-1 px-2">50 ETH</button>
              <button onClick={() => { setTradeAmount('100.0'); handleTrade() }} className="btn-sovereign text-[10px] py-1 px-2">100 ETH</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Behavior Controls */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
          <span>🤖</span> Bot Behavior Controls
          <span className="text-[10px] text-gray-600 normal-case">(flags: {guild.botFlags})</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BOT_BEHAVIORS.map(bot => {
            const active = (guild.botFlags & bot.flag) !== 0
            return (
              <button
                key={bot.flag}
                onClick={() => toggleBotFlag(bot.flag)}
                className={`p-3 rounded-md border text-left transition-all duration-300 ${
                  active 
                    ? 'border-nexus-glow/40 bg-nexus-glow/5' 
                    : 'border-nexus-border bg-nexus-darker/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${active ? 'text-nexus-glow' : 'text-gray-500'}`}>
                    {bot.label}
                  </span>
                  <div className={`w-6 h-3 rounded-full transition-all duration-300 ${
                    active ? 'bg-nexus-glow/30' : 'bg-gray-700'
                  }`}>
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      active ? 'bg-nexus-glow translate-x-3' : 'bg-gray-500 translate-x-0'
                    }`} />
                  </div>
                </div>
                <p className="text-[9px] text-gray-600">{bot.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatVolume(vol) {
  const n = parseFloat(vol)
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toFixed(2)
}
