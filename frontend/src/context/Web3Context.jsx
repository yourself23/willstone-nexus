import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const Web3Context = createContext(null)

// Mock contract data for demo when no wallet connected
const MOCK_DATA = {
  willstoneAnchor: '450000000',
  overheadTax: 4500,
  totalGuildVolume: '12847392.45',
  totalBridgedToL1: '8234100.00',
  totalBridgedFromL1: '6891200.00',
  guilds: [
    { id: 0, name: 'Sovereign Authority', volume: '4521000', members: 142, active: true, botFlags: 7 },
    { id: 1, name: 'Nexus Command', volume: '3102000', members: 89, active: true, botFlags: 3 },
    { id: 2, name: 'Celestial Order', volume: '2340000', members: 67, active: true, botFlags: 5 },
    { id: 3, name: 'Forge Collective', volume: '1890000', members: 53, active: true, botFlags: 1 },
    { id: 4, name: 'Void Syndicate', volume: '994392', members: 31, active: true, botFlags: 15 },
  ],
  tradeLogs: [],
  solarExports: []
}

export function Web3Provider({ children }) {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [provider, setProvider] = useState(null)
  const [contractData, setContractData] = useState(MOCK_DATA)
  const [tradeLogs, setTradeLogs] = useState([])

  const connect = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const chain = await window.ethereum.request({ method: 'eth_chainId' })
        setAccount(accounts[0])
        setChainId(parseInt(chain, 16))
        setConnected(true)
      } catch (err) {
        console.error('Connection failed:', err)
      }
    } else {
      // Demo mode - simulate connection
      setAccount('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28')
      setChainId(31337)
      setConnected(true)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setConnected(false)
  }, [])

  const addTradeLog = useCallback((log) => {
    setTradeLogs(prev => [log, ...prev].slice(0, 50))
  }, [])

  const executeGuildTrade = useCallback(async (guildId, amount) => {
    const log = {
      id: Date.now(),
      guildId,
      trader: account || '0x742d...f2bD',
      amount: amount,
      tax: (parseFloat(amount) * 0.45).toFixed(4),
      timestamp: new Date().toISOString(),
      type: 'TRADE',
      status: 'confirmed'
    }
    addTradeLog(log)

    // Update guild volume
    setContractData(prev => ({
      ...prev,
      guilds: prev.guilds.map(g => 
        g.id === guildId 
          ? { ...g, volume: (parseFloat(g.volume) + parseFloat(amount)).toString() }
          : g
      ),
      totalGuildVolume: (parseFloat(prev.totalGuildVolume) + parseFloat(amount)).toFixed(2)
    }))

    return log
  }, [account, addTradeLog])

  const updateGuildBotBehavior = useCallback(async (guildId, flags) => {
    setContractData(prev => ({
      ...prev,
      guilds: prev.guilds.map(g => 
        g.id === guildId ? { ...g, botFlags: flags } : g
      )
    }))
    addTradeLog({
      id: Date.now(),
      guildId,
      trader: 'SYSTEM',
      amount: '0',
      tax: '0',
      timestamp: new Date().toISOString(),
      type: 'BOT_CONFIG',
      status: 'confirmed',
      detail: `Bot flags updated to ${flags}`
    })
  }, [addTradeLog])

  const initiateSolarExport = useCallback(async (amount) => {
    const log = {
      id: Date.now(),
      guildId: -1,
      trader: 'SOLAR_OPERATOR',
      amount,
      tax: '0',
      timestamp: new Date().toISOString(),
      type: 'SOLAR_EXPORT',
      status: 'pending'
    }
    addTradeLog(log)
    setContractData(prev => ({
      ...prev,
      totalBridgedToL1: (parseFloat(prev.totalBridgedToL1) + parseFloat(amount)).toFixed(2)
    }))
    // Simulate settlement after 3s
    setTimeout(() => {
      setTradeLogs(prev => prev.map(l => 
        l.id === log.id ? { ...l, status: 'settled' } : l
      ))
    }, 3000)
    return log
  }, [addTradeLog])

  // Auto-generate some trade activity
  useEffect(() => {
    const interval = setInterval(() => {
      const guildId = Math.floor(Math.random() * 5)
      const amount = (Math.random() * 10 + 0.1).toFixed(4)
      const types = ['TRADE', 'SC_TRADE', 'SOV_TRADE']
      addTradeLog({
        id: Date.now(),
        guildId,
        trader: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        amount,
        tax: (parseFloat(amount) * 0.45).toFixed(4),
        timestamp: new Date().toISOString(),
        type: types[Math.floor(Math.random() * types.length)],
        status: 'confirmed'
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [addTradeLog])

  return (
    <Web3Context.Provider value={{
      connected, account, chainId, provider,
      connect, disconnect,
      contractData, tradeLogs,
      executeGuildTrade, updateGuildBotBehavior, initiateSolarExport
    }}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider')
  return ctx
}
