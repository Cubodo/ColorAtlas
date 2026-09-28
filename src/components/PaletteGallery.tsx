/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PaletteStudy, PantoneSpecimen } from '../types';
import { Plus, Trash2, Copy, Check, Bookmark } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface PaletteGalleryProps {
  studies: PaletteStudy[];
  activeSpecimen: PantoneSpecimen;
  currentColorHex: string;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
  onAddStudy: (newStudy: PaletteStudy) => void;
  onDeleteStudy: (id: string) => void;
  onAddSpecimenToStudy: (studyId: string, specimen: PantoneSpecimen) => void;
}

export const PaletteGallery: React.FC<PaletteGalleryProps> = ({
  studies,
  activeSpecimen,
  currentColorHex,
  onSelectSpecimen,
  onAddStudy,
  onDeleteStudy,
  onAddSpecimenToStudy,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCopySingleCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleCopyStudy = (study: PaletteStudy) => {
    const text = `${study.title}\n${study.specimens.map(s => `${s.code}: ${s.hex}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(study.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCreateNewStudy = () => {
    if (!customTitle.trim()) return;
    const newStudy: PaletteStudy = {
      id: `study-${Date.now()}`,
      title: customTitle.trim(),
      subtitle: `Curated Color Harmony • ${new Date().toISOString().slice(0, 10)}`,
      ratio: [40, 30, 20, 10],
      dateCreated: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      curatorNotes: `Featuring ${activeSpecimen.code} (${activeSpecimen.name})`,
      specimens: [activeSpecimen],
    };
    onAddStudy(newStudy);
    setCustomTitle('');
    setIsCreating(false);
  };

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)] relative overflow-hidden" id="palette-studies">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-3 bg-[var(--text-primary)] inline-block"></span>
              <span className="text-[11px] font-specimen-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                Harmonic Relationships // 04
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              Curated Palette Studies
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Harmonic arrangements & proportional studies generated with selected color{' '}
              <span className="font-specimen-mono font-bold text-[var(--text-primary)]">{currentColorHex.toUpperCase()}</span>
              {activeSpecimen ? ` (${activeSpecimen.code})` : ''}
            </p>
          </div>

          <MagneticButton
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-none bg-[var(--text-primary)] text-[var(--bg-page)] hover:opacity-95 text-xs font-specimen-mono cursor-pointer self-start sm:self-auto font-medium shadow-xs"
            magneticStrength={0.25}
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>New Palette</span>
            </span>
          </MagneticButton>
        </div>

        {/* Creation Input with AnimatePresence */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 sm:p-5 mb-8 rounded-none bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs flex flex-col sm:flex-row items-center gap-3 overflow-hidden"
            >
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Name your palette study..."
                className="w-full px-4 py-2 rounded-none bg-[var(--bg-page)] border border-[var(--border-grid)] text-xs font-specimen-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)]"
                autoFocus
              />
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={handleCreateNewStudy}
                  disabled={!customTitle.trim()}
                  className="px-4 py-2 rounded-none bg-[var(--text-primary)] text-[var(--bg-page)] text-xs font-specimen-mono cursor-pointer disabled:opacity-40 transition-opacity font-bold"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 rounded-none text-xs font-specimen-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid of Palette Studies */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studies.map((study, idx) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: Math.min(idx * 0.05, 0.2),
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{
                y: -4,
                transition: { duration: 0.2, ease: 'easeOut' },
              }}
              className="rounded-none bg-[var(--bg-tile)] border border-[var(--border-grid)] p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg hover:border-[var(--text-primary)] transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-specimen-mono text-[var(--text-faint)]">
                  <span>{study.dateCreated}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const codes = study.specimens.map(s => s.code).join(', ');
                        navigator.clipboard.writeText(codes);
                        setCopiedId(`codes-${study.id}`);
                        setTimeout(() => setCopiedId(null), 1800);
                      }}
                      className="flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                      title="Copy all Pantone codes in this study directly"
                    >
                      {copiedId === `codes-${study.id}` ? <Check className="w-3 h-3 text-emerald-500 font-bold" /> : <Copy className="w-3 h-3" />}
                      <span className={copiedId === `codes-${study.id}` ? 'text-emerald-500 font-bold' : ''}>
                        {copiedId === `codes-${study.id}` ? 'Codes Copied' : 'Copy Codes'}
                      </span>
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => handleCopyStudy(study)}
                      className="flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                      title="Copy full study details"
                    >
                      {copiedId === study.id ? (
                        <Check className="w-3 h-3 text-emerald-500 font-bold" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span className={copiedId === study.id ? 'text-emerald-500 font-bold' : ''}>
                        {copiedId === study.id ? 'Copied' : 'Details'}
                      </span>
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)] mt-2 tracking-tight">
                  {study.title}
                </h3>
                {study.curatorNotes && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                    {study.curatorNotes}
                  </p>
                )}

                {/* Proportional Swatch Strip with smooth expansion on hover */}
                <div className="mt-4 h-24 rounded-none overflow-hidden flex border border-black/10 dark:border-white/10 shadow-xs">
                  {study.specimens.map((specimen, sIdx) => {
                    const ratio = study.ratio[sIdx] || (100 / study.specimens.length);
                    const isSelected = specimen.hex.toUpperCase() === currentColorHex.toUpperCase();
                    return (
                      <div
                        key={`${specimen.code}-${sIdx}`}
                        onClick={() => onSelectSpecimen(specimen)}
                        className="h-full relative group cursor-pointer transition-all duration-200 hover:brightness-105"
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: specimen.hex,
                        }}
                        title={`${specimen.code} (${specimen.hex})${isSelected ? ' — Selected Color' : ''} — Click to inspect`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 left-1.5 px-1 py-0.5 bg-black/60 text-white text-[9px] font-specimen-mono uppercase font-bold tracking-wider pointer-events-none">
                            Target
                          </div>
                        )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white pointer-events-none transition-opacity" />
                      </div>
                    );
                  })}
                </div>

                {/* Swatch chips list with direct copy button */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {study.specimens.map((specimen) => {
                    const isSelected = specimen.hex.toUpperCase() === currentColorHex.toUpperCase();
                    return (
                      <div
                        key={`${specimen.code}-${specimen.hex}`}
                        className={`inline-flex items-center rounded-none bg-[var(--bg-page)] border text-[11px] font-specimen-mono transition-colors shadow-2xs ${
                          isSelected
                            ? 'border-[var(--text-primary)] font-bold text-[var(--text-primary)] shadow-xs'
                            : 'border-[var(--border-grid)] hover:border-[var(--text-primary)] text-[var(--text-primary)]'
                        }`}
                      >
                        <button
                          onClick={() => onSelectSpecimen(specimen)}
                          className="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-[var(--bg-tile)] transition-colors"
                          title={`Inspect ${specimen.code}`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-none shrink-0"
                            style={{ backgroundColor: specimen.hex }}
                          />
                          <span className="truncate max-w-[95px]">{specimen.code}</span>
                          {isSelected && (
                            <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-widest ml-0.5">
                              ★
                            </span>
                          )}
                        </button>
                        <button
                          onClick={(e) => handleCopySingleCode(e, specimen.code)}
                          className="p-1 border-l border-[var(--border-grid)] hover:bg-[var(--text-primary)] text-[var(--text-muted)] hover:text-[var(--bg-page)] transition-colors cursor-pointer"
                          title={`Copy "${specimen.code}" directly`}
                          aria-label={`Copy Pantone code ${specimen.code}`}
                        >
                          {copiedCode === specimen.code ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-3 border-t border-[var(--border-grid)] flex items-center justify-between text-xs font-specimen-mono">
                <button
                  onClick={() => onAddSpecimenToStudy(study.id, activeSpecimen)}
                  className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Active ({activeSpecimen.code})</span>
                </button>

                {studies.length > 3 && (
                  <button
                    onClick={() => onDeleteStudy(study.id)}
                    className="p-1 text-[var(--text-faint)] hover:text-red-500 cursor-pointer transition-colors"
                    title="Delete study"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
