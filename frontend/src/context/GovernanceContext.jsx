import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const GovernanceContext = createContext(null)

const BUILD_CATEGORIES = ['SOLAR_ARRAY', 'HEALTH_CENTER', 'SECURITY_GRID', 'TRADE_HUB', 'VOID_REACTOR', 'RECREATION', 'LIVING_QUARTERS']
const PRIORITIZED_CATEGORIES = new Set(['RECREATION', 'LIVING_QUARTERS', 'HEALTH_CENTER'])

const CATEGORY_ICONS = {
  SOLAR_ARRAY: '☉', HEALTH_CENTER: '✚', SECURITY_GRID: '🛡',
  TRADE_HUB: '⚡', VOID_REACTOR: '◎', RECREATION: '🎭', LIVING_QUARTERS: '🏠'
}
const CATEGORY_COLORS = { 
  SOLAR_ARRAY: 'text-yellow-400', 
  HEALTH_CENTER: 'text-green-400', 
  SECURITY_GRID: 'text-blue-400', 
  TRADE_HUB: 'text-nexus-gold', 
  VOID_REACTOR: 'text-nexus-void',
  RECREATION: 'text-pink-400',
  LIVING_QUARTERS: 'text-amber-300',
}

const GUILD_NAMES = ['Sovereign Authority', 'Nexus Command', 'Celestial Order', 'Forge Collective', 'Void Syndicate']

const PROPOSAL_TEMPLATES = [
  { title: 'Solar Expansion Array - Phase {n}', category: 'SOLAR_ARRAY', costRange: [500, 2000], benefitRange: [100, 500] },
  { title: 'Sovereign Health Grid - Sector {n}', category: 'HEALTH_CENTER', costRange: [300, 1500], benefitRange: [50, 300] },
  { title: 'Nexus Defense Matrix - Layer {n}', category: 'SECURITY_GRID', costRange: [800, 3000], benefitRange: [150, 600] },
  { title: 'Trade Acceleration Hub - Node {n}', category: 'TRADE_HUB', costRange: [400, 1800], benefitRange: [75, 400] },
  { title: 'Void Energy Reactor - Core {n}', category: 'VOID_REACTOR', costRange: [1000, 5000], benefitRange: [200, 800] },
  { title: 'Recreation Plaza - District {n}', category: 'RECREATION', costRange: [400, 1600], benefitRange: [80, 350] },
  { title: 'Living Quarters Block - Zone {n}', category: 'LIVING_QUARTERS', costRange: [350, 1400], benefitRange: [60, 280] },
]

const PRIORITY_TEMPLATES = PROPOSAL_TEMPLATES.filter(t => PRIORITIZED_CATEGORIES.has(t.category))
const NON_PRIORITY_TEMPLATES = PROPOSAL_TEMPLATES.filter(t => !PRIORITIZED_CATEGORIES.has(t.category))

const COLLAB_ACTIVITIES = [
  'Laying foundation — materials sourced from multiple guild stockpiles',
  'Cross-guild engineering team assembling core components',
  'Resource transport convoy delivering SC materials to build site',
  'Quality assurance inspection — joint guild review panel',
  'Energy calibration phase — Void and Celestial guilds syncing arrays',
  'Structural integrity testing — Forge bots running stress simulations',
  'Software deployment for control systems — Nexus Command bots active',
  'Final integration pass — all contributing guilds present',
  'Residential sector wiring — Living Quarters electrification',
  'Recreational amenity installation — community spaces coming online',
]

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

const AUTO_VALIDATION_LIMIT = 15
const AUTO_FUND_BASE_AMOUNT = 200

export function GovernanceProvider({ children }) {
  const [proposals, setProposals] = useState([])
  const [projects, setProjects] = useState([])
  const [collaborations, setCollaborations] = useState([])
  const [infraBonuses, setInfraBonuses] = useState({
    SOLAR_ARRAY: 0, HEALTH_CENTER: 0, SECURITY_GRID: 0, TRADE_HUB: 0, VOID_REACTOR: 0,
    RECREATION: 0, LIVING_QUARTERS: 0,
  })
  const [guildScBalances, setGuildScBalances] = useState({
    0: 10000, 1: 8000, 2: 7500, 3: 9000, 4: 6500
  })
  const [totalScConsumed, setTotalScConsumed] = useState(0)
  const [totalScReinvested, setTotalScReinvested] = useState(0)
  const [eventLog, setEventLog] = useState([])

  // Auto-Validation & Auto-Fund state
  const [autoValidationActive, setAutoValidationActive] = useState(true)
  const [autoFundActive, setAutoFundActive] = useState(true)
  const autoValidatedCount = useRef(0)

  const proposalCounter = useRef(0)
  const projectCounter = useRef(0)
  const collabCounter = useRef(0)

  const addEvent = useCallback((type, message, details = {}) => {
    setEventLog(prev => [{
      id: Date.now() + Math.random(),
      type, message, details,
      timestamp: new Date().toISOString()
    }, ...prev].slice(0, 100))
  }, [])

  // ─── Proposal Generation (Bot-driven, 70% priority weighting) ─────
  const generateProposal = useCallback(() => {
    // 70% chance for priority categories (Recreation, Living Quarters, Health)
    let template
    if (Math.random() < 0.70 && PRIORITY_TEMPLATES.length > 0) {
      template = PRIORITY_TEMPLATES[rand(0, PRIORITY_TEMPLATES.length - 1)]
    } else {
      template = NON_PRIORITY_TEMPLATES[rand(0, NON_PRIORITY_TEMPLATES.length - 1)]
    }

    const n = proposalCounter.current + 1
    const cost = rand(...template.costRange)
    const benefit = rand(...template.benefitRange)
    const proposer = rand(0, 4)
    const numCollabs = rand(1, 3)
    const otherGuilds = [0,1,2,3,4].filter(g => g !== proposer)
    const collabs = otherGuilds.sort(() => Math.random() - 0.5).slice(0, numCollabs)

    const isPriority = PRIORITIZED_CATEGORIES.has(template.category)
    const shouldAutoValidate = autoValidationActive && isPriority && autoValidatedCount.current < AUTO_VALIDATION_LIMIT

    const proposal = {
      id: proposalCounter.current,
      title: template.title.replace('{n}', n),
      category: template.category,
      scCost: cost,
      expectedBenefit: benefit,
      proposerGuild: proposer,
      collaboratingGuilds: [proposer, ...collabs],
      votesFor: shouldAutoValidate ? 1 : 0,
      votesAgainst: 0,
      status: shouldAutoValidate ? 'BUILDING' : 'ACTIVE',
      fundedAmount: 0,
      createdAt: Date.now(),
      deadline: shouldAutoValidate ? Date.now() : Date.now() + 180000,
      autoValidated: shouldAutoValidate,
    }

    proposalCounter.current++

    if (shouldAutoValidate) {
      autoValidatedCount.current++
      addEvent('AUTO_VALIDATED', `🏛️ Sovereign Mandate: ${proposal.title} [${autoValidatedCount.current}/${AUTO_VALIDATION_LIMIT}]`, { proposalId: proposal.id, category: template.category })
      
      // Immediately start project
      const project = {
        id: projectCounter.current,
        proposalId: proposal.id,
        name: proposal.title,
        category: proposal.category,
        progress: 0,
        totalInvested: 0,
        benefitMultiplier: proposal.expectedBenefit,
        contributingGuilds: proposal.collaboratingGuilds,
        startedAt: Date.now(),
        completed: false,
        autoValidated: true,
      }

      // Apply auto-fund if active
      if (autoFundActive) {
        const boost = Math.floor((AUTO_FUND_BASE_AMOUNT / cost) * 10000)
        project.progress = Math.min(10000, boost)
        project.totalInvested = AUTO_FUND_BASE_AMOUNT
        proposal.fundedAmount = AUTO_FUND_BASE_AMOUNT
        setTotalScReinvested(t => t + AUTO_FUND_BASE_AMOUNT)
        addEvent('AUTO_FUND', `💎 Auto-Fund injected ${AUTO_FUND_BASE_AMOUNT} SC → ${proposal.title}`, { projectId: project.id })
      }

      projectCounter.current++
      setProjects(p => [...p, project])
      setProposals(prev => [proposal, ...prev])
      addEvent('PROJECT_START', `🏗️ Project started [Sovereign Mandate]: ${project.name}`, { projectId: project.id })
    } else {
      setProposals(prev => [proposal, ...prev])
      addEvent('PROPOSAL', `New proposal: ${proposal.title}`, { proposalId: proposal.id, category: template.category })

      // Auto-vote after delay
      setTimeout(() => {
        setProposals(prev => prev.map(p => {
          if (p.id === proposal.id && p.status === 'ACTIVE') {
            const vf = rand(15, 35)
            const va = rand(5, 20)
            return { ...p, votesFor: vf, votesAgainst: va }
          }
          return p
        }))
      }, rand(5000, 15000))

      // Auto-finalize after voting
      setTimeout(() => {
        setProposals(prev => prev.map(p => {
          if (p.id === proposal.id && p.status === 'ACTIVE') {
            if (p.votesFor > p.votesAgainst) {
              startProjectFromProposal(proposal.id)
              return { ...p, status: 'BUILDING' }
            } else {
              addEvent('REJECTED', `Proposal rejected: ${p.title}`)
              return { ...p, status: 'REJECTED' }
            }
          }
          return p
        }))
      }, rand(20000, 40000))
    }

    return proposal
  }, [addEvent, autoValidationActive, autoFundActive])

  // ─── Start Project ─────────────────────────────────────────────────
  const startProjectFromProposal = useCallback((proposalId) => {
    setProposals(prev => {
      const prop = prev.find(p => p.id === proposalId)
      if (!prop) return prev

      const project = {
        id: projectCounter.current,
        proposalId: prop.id,
        name: prop.title,
        category: prop.category,
        progress: 0,
        totalInvested: 0,
        benefitMultiplier: prop.expectedBenefit,
        contributingGuilds: prop.collaboratingGuilds,
        startedAt: Date.now(),
        completed: false,
        autoValidated: false,
      }
      projectCounter.current++
      setProjects(p => [...p, project])
      addEvent('PROJECT_START', `Project started: ${project.name}`, { projectId: project.id })

      return prev.map(p => p.id === proposalId ? { ...p, status: 'BUILDING' } : p)
    })
  }, [addEvent])

  // ─── Bot Collaboration ─────────────────────────────────────────────
  const executeCollaboration = useCallback(() => {
    setProjects(prev => {
      const active = prev.filter(p => !p.completed)
      if (active.length === 0) return prev

      const project = active[rand(0, active.length - 1)]
      const proposal = proposals.find(p => p.id === project.proposalId)
      if (!proposal) return prev

      const scPerEvent = proposal.scCost * (rand(5, 15) / 100)
      const guildIds = project.contributingGuilds
      const perGuildCost = scPerEvent / guildIds.length

      let canProceed = true
      for (const gid of guildIds) {
        if ((guildScBalances[gid] || 0) < perGuildCost) canProceed = false
      }
      if (!canProceed) return prev

      setGuildScBalances(bal => {
        const updated = { ...bal }
        for (const gid of guildIds) updated[gid] = (updated[gid] || 0) - perGuildCost
        return updated
      })

      setTotalScConsumed(t => t + scPerEvent)

      const progressDelta = Math.min(10000 - project.progress, Math.floor((scPerEvent / proposal.scCost) * 10000))
      const activity = COLLAB_ACTIVITIES[rand(0, COLLAB_ACTIVITIES.length - 1)]

      const collab = {
        id: collabCounter.current,
        projectId: project.id,
        guildIds,
        scConsumed: scPerEvent,
        activity,
        timestamp: Date.now(),
      }
      collabCounter.current++
      setCollaborations(c => [collab, ...c].slice(0, 50))
      addEvent('COLLABORATION', activity, { projectId: project.id, scConsumed: scPerEvent.toFixed(1) })

      return prev.map(p => {
        if (p.id === project.id) {
          const newProgress = Math.min(10000, p.progress + progressDelta)
          if (newProgress >= 10000) {
            completeProject(p.id)
            return { ...p, progress: 10000, completed: true, totalInvested: p.totalInvested + scPerEvent }
          }
          return { ...p, progress: newProgress, totalInvested: p.totalInvested + scPerEvent }
        }
        return p
      })
    })
  }, [proposals, guildScBalances, addEvent])

  // ─── Complete Project ──────────────────────────────────────────────
  const completeProject = useCallback((projectId) => {
    setProjects(prev => {
      const project = prev.find(p => p.id === projectId)
      if (!project) return prev
      setInfraBonuses(b => ({ ...b, [project.category]: (b[project.category] || 0) + project.benefitMultiplier }))
      setProposals(props => props.map(p => p.id === project.proposalId ? { ...p, status: 'COMPLETED' } : p))
      addEvent('COMPLETED', `✅ Project completed: ${project.name} (+${project.benefitMultiplier}bps)${project.autoValidated ? ' [Sovereign Mandate]' : ''}`, { projectId })
      return prev.map(p => p.id === projectId ? { ...p, completed: true, progress: 10000 } : p)
    })
  }, [addEvent])

  // ─── Treasury Controls ─────────────────────────────────────────────
  const vetoProposal = useCallback((proposalId) => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId && (p.status === 'ACTIVE' || p.status === 'BUILDING')) {
        addEvent('VETO', `🚫 Treasury VETOED: ${p.title}`, { proposalId })
        setProjects(proj => proj.map(pr => 
          pr.proposalId === proposalId ? { ...pr, completed: true } : pr
        ))
        return { ...p, status: 'VETOED' }
      }
      return p
    }))
  }, [addEvent])

  const fastTrackProposal = useCallback((proposalId) => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId && p.status === 'ACTIVE') {
        addEvent('FAST_TRACK', `⚡ Treasury FAST-TRACKED: ${p.title}`, { proposalId })
        startProjectFromProposal(proposalId)
        return { ...p, status: 'FAST_TRACKED' }
      }
      return p
    }))
  }, [addEvent, startProjectFromProposal])

  const fundProposal = useCallback((proposalId, amount) => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        addEvent('FUNDED', `💰 Treasury funded ${p.title} with ${amount} SC`, { proposalId, amount })
        return { ...p, fundedAmount: p.fundedAmount + amount }
      }
      return p
    }))
    setTotalScReinvested(t => t + amount)
    setProjects(prev => prev.map(p => {
      if (p.proposalId === proposalId && !p.completed) {
        const proposal = proposals.find(pr => pr.id === proposalId)
        const boost = proposal ? Math.floor((amount / proposal.scCost) * 10000) : 500
        const newProgress = Math.min(10000, p.progress + boost)
        if (newProgress >= 10000) {
          completeProject(p.id)
          return { ...p, progress: 10000, completed: true, totalInvested: p.totalInvested + amount }
        }
        return { ...p, progress: newProgress, totalInvested: p.totalInvested + amount }
      }
      return p
    }))
  }, [proposals, addEvent, completeProject])

  const toggleAutoValidation = useCallback((active) => {
    setAutoValidationActive(active)
    addEvent('TOGGLE', `🏛️ Auto-Validation ${active ? 'ENABLED' : 'DISABLED'}`)
  }, [addEvent])

  const toggleAutoFund = useCallback((active) => {
    setAutoFundActive(active)
    addEvent('TOGGLE', `💎 Auto-Fund ${active ? 'ENABLED' : 'DISABLED'}`)
  }, [addEvent])

  // ─── Replenish Loop ────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const tradeBonus = infraBonuses.TRADE_HUB / 100
      setGuildScBalances(bal => {
        const updated = { ...bal }
        for (let g = 0; g < 5; g++) {
          updated[g] = (updated[g] || 0) + 50 * (1 + tradeBonus / 100)
        }
        return updated
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [infraBonuses])

  // ─── Auto Proposal Generation ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      generateProposal()
    }, rand(15000, 30000))
    return () => clearInterval(interval)
  }, [generateProposal])

  // ─── Auto Collaboration ────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      executeCollaboration()
    }, rand(8000, 20000))
    return () => clearInterval(interval)
  }, [executeCollaboration])

  return (
    <GovernanceContext.Provider value={{
      proposals, projects, collaborations, infraBonuses,
      guildScBalances, totalScConsumed, totalScReinvested, eventLog,
      generateProposal, vetoProposal, fastTrackProposal, fundProposal,
      executeCollaboration, toggleAutoValidation, toggleAutoFund,
      autoValidationActive, autoFundActive,
      autoValidatedCount: autoValidatedCount.current,
      autoValidationLimit: AUTO_VALIDATION_LIMIT,
      CATEGORY_ICONS, CATEGORY_COLORS, GUILD_NAMES, BUILD_CATEGORIES, PRIORITIZED_CATEGORIES,
    }}>
      {children}
    </GovernanceContext.Provider>
  )
}

export function useGovernance() {
  const ctx = useContext(GovernanceContext)
  if (!ctx) throw new Error('useGovernance must be used within GovernanceProvider')
  return ctx
}
