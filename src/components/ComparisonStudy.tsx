/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PantoneSpecimen, ColorMatchResult } from '../types';
import { hexToRgb, rgbToLab, calculateDeltaE2000 } from '../utils/colorScience';
import { Split, Sparkles, Copy, Check } from 'lucide-react';

interface ComparisonStudyProps {
  userHex: string;
  activeSpecimen: PantoneSpecimen;
  closestMatch: ColorMatchResult;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
}

export const ComparisonStudy: React.FC<ComparisonStudyProps> = ({
  userHex,
  activeSpecimen,
}) => {
  const [substrateMode, setSubstrateMode] = useState<'coated' | 'uncoated'>('coated');
  const [splitRatio, setSplitRatio] = useState<number>(50); // 0-100 percentage split
  const [isDragging, setIsDragging] = useState(false);
  const [copiedPantone, setCopiedPantone] = useState(false);

  const handleCopyPantone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(activeSpecimen.code);
    setCopiedPantone(true);
    setTimeout(() => setCopiedPantone(false), 1800);
  };

  const userRgb = hexToRgb(userHex);
  const userLab = rgbToLab(userRgb);
  const specLab = activeSpecimen.lab;
  const currentDeltaE = calculateDeltaE2000(userLab, specLab);

  const updateSplit = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const pct = Math.max(12, Math.min(88, (x / rect.width) * 100));
    setSplitRatio(pct);
  };

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)] relative overflow-hidden" id="comparison-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-3 bg-[var(--text-primary)] inline-block"></span>
              <span className="text-[11px] font-specimen-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                Optical Verification // 03
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              Color Study & Comparison
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Side-by-side comparison of target color and <span className="font-bold text-[var(--text-primary)]">{activeSpecimen.code}</span>
              </p>
              <button
                onClick={handleCopyPantone}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-specimen-mono font-bold bg-[var(--bg-tile)] hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-page)] border border-[var(--border-grid)] shadow-2xs transition-all cursor-pointer"
                title={`Copy ${activeSpecimen.code} directly`}
              >
                {copiedPantone ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Copied {activeSpecimen.code}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy {activeSpecimen.code}</span>
                  </>
                )}
              </button>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-specimen-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                ΔE {currentDeltaE.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Substrate Segmented Controls with sliding indicator */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs">
            {(['coated', 'uncoated'] as const).map((mode) => {
              const isActive = substrateMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setSubstrateMode(mode)}
                  className={`relative px-3.5 py-1.5 rounded-none text-xs font-specimen-mono cursor-pointer transition-colors duration-150 ${
                    isActive
                      ? 'text-[var(--bg-page)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="substrateIndicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute inset-0 bg-[var(--text-primary)] shadow-xs z-0"
                    />
                  )}
                  <span className="relative z-10">
                    {mode === 'coated' ? 'Coated (Gloss)' : 'Uncoated (Matte)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side-by-side Split Plane with interactive blade */}
        <div 
          className={`relative w-full h-[360px] sm:h-[440px] rounded-none overflow-hidden select-none border border-[var(--border-grid)] shadow-md ${
            isDragging ? 'cursor-ew-resize' : 'cursor-default'
          }`}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (e.buttons === 1 || isDragging) {
              const rect = e.currentTarget.getBoundingClientRect();
              updateSplit(e.clientX, rect);
            }
          }}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            updateSplit(touch.clientX, rect);
          }}
        >
          {/* Left Side: Target Color */}
          <motion.div
            animate={{
              backgroundColor: userHex,
            }}
            transition={{ duration: 0.25 }}
            className="absolute inset-y-0 left-0 flex flex-col justify-between p-6 sm:p-8"
            style={{
              width: `${splitRatio}%`,
              filter: substrateMode === 'uncoated' ? 'contrast(0.92) brightness(0.98)' : undefined,
            }}
          >
            <div className="text-white drop-shadow-md">
              <span className="text-[10px] font-specimen-mono uppercase tracking-wider px-2 py-0.5 rounded-none bg-black/45 backdrop-blur-xs font-semibold">
                Target Input
              </span>
              <div className="text-2xl sm:text-3xl font-light font-specimen-mono mt-2">
                {userHex.toUpperCase()}
              </div>
            </div>

            <div className="text-white/90 text-xs font-specimen-mono drop-shadow-md">
              sRGB: {userRgb.r}, {userRgb.g}, {userRgb.b}
            </div>
          </motion.div>

          {/* Right Side: Pantone Match */}
          <motion.div
            animate={{
              backgroundColor: activeSpecimen.hex,
            }}
            transition={{ duration: 0.25 }}
            className="absolute inset-y-0 right-0 flex flex-col justify-between p-6 sm:p-8 text-right"
            style={{
              width: `${100 - splitRatio}%`,
              filter: substrateMode === 'uncoated' ? 'contrast(0.92) brightness(0.98)' : undefined,
            }}
          >
            <div className="text-white drop-shadow-md">
              <span className="text-[10px] font-specimen-mono uppercase tracking-wider px-2 py-0.5 rounded-none bg-black/45 backdrop-blur-xs font-semibold">
                Archival Standard
              </span>
              <div className="flex items-center justify-end gap-2 mt-2 flex-wrap">
                <div className="text-2xl sm:text-3xl font-light font-specimen-mono">
                  {activeSpecimen.code}
                </div>
                <button
                  onClick={handleCopyPantone}
                  className="px-2.5 py-1 text-[11px] font-specimen-mono uppercase tracking-wider bg-black/60 hover:bg-black/85 text-white backdrop-blur-md rounded-none border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-bold"
                  title={`Copy ${activeSpecimen.code} directly`}
                >
                  {copiedPantone ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 opacity-80" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-white/90 text-xs font-specimen-mono drop-shadow-md">
              {activeSpecimen.name !== activeSpecimen.code ? activeSpecimen.name : (activeSpecimen.collectionRef || 'Formula Guide Coated')}
            </div>
          </motion.div>

          {/* Center Dividing Blade with breathing aura line */}
          <div
            className="absolute inset-y-0 w-[2px] bg-white cursor-ew-resize shadow-2xl flex items-center justify-center z-30 transition-shadow"
            style={{ left: `calc(${splitRatio}% - 1px)` }}
          >
            <motion.div 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-none bg-black/85 text-white flex items-center justify-center shadow-xl border border-white/60 cursor-ew-resize"
            >
              <Split className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
};
