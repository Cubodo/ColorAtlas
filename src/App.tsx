/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ThemeMode, ActiveSection, PantoneSpecimen, PaletteStudy } from './types';
import { PANTONE_DATABASE } from './data/pantoneDatabase';
import { generateCuratedPaletteStudies } from './data/curatedPalettes';
import { hexToRgb, rgbToLab, findClosestPantoneMatches } from './utils/colorScience';
import { HeaderEditorial } from './components/HeaderEditorial';
import { ColorStudioMinimal } from './components/ColorStudioMinimal';
import { SpecimenGrid } from './components/SpecimenGrid';
import { ComparisonStudy } from './components/ComparisonStudy';
import { PaletteGallery } from './components/PaletteGallery';
import { ExportPublication } from './components/ExportPublication';
import { AmbientBackground } from './components/AmbientBackground';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [showGridLines, setShowGridLines] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('archive');

  // Active color states
  // Default to #FA5B0F (Pantone 1655 C - Cadmium Tangerine)
  const [currentColorHex, setCurrentColorHex] = useState<string>('#FA5B0F');

  // User custom-created studies
  const [customStudies, setCustomStudies] = useState<PaletteStudy[]>([]);

  // Compute closest matches against the authentic Pantone database
  const closestMatches = useMemo(() => {
    const rgb = hexToRgb(currentColorHex);
    const lab = rgbToLab(rgb);
    return findClosestPantoneMatches(lab, PANTONE_DATABASE, 60);
  }, [currentColorHex]);

  // Primary match
  const primaryMatch = closestMatches[0];

  // Active inspected specimen
  const [activeSpecimen, setActiveSpecimen] = useState<PantoneSpecimen>(primaryMatch.specimen);

  // Keep activeSpecimen aligned when user hex changes
  useEffect(() => {
    if (primaryMatch) {
      setActiveSpecimen(primaryMatch.specimen);
    }
  }, [currentColorHex]);

  // Curated palette studies dynamically synthesized directly from the selected hex code
  const curatedStudies = useMemo(() => {
    return generateCuratedPaletteStudies(currentColorHex, activeSpecimen, PANTONE_DATABASE);
  }, [currentColorHex, activeSpecimen]);

  // Combined palette studies: any user-created custom palettes first, followed by dynamic curated harmonies
  const allPaletteStudies = useMemo(() => {
    return [...customStudies, ...curatedStudies];
  }, [customStudies, curatedStudies]);

  // Update HTML root dark class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handlers
  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleGridLines = () => {
    setShowGridLines(prev => !prev);
  };

  const handleColorChange = (newHex: string) => {
    setCurrentColorHex(newHex);
  };

  const handleSelectSpecimen = (specimen: PantoneSpecimen) => {
    setActiveSpecimen(specimen);
    setCurrentColorHex(specimen.hex);
  };

  const handleAddToPalette = (specimen: PantoneSpecimen) => {
    setCustomStudies(prev => {
      if (prev.length > 0) {
        const first = { ...prev[0] };
        if (!first.specimens.some(s => s.code === specimen.code)) {
          first.specimens = [...first.specimens, specimen];
          first.ratio = [...first.ratio, 15];
          return [first, ...prev.slice(1)];
        }
        return prev;
      } else {
        const newStudy: PaletteStudy = {
          id: `custom-${Date.now()}`,
          title: `Custom Study — ${activeSpecimen.code}`,
          subtitle: `Created from Selected Palette • ${new Date().toISOString().slice(0, 10)}`,
          ratio: [50, 50],
          dateCreated: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
          curatorNotes: `Featuring selected standard ${activeSpecimen.code} (${currentColorHex}) paired with ${specimen.code}`,
          specimens: [activeSpecimen, specimen],
        };
        return [newStudy];
      }
    });
    handleSelectSection('palettes');
  };

  const handleAddStudy = (newStudy: PaletteStudy) => {
    setCustomStudies(prev => [newStudy, ...prev]);
  };

  const handleDeleteStudy = (id: string) => {
    setCustomStudies(prev => prev.filter(s => s.id !== id));
  };

  const handleAddSpecimenToStudy = (studyId: string, specimen: PantoneSpecimen) => {
    setCustomStudies(prev => {
      const idx = prev.findIndex(s => s.id === studyId);
      if (idx >= 0) {
        const target = { ...prev[idx] };
        if (!target.specimens.some(s => s.code === specimen.code)) {
          target.specimens = [...target.specimens, specimen];
          target.ratio = [...target.ratio, 15];
          const updated = [...prev];
          updated[idx] = target;
          return updated;
        }
        return prev;
      }
      const foundCurated = curatedStudies.find(s => s.id === studyId);
      if (foundCurated && !foundCurated.specimens.some(s => s.code === specimen.code)) {
        const cloned: PaletteStudy = {
          ...foundCurated,
          id: `custom-${Date.now()}`,
          title: `${foundCurated.title} (Customized)`,
          specimens: [...foundCurated.specimens, specimen],
          ratio: [...foundCurated.ratio, 15],
        };
        return [cloned, ...prev];
      }
      return prev;
    });
  };

  const handleSelectSection = (section: ActiveSection) => {
    setActiveSection(section);
    const targetMap: Record<ActiveSection, string> = {
      archive: 'color-studio',
      specimens: 'specimens-archive',
      comparison: 'comparison-view',
      palettes: 'palette-studies',
      export: 'export-blocks',
    };
    const el = document.getElementById(targetMap[section]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen relative bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200 selection:bg-[var(--text-primary)] selection:text-[var(--bg-page)] ${showGridLines ? 'grid-lines-active' : ''}`}>
      
      {/* Ambient continuous chromatic lighting & floating background orbs */}
      <AmbientBackground currentColorHex={currentColorHex} />

      {/* Minimal Masthead */}
      <HeaderEditorial
        theme={theme}
        onToggleTheme={handleToggleTheme}
        showGridLines={showGridLines}
        onToggleGridLines={handleToggleGridLines}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        activeSpecimen={activeSpecimen}
        currentColorHex={currentColorHex}
        onColorChange={handleColorChange}
      />

      <main className="w-full relative z-10">
        {/* Core Guided Color Studio: Hero Canvas, Spectrum Hue & Brightness Slider (White to Black), Match */}
        <ColorStudioMinimal
          currentColorHex={currentColorHex}
          onColorChange={handleColorChange}
          primaryMatch={primaryMatch}
          activeSpecimen={activeSpecimen}
          onSelectSpecimen={handleSelectSpecimen}
          onNavigateSection={(section) => handleSelectSection(section)}
        />

        {/* Pantone Results: Clean Swatch Deck */}
        <SpecimenGrid
          matches={closestMatches}
          activeSpecimen={activeSpecimen}
          onSelectSpecimen={handleSelectSpecimen}
          onAddToPalette={handleAddToPalette}
        />

        {/* Side-by-side Visual Comparison */}
        <ComparisonStudy
          userHex={currentColorHex}
          activeSpecimen={activeSpecimen}
          closestMatch={primaryMatch}
          onSelectSpecimen={handleSelectSpecimen}
        />

        {/* Harmonic Palettes & Proportional Studies */}
        <PaletteGallery
          studies={allPaletteStudies}
          activeSpecimen={activeSpecimen}
          currentColorHex={currentColorHex}
          onSelectSpecimen={handleSelectSpecimen}
          onAddStudy={handleAddStudy}
          onDeleteStudy={handleDeleteStudy}
          onAddSpecimenToStudy={handleAddSpecimenToStudy}
        />

        {/* Minimal Export Block */}
        <ExportPublication
          activeSpecimen={activeSpecimen}
          matches={closestMatches}
          userHex={currentColorHex}
        />
      </main>

      {/* Clean Modernist Footer */}
      <footer className="w-full hairline-t bg-[var(--bg-page)] text-[var(--text-muted)] py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-xs font-specimen-mono gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-primary)]">ColorAtlas</span>
            <span>•</span>
            <span>5,000+ Calibrated Standards Archive</span>
          </div>

          <div className="flex items-center gap-6 text-[var(--text-faint)]">
            <button
              onClick={() => handleSelectSection('archive')}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Studio
            </button>
            <button
              onClick={() => handleSelectSection('specimens')}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Matches
            </button>
            <button
              onClick={() => handleSelectSection('palettes')}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Palettes
            </button>
            <button
              onClick={() => handleSelectSection('export')}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Export
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer text-[var(--text-primary)] font-semibold"
            >
              Back to Top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
