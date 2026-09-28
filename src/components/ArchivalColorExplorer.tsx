/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PantoneSpecimen } from '../types';
import { PANTONE_DATABASE } from '../data/pantoneDatabase';
import { rgbToHsl, calculateDeltaE2000 } from '../utils/colorScience';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Copy,
  Layers
} from 'lucide-react';

interface ArchivalColorExplorerProps {
  activeSpecimen: PantoneSpecimen;
  currentColorHex: string;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
  onAddToPalette: (specimen: PantoneSpecimen) => void;
}

type CollectionFilter = 'all' | 'fhi_tcx' | 'formula_coated' | 'formula_uncoated';
type HueFamily = 'all' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'neutral';

export const ArchivalColorExplorer: React.FC<ArchivalColorExplorerProps> = ({
  activeSpecimen,
  currentColorHex,
  onSelectSpecimen,
  onAddToPalette,
}) => {
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
  const [hueFilter, setHueFilter] = useState<HueFamily>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const itemsPerPage = 36;

  // Determine hue family for a specimen
  const getSpecimenHueFamily = (specimen: PantoneSpecimen): HueFamily => {
    const hsl = rgbToHsl(specimen.rgb);
    if (hsl.s < 14 || hsl.l > 90 || hsl.l < 12) {
      return 'neutral';
    }
    const h = hsl.h;
    if (h >= 15 && h < 45) return 'orange';
    if (h >= 45 && h < 68) return 'yellow';
    if (h >= 68 && h < 165) return 'green';
    if (h >= 165 && h < 195) return 'teal';
    if (h >= 195 && h < 265) return 'blue';
    if (h >= 265 && h < 330) return 'purple';
    return 'red';
  };

  // Filtered specimens
  const filteredSpecimens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return PANTONE_DATABASE.filter(specimen => {
      // Collection filter
      if (collectionFilter !== 'all') {
        if (specimen.category !== collectionFilter) return false;
      }

      // Hue family filter
      if (hueFilter !== 'all') {
        const family = getSpecimenHueFamily(specimen);
        if (family !== hueFilter) return false;
      }

      // Search query in code or name
      if (query) {
        const codeMatch = specimen.code.toLowerCase().includes(query);
        const nameMatch = specimen.name.toLowerCase().includes(query);
        const hexMatch = specimen.hex.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !hexMatch) return false;
      }

      return true;
    });
  }, [collectionFilter, hueFilter, searchQuery]);

  // Sort specimens by visual similarity to currently active color
  const sortedSpecimens = useMemo(() => {
    const list = [...filteredSpecimens];
    return list.sort((a, b) => {
      const deltaA = calculateDeltaE2000(activeSpecimen.lab, a.lab);
      const deltaB = calculateDeltaE2000(activeSpecimen.lab, b.lab);
      return deltaA - deltaB;
    });
  }, [filteredSpecimens, activeSpecimen.lab]);

  // Reset to page 1 on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [collectionFilter, hueFilter, searchQuery]);

  const totalItems = sortedSpecimens.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSpecimens = sortedSpecimens.slice(startIndex, startIndex + itemsPerPage);

  const handleCopy = (e: React.MouseEvent, code: string, hex: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${code} (${hex})`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)]" id="archival-explorer">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              Color Library ({totalItems.toLocaleString()} Standards)
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Browse authentic FHI Cotton (TCX) and Formula Guide systems
            </p>
          </div>

          {/* Quick Collection Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Collections' },
              { id: 'fhi_tcx', label: 'FHI Cotton TCX (2.6k+)' },
              { id: 'formula_coated', label: 'Formula Coated (C)' },
              { id: 'formula_uncoated', label: 'Formula Uncoated (U)' },
            ].map(col => (
              <button
                key={col.id}
                onClick={() => setCollectionFilter(col.id as CollectionFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-specimen-mono cursor-pointer transition-all ${
                  collectionFilter === col.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-page)] font-bold shadow-xs'
                    : 'bg-[var(--bg-tile)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-grid)]'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Hue Family Filter Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs mb-8 flex flex-col md:flex-row items-center gap-4 justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80 flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, or hex..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-grid)] text-xs font-specimen-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 rounded-full hover:bg-[var(--bg-tile)] text-[var(--text-muted)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Hue Family Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <span className="text-xs font-specimen-mono text-[var(--text-faint)] mr-1">Hue:</span>
            {[
              { id: 'all', label: 'All', color: 'transparent' },
              { id: 'red', label: 'Red', color: '#E53E3E' },
              { id: 'orange', label: 'Orange', color: '#ED8936' },
              { id: 'yellow', label: 'Yellow', color: '#ECC94B' },
              { id: 'green', label: 'Green', color: '#48BB78' },
              { id: 'teal', label: 'Teal', color: '#38B2AC' },
              { id: 'blue', label: 'Blue', color: '#4299E1' },
              { id: 'purple', label: 'Purple', color: '#9F7AEA' },
              { id: 'neutral', label: 'Neutral', color: '#A0AEC0' },
            ].map(hue => (
              <button
                key={hue.id}
                onClick={() => setHueFilter(hue.id as HueFamily)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-specimen-mono cursor-pointer transition-all border ${
                  hueFilter === hue.id
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-page)] font-bold'
                    : 'border-[var(--border-grid)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {hue.color !== 'transparent' && (
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: hue.color }}
                  />
                )}
                <span>{hue.label}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Color Swatch Grid */}
        {paginatedSpecimens.length === 0 ? (
          <div className="py-16 text-center text-sm font-specimen-mono text-[var(--text-muted)] bg-[var(--bg-tile)] rounded-2xl border border-[var(--border-grid)]">
            No Pantone specimens match "{searchQuery}". Try a different keyword or filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {paginatedSpecimens.map((specimen) => {
              const isSelected = activeSpecimen.code === specimen.code;
              return (
                <div
                  key={specimen.code}
                  onClick={() => onSelectSpecimen(specimen)}
                  className={`group flex flex-col rounded-xl overflow-hidden bg-[var(--bg-tile)] border cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-[var(--text-primary)] border-transparent shadow-sm'
                      : 'border-[var(--border-grid)]'
                  }`}
                >
                  {/* Swatch Color Area */}
                  <div
                    className="w-full aspect-5/4 relative flex items-end justify-between p-2"
                    style={{ backgroundColor: specimen.hex }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-specimen-mono uppercase px-1.5 py-0.5 rounded bg-black/75 text-white backdrop-blur-xs">
                      Select
                    </span>
                  </div>

                  {/* Card Label */}
                  <div className="p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold font-specimen-mono text-[var(--text-primary)] truncate">
                        {specimen.code}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5" title={specimen.name}>
                        {specimen.name}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-[var(--border-grid)] flex items-center justify-between text-[10px] font-specimen-mono text-[var(--text-faint)]">
                      <span>{specimen.hex}</span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleCopy(e, specimen.code, specimen.hex)}
                          className="p-1 rounded hover:bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          title="Copy code and hex"
                        >
                          {copiedCode === specimen.code ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToPalette(specimen);
                          }}
                          className="p-1 rounded hover:bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          title="Add to study"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clean Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between font-specimen-mono text-xs text-[var(--text-muted)]">
            <div>
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems.toLocaleString()} standards
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-[var(--border-grid)] bg-[var(--bg-tile)] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-[var(--text-primary)]">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-[var(--border-grid)] bg-[var(--bg-tile)] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
