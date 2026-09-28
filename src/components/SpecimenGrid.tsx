/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ColorMatchResult, PantoneSpecimen } from '../types';
import { Copy, Check, Plus, Eye, Sparkles } from 'lucide-react';

interface SpecimenGridProps {
  matches: ColorMatchResult[];
  activeSpecimen: PantoneSpecimen;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
  onAddToPalette: (specimen: PantoneSpecimen) => void;
}

export const SpecimenGrid: React.FC<SpecimenGridProps> = ({
  matches,
  activeSpecimen,
  onSelectSpecimen,
  onAddToPalette,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'fhi_tcx' | 'formula_coated' | 'formula_uncoated'>('all');

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const filteredMatches = useMemo(() => {
    if (collectionFilter === 'all') return matches;
    return matches.filter(m => m.specimen.category === collectionFilter);
  }, [matches, collectionFilter]);

  // Display top 12 matches for clean, uncluttered layout
  const displayMatches = filteredMatches.slice(0, 12);

  const filterOptions = [
    { id: 'all', label: 'All Systems' },
    { id: 'fhi_tcx', label: 'FHI Cotton TCX' },
    { id: 'formula_coated', label: 'Coated (C)' },
    { id: 'formula_uncoated', label: 'Uncoated (U)' },
  ];

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)] relative overflow-hidden" id="specimens-archive">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Clean, Guided Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-3 bg-[var(--text-primary)] inline-block"></span>
              <span className="text-[11px] font-specimen-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                Calibrated Archive // 02
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              Closest Pantone Matches
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Top calibrated color standards matching the current selection
            </p>
          </div>

          {/* Clean Segmented Filter Controls with animated sliding background */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs flex-wrap">
            {filterOptions.map(f => {
              const isActive = collectionFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setCollectionFilter(f.id as any)}
                  className={`relative px-3 py-1.5 rounded-none text-xs font-specimen-mono cursor-pointer transition-colors duration-150 ${
                    isActive
                      ? 'text-[var(--bg-page)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterIndicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute inset-0 bg-[var(--text-primary)] shadow-xs z-0"
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimal Pantone Swatch Deck Grid with motion layout reordering */}
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {displayMatches.map((match, idx) => {
              const isSelected = activeSpecimen.code === match.specimen.code;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.03, 0.25),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  key={match.specimen.code}
                  onClick={() => onSelectSpecimen(match.specimen)}
                  className={`group flex flex-col rounded-none overflow-hidden bg-[var(--bg-tile)] border cursor-pointer shadow-xs transition-shadow duration-300 hover:shadow-xl ${
                    isSelected 
                      ? 'ring-2 ring-[var(--text-primary)] border-transparent shadow-md' 
                      : 'border-[var(--border-grid)] hover:border-[var(--text-primary)]'
                  }`}
                >
                  {/* Vibrant Color Block */}
                  <div 
                    className="relative w-full aspect-square overflow-hidden flex flex-col justify-between p-3"
                    style={{ backgroundColor: match.specimen.hex }}
                  >
                    {/* Match rank badge */}
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[10px] font-specimen-mono font-bold px-1.5 py-0.5 rounded-none bg-black/45 text-white backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-specimen-mono px-1.5 py-0.5 rounded-none bg-black/45 text-white backdrop-blur-xs">
                        {match.matchScore}%
                      </span>
                    </div>

                    {/* Subtle hovering shimmer highlight */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-white/30 via-transparent to-transparent transition-opacity duration-300 pointer-events-none" />

                    {/* Hover action indicator with direct copy button */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 self-center z-10 flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopy(e, match.specimen.code)}
                        className="text-[10px] font-specimen-mono font-bold uppercase tracking-wider px-2 py-1 rounded-none bg-black/90 hover:bg-black text-white backdrop-blur-xs shadow-md flex items-center gap-1 cursor-pointer transition-colors"
                        title={`Copy ${match.specimen.code} directly`}
                      >
                        {copiedCode === match.specimen.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] font-specimen-mono font-bold uppercase tracking-wider px-2 py-1 rounded-none bg-black/70 text-white backdrop-blur-xs shadow-md">
                        {isSelected ? 'Active' : 'Inspect'}
                      </span>
                    </div>
                  </div>

                  {/* Clean Specimen Details Card Bottom */}
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs sm:text-sm font-bold font-specimen-mono text-[var(--text-primary)] truncate group-hover:text-[var(--text-primary)]">
                          {match.specimen.code}
                        </div>
                        <button
                          onClick={(e) => handleCopy(e, match.specimen.code)}
                          className="px-1.5 py-0.5 rounded-none bg-[var(--bg-page)] hover:bg-[var(--text-primary)] text-[var(--text-muted)] hover:text-[var(--bg-page)] border border-[var(--border-grid)] text-[9px] font-specimen-mono font-bold transition-all cursor-pointer flex items-center gap-0.5 shrink-0"
                          title={`Copy ${match.specimen.code} directly`}
                        >
                          {copiedCode === match.specimen.code ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                          <span>{copiedCode === match.specimen.code ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate mt-1" title={match.specimen.name}>
                        {match.specimen.name !== match.specimen.code ? match.specimen.name : (match.specimen.collectionRef || 'Formula Guide Coated')}
                      </div>
                    </div>

                    {/* Footer micro-details & tactile quick copy */}
                    <div className="mt-3 pt-2 border-t border-[var(--border-grid)] flex items-center justify-between text-[11px] font-specimen-mono text-[var(--text-faint)]">
                      <span className="font-semibold">{match.specimen.hex}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToPalette(match.specimen);
                          }}
                          className="px-2 py-0.5 rounded-none bg-[var(--bg-page)] hover:bg-[var(--bg-tile)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-grid)] transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                          title="Add to palette study"
                          aria-label={`Add ${match.specimen.code} to palette`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Palette</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};
