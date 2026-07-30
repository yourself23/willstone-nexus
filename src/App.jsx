import React, { useState } from 'react'
import { WillstoneAnchor } from './components/WillstoneAnchor'
import { GuildCommandCenter } from './components/GuildCommandCenter'
import { RealitySplitToggle } from './components/RealitySplitToggle'
import { L1SettlementView } from './components/L1SettlementView'
import { L2SovereignView } from './components/L2SovereignView'
import { Header } from './components/Header'
import { TradeLogPanel } from './components/TradeLogPanel'
import { NexusGovernance } from './components/NexusGovernance'
import { Web3Provider, useWeb3 } from './context/Web3Context'
import { GovernanceProvider } from './context/GovernanceContext'

function Dashboard() {
  const [realityMode, setRealityMode] = useState('L2')
  const [activeTab, setActiveTab] = useState('command') // 'command' | 'governance'
  const { connected, account } = useWeb3()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 p-4 md:p-6 max-w-[1920px] mx-auto w-full">
        {/* Top Section: Willstone Anchor + Reality Toggle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <WillstoneAnchor />
          </div>
          <div className="flex flex-col gap-4">
            <RealitySplitToggle mode={realityMode} onToggle={setRealityMode} />
            <div className="panel-sovereign p-4 flex-1">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Network Status</h3>
              <div className="space-y-2">
                <StatusRow label="Connection" value={connected ? 'Active' : 'Disconnected'} ok={connected} />
                <StatusRow label="Account" value={account ? `${account.slice(0,6)}...${account.slice(-4)}` : 'None'} ok={!!account} />
                <StatusRow label="Sovereign Protocol" value="Online" ok={true} />
                <StatusRow label="L1 Bedrock" value={realityMode === 'L1' ? 'Active' : 'Standby'} ok={realityMode === 'L1'} />
                <StatusRow label="L2 Trading" value={realityMode === 'L2' ? 'Active' : 'Standby'} ok={realityMode === 'L2'} />
                <StatusRow label="Governance Engine" value="Active" ok={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Reality View */}
        <div className="mb-6">
          {realityMode === 'L1' ? <L1SettlementView /> : <L2SovereignView />}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-6 border-b border-nexus-border pb-3">
          <button
            onClick={() => setActiveTab('command')}
            className={`px-5 py-2.5 rounded-t-md text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'command'
                ? 'border-nexus-glow text-nexus-glow bg-nexus-glow/5'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            ⚔ Guild Command
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`px-5 py-2.5 rounded-t-md text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'governance'
                ? 'border-nexus-void text-nexus-void bg-nexus-void/5'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            🏛 Nexus Governance
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'command' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <GuildCommandCenter />
            </div>
            <div>
              <TradeLogPanel />
            </div>
          </div>
        )}

        {activeTab === 'governance' && (
          <NexusGovernance />
        )}
      </main>

      <footer className="border-t border-nexus-border py-3 px-6 text-center text-xs text-gray-600">
        <span className="text-nexus-glow/50">⬡</span> Willstone Nexus v2.0.0 — Sovereign Authority Protocol — Treasury: Timothy — Bot Economy: Active
      </footer>
    </div>
  )
}

function StatusRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className={ok ? 'text-nexus-glow' : 'text-gray-500'}>{value}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-nexus-glow' : 'bg-gray-600'}`} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Web3Provider>
      <GovernanceProvider>
        <Dashboard />
      </GovernanceProvider>
    </Web3Provider>
  )
}
