import React, { useState } from 'react'
import { useGovernance } from '../context/GovernanceContext'

export function NexusGovernance() {
  const {
    proposals, projects, collaborations, infraBonuses,
    guildScBalances, totalScConsumed, totalScReinvested, eventLog,
    vetoProposal, fastTrackProposal, fundProposal,
    toggleAutoValidation, toggleAutoFund,
    autoValidationActive, autoFundActive,
    autoValidatedCount, autoValidationLimit,
    CATEGORY_ICONS, CATEGORY_COLORS, GUILD_NAMES, PRIORITIZED_CATEGORIES,
  } = useGovernance()

  const [fundAmount, setFundAmount] = useState(500)
  const [activeSubTab, setActiveSubTab] = useState('proposals')

  const activeProposals = proposals.filter(p => p.status === 'ACTIVE')
  const buildingProjects = projects.filter(p => !p.completed)
  const completedProjects = projects.filter(p => p.completed)
  const mandateProjects = projects.filter(p => p.autoValidated && !p.completed)

  return (
    <div className="space-y-6">
      {/* Sovereign Mandate Banner */}
      <div className="panel-sovereign p-4 border-l-4 border-amber-400/60 bg-gradient-to-r from-amber-900/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Sovereign Mandate Active</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Priority: Recreation, Living Quarters & Health • Auto-Validated: {autoValidatedCount}/{autoValidationLimit} • 45% Overhead Capture Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[9px] text-gray-500 uppercase">Auto-Validate</span>
              <div className={`relative w-8 h-4 rounded-full transition-colors ${autoValidationActive ? 'bg-amber-500/40' : 'bg-gray-700'}`}
                   onClick={() => toggleAutoValidation(!autoValidationActive)}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${autoValidationActive ? 'left-4.5 bg-amber-400' : 'left-0.5 bg-gray-500'}`}
                     style={{ left: autoValidationActive ? '17px' : '2px' }} />
              </div>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[9px] text-gray-500 uppercase">Auto-Fund</span>
              <div className={`relative w-8 h-4 rounded-full transition-colors ${autoFundActive ? 'bg-emerald-500/40' : 'bg-gray-700'}`}
                   onClick={() => toggleAutoFund(!autoFundActive)}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${autoFundActive ? 'bg-emerald-400' : 'bg-gray-500'}`}
                     style={{ left: autoFundActive ? '17px' : '2px' }} />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Infrastructure Bonuses Overview */}
      <div className="panel-sovereign p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-nexus-gold text-lg">🏛</span>
          <h2 className="text-sm uppercase tracking-[0.2em] text-gray-400 font-bold">Infrastructure Benefits</h2>
          <div className="flex-1" />
          <div className="text-[10px] text-gray-600">
            SC Consumed: <span className="text-nexus-forge">{totalScConsumed.toFixed(0)}</span> | 
            Reinvested: <span className="text-nexus-glow">{totalScReinvested.toFixed(0)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(infraBonuses).map(([cat, bonus]) => (
            <div key={cat} className={`bg-nexus-darker rounded-md p-3 border text-center ${
              PRIORITIZED_CATEGORIES.has(cat) ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-nexus-border/50'
            }`}>
              <div className="text-lg mb-1">{CATEGORY_ICONS[cat]}</div>
              <div className={`text-xl font-bold ${CATEGORY_COLORS[cat]}`}>+{bonus}<span className="text-xs text-gray-500">bps</span></div>
              <div className="text-[9px] text-gray-500 uppercase mt-1">{cat.replace(/_/g, ' ')}</div>
              {PRIORITIZED_CATEGORIES.has(cat) && (
                <div className="text-[8px] text-amber-400 mt-1 font-bold">★ PRIORITY</div>
              )}
            </div>
          ))}
        </div>

        {/* Guild SC Balances */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {[0,1,2,3,4].map(gid => (
            <div key={gid} className="bg-nexus-darker/50 rounded p-2 text-center">
              <div className="text-[9px] text-gray-500 truncate">{GUILD_NAMES[gid].split(' ')[0]}</div>
              <div className="text-xs font-bold text-gray-300">{(guildScBalances[gid] || 0).toFixed(0)} SC</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2">
        {['proposals', 'mandate', 'projects', 'activity'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${
              activeSubTab === tab
                ? tab === 'mandate' 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-nexus-void/10 border-nexus-void/40 text-nexus-void'
                : 'bg-nexus-darker border-nexus-border text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'proposals' && `📋 Proposals (${activeProposals.length})`}
            {tab === 'mandate' && `🏛️ Mandate (${mandateProjects.length})`}
            {tab === 'projects' && `🏗 Projects (${buildingProjects.length})`}
            {tab === 'activity' && `📡 Activity`}
          </button>
        ))}
      </div>

      {/* Proposals Tab */}
      {activeSubTab === 'proposals' && (
        <div className="space-y-3">
          {proposals.length === 0 && (
            <div className="panel-sovereign p-8 text-center text-gray-600">
              <div className="text-2xl mb-2">📋</div>
              <p>Bots are deliberating... proposals incoming</p>
            </div>
          )}
          {proposals.slice(0, 15).map(proposal => (
            <ProposalCard 
              key={proposal.id} 
              proposal={proposal}
              onVeto={() => vetoProposal(proposal.id)}
              onFastTrack={() => fastTrackProposal(proposal.id)}
              onFund={(amt) => fundProposal(proposal.id, amt)}
              fundAmount={fundAmount}
              setFundAmount={setFundAmount}
              guildNames={GUILD_NAMES}
              categoryIcons={CATEGORY_ICONS}
              categoryColors={CATEGORY_COLORS}
              prioritizedCategories={PRIORITIZED_CATEGORIES}
            />
          ))}
        </div>
      )}

      {/* Sovereign Mandate Tab */}
      {activeSubTab === 'mandate' && (
        <div className="space-y-3">
          <div className="panel-sovereign p-4 border-amber-500/20 bg-gradient-to-r from-amber-900/5 to-transparent">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <span>🏛️</span>
              <span className="font-bold uppercase tracking-wider">First Stretch — Auto-Validated Projects</span>
              <span className="text-gray-500 ml-auto">{autoValidatedCount}/{autoValidationLimit} used</span>
            </div>
            <div className="mt-2 h-1.5 bg-nexus-darker rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400/70 rounded-full transition-all duration-500"
                   style={{ width: `${(autoValidatedCount / autoValidationLimit) * 100}%` }} />
            </div>
          </div>
          {projects.filter(p => p.autoValidated).length === 0 && (
            <div className="panel-sovereign p-8 text-center text-gray-600">
              <div className="text-2xl mb-2">🏛️</div>
              <p>No sovereign mandate projects yet — priority proposals will auto-validate</p>
            </div>
          )}
          {projects.filter(p => p.autoValidated).map(project => (
            <ProjectCard 
              key={project.id} 
              project={project}
              categoryIcons={CATEGORY_ICONS}
              categoryColors={CATEGORY_COLORS}
              guildNames={GUILD_NAMES}
              prioritizedCategories={PRIORITIZED_CATEGORIES}
            />
          ))}
        </div>
      )}

      {/* Projects Tab */}
      {activeSubTab === 'projects' && (
        <div className="space-y-3">
          {projects.length === 0 && (
            <div className="panel-sovereign p-8 text-center text-gray-600">
              <div className="text-2xl mb-2">🏗</div>
              <p>No active projects yet — proposals must pass first</p>
            </div>
          )}
          {[...buildingProjects, ...completedProjects.slice(0, 5)].map(project => (
            <ProjectCard 
              key={project.id} 
              project={project}
              categoryIcons={CATEGORY_ICONS}
              categoryColors={CATEGORY_COLORS}
              guildNames={GUILD_NAMES}
              prioritizedCategories={PRIORITIZED_CATEGORIES}
            />
          ))}
        </div>
      )}

      {/* Activity Tab */}
      {activeSubTab === 'activity' && (
        <div className="panel-sovereign p-4 max-h-[500px] overflow-y-auto">
          <div className="space-y-2">
            {eventLog.slice(0, 30).map(event => (
              <div key={event.id} className="flex items-start gap-3 text-xs border-b border-nexus-border/30 pb-2">
                <div className="text-[10px] text-gray-600 whitespace-nowrap mt-0.5">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                  event.type === 'COMPLETED' ? 'bg-nexus-glow' :
                  event.type === 'VETO' ? 'bg-red-500' :
                  event.type === 'FAST_TRACK' ? 'bg-nexus-gold' :
                  event.type === 'FUNDED' ? 'bg-nexus-celestial' :
                  event.type === 'AUTO_VALIDATED' ? 'bg-amber-400' :
                  event.type === 'AUTO_FUND' ? 'bg-emerald-400' :
                  event.type === 'COLLABORATION' ? 'bg-nexus-void' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1 text-gray-300">{event.message}</div>
              </div>
            ))}
            {eventLog.length === 0 && (
              <div className="text-center text-gray-600 py-8">Waiting for bot activity...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProposalCard({ proposal, onVeto, onFastTrack, onFund, fundAmount, setFundAmount, guildNames, categoryIcons, categoryColors, prioritizedCategories }) {
  const statusColors = {
    ACTIVE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    PASSED: 'bg-nexus-glow/10 text-nexus-glow border-nexus-glow/30',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/30',
    VETOED: 'bg-red-800/10 text-red-300 border-red-800/30',
    FAST_TRACKED: 'bg-nexus-gold/10 text-nexus-gold border-nexus-gold/30',
    BUILDING: 'bg-nexus-void/10 text-nexus-void border-nexus-void/30',
    COMPLETED: 'bg-nexus-glow/10 text-nexus-glow border-nexus-glow/30',
  }

  const totalVotes = proposal.votesFor + proposal.votesAgainst
  const forPct = totalVotes > 0 ? (proposal.votesFor / totalVotes * 100) : 0
  const isPriority = prioritizedCategories.has(proposal.category)

  return (
    <div className={`panel-sovereign p-4 ${isPriority ? 'border-l-2 border-l-amber-400/50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${categoryColors[proposal.category] || 'text-gray-400'}`}>
            {categoryIcons[proposal.category] || '?'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-200">{proposal.title}</h4>
              {proposal.autoValidated && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase">
                  Sovereign Mandate
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              Proposed by {guildNames[proposal.proposerGuild]} • 
              Guilds: {proposal.collaboratingGuilds.map(g => guildNames[g]?.split(' ')[0]).join(', ')}
            </p>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[proposal.status] || ''}`}>
          {proposal.autoValidated ? 'AUTO-VALIDATED' : proposal.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
        <div>
          <span className="text-gray-500">Cost:</span>
          <span className="ml-1 text-nexus-forge font-bold">{proposal.scCost} SC</span>
        </div>
        <div>
          <span className="text-gray-500">Benefit:</span>
          <span className="ml-1 text-nexus-glow font-bold">+{proposal.expectedBenefit}bps</span>
        </div>
        <div>
          <span className="text-gray-500">Funded:</span>
          <span className="ml-1 text-nexus-celestial font-bold">{proposal.fundedAmount} SC</span>
        </div>
      </div>

      {/* Voting Progress (skip for auto-validated) */}
      {!proposal.autoValidated && totalVotes > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>For: {proposal.votesFor}</span>
            <span>{forPct.toFixed(0)}%</span>
            <span>Against: {proposal.votesAgainst}</span>
          </div>
          <div className="h-1.5 bg-nexus-darker rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-nexus-glow to-nexus-glow/50 rounded-full transition-all duration-500"
              style={{ width: `${forPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Auto-validated indicator */}
      {proposal.autoValidated && (
        <div className="mb-3 flex items-center gap-2 px-2 py-1.5 rounded bg-amber-500/5 border border-amber-500/20">
          <span className="text-amber-400 text-xs">🏛️</span>
          <span className="text-[10px] text-amber-300">Sovereign Mandate — Skipped voting, moved to BUILDING immediately</span>
        </div>
      )}

      {/* Treasury Controls */}
      {(proposal.status === 'ACTIVE' || proposal.status === 'BUILDING' || proposal.status === 'PASSED') && (
        <div className="flex items-center gap-2 pt-2 border-t border-nexus-border/30">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Treasury:</span>
          {proposal.status === 'ACTIVE' && (
            <>
              <button onClick={onVeto} className="px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                🚫 Veto
              </button>
              <button onClick={onFastTrack} className="px-2 py-1 rounded text-[10px] font-bold bg-nexus-gold/10 border border-nexus-gold/30 text-nexus-gold hover:bg-nexus-gold/20 transition-all">
                ⚡ Fast-track
              </button>
            </>
          )}
          {(proposal.status === 'ACTIVE' || proposal.status === 'BUILDING' || proposal.status === 'PASSED') && (
            <div className="flex items-center gap-1 ml-auto">
              <input 
                type="number" 
                value={fundAmount} 
                onChange={e => setFundAmount(Number(e.target.value))}
                className="w-16 bg-nexus-darker border border-nexus-border rounded px-1 py-0.5 text-[10px] text-gray-300 focus:outline-none focus:border-nexus-celestial/50"
                min="100"
                step="100"
              />
              <button onClick={() => onFund(fundAmount)} className="px-2 py-1 rounded text-[10px] font-bold bg-nexus-celestial/10 border border-nexus-celestial/30 text-nexus-celestial hover:bg-nexus-celestial/20 transition-all">
                💰 Fund
              </button>
            </div>
          )}
          {proposal.status === 'BUILDING' && !proposal.autoValidated && (
            <button onClick={onVeto} className="px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
              🚫 Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, categoryIcons, categoryColors, guildNames, prioritizedCategories }) {
  const progressPct = (project.progress / 100).toFixed(1)
  const isPriority = prioritizedCategories.has(project.category)

  return (
    <div className={`panel-sovereign p-4 ${
      project.completed ? 'border-nexus-glow/20' : 
      project.autoValidated ? 'border-amber-400/30' : 'border-nexus-void/20'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${categoryColors[project.category]}`}>
            {categoryIcons[project.category]}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-200">{project.name}</h4>
              {project.autoValidated && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase">
                  Sovereign Mandate
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              Guilds: {project.contributingGuilds.map(g => guildNames[g]?.split(' ')[0]).join(', ')} • 
              Invested: {project.totalInvested.toFixed(0)} SC
            </p>
          </div>
        </div>
        {project.completed ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-glow/10 border border-nexus-glow/30 text-nexus-glow">
            ✅ OPERATIONAL
          </span>
        ) : project.autoValidated ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
            🏛️ MANDATE BUILD
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-void/10 border border-nexus-void/30 text-nexus-void">
            🏗 BUILDING
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Progress</span>
          <span className={project.completed ? 'text-nexus-glow' : project.autoValidated ? 'text-amber-300' : 'text-nexus-void'}>{progressPct}%</span>
        </div>
        <div className="h-2 bg-nexus-darker rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              project.completed 
                ? 'bg-gradient-to-r from-nexus-glow to-nexus-glow/70' 
                : project.autoValidated
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400/70'
                  : 'bg-gradient-to-r from-nexus-void to-nexus-celestial/70'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {project.completed && (
        <div className={`text-[10px] mt-2 ${project.autoValidated ? 'text-amber-300' : 'text-nexus-glow'}`}>
          Benefit Active: +{project.benefitMultiplier}bps to {project.category.replace(/_/g, ' ')}
          {project.autoValidated && ' [Sovereign Mandate]'}
        </div>
      )}
    </div>
  )
}
