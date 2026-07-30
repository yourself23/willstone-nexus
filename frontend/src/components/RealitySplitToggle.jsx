import React, { useState } from 'react'

export function RealitySplitToggle({ mode, onToggle }) {
  const [transitioning, setTransitioning] = useState(false)

  const handleToggle = () => {
    setTransitioning(true)
    setTimeout(() => {
      onToggle(mode === 'L1' ? 'L2' : 'L1')
      setTimeout(() => setTransitioning(false), 300)
    }, 200)
  }

  return (
    <div className="panel-sovereign p-4">
      <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3 flex items-center gap-2">
        <span className="text-nexus-void">◐</span> Reality Split
      </h3>

      <div className={`relative transition-all duration-500 ${transitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          className="w-full relative h-14 rounded-lg border border-nexus-border overflow-hidden group"
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 transition-all duration-500 ${
            mode === 'L1' 
              ? 'bg-gradient-to-r from-nexus-celestial/20 to-transparent' 
              : 'bg-gradient-to-r from-transparent to-nexus-void/20'
          }`} />

          {/* Slider */}
          <div className={`absolute top-1 bottom-1 w-1/2 rounded-md transition-all duration-500 ${
            mode === 'L1' 
              ? 'left-1 bg-nexus-celestial/20 border border-nexus-celestial/40' 
              : 'left-[calc(50%-4px)] bg-nexus-void/20 border border-nexus-void/40'
          }`} />

          {/* Labels */}
          <div className="relative z-10 flex items-center h-full">
            <div className={`flex-1 text-center transition-all duration-300 ${
              mode === 'L1' ? 'text-nexus-celestial font-bold' : 'text-gray-600'
            }`}>
              <div className="text-xs uppercase tracking-wider">L1 Settlement</div>
              <div className="text-[9px]">Bedrock</div>
            </div>
            <div className="w-px h-6 bg-nexus-border" />
            <div className={`flex-1 text-center transition-all duration-300 ${
              mode === 'L2' ? 'text-nexus-void font-bold' : 'text-gray-600'
            }`}>
              <div className="text-xs uppercase tracking-wider">L2 Sovereign</div>
              <div className="text-[9px]">Trading</div>
            </div>
          </div>
        </button>

        {/* Status Indicator */}
        <div className="flex items-center justify-center mt-2 gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            mode === 'L1' ? 'bg-nexus-celestial animate-pulse' : 'bg-nexus-void animate-pulse'
          }`} />
          <span className="text-[10px] text-gray-500">
            {mode === 'L1' ? 'Settlement Layer Active' : 'Sovereign Trading Active'}
          </span>
        </div>
      </div>
    </div>
  )
}
