/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ThemeMode, ActiveSection, PantoneSpecimen } from '../types';
import { Sun, Moon, Eye, Bookmark, Download, Sparkles, Copy, Check, Camera } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface HeaderEditorialProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  showGridLines: boolean;
  onToggleGridLines: () => void;
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  activeSpecimen: PantoneSpecimen;
  currentColorHex: string;
  onColorChange: (newHex: string) => void;
}

export const HeaderEditorial: React.FC<HeaderEditorialProps> = ({
  theme,
  onToggleTheme,
  activeSection,
  onSelectSection,
  activeSpecimen,
  currentColorHex,
}) => {
  const navItems = [
    { id: 'archive', label: 'Studio', icon: Sparkles },
    { id: 'specimens', label: 'Matches', icon: Eye },
    { id: 'palettes', label: 'Palettes', icon: Bookmark },
    { id: 'photo', label: 'Photo', icon: Camera },
    { id: 'export', label: 'Export', icon: Download },
  ];

  // Smooth scroll progress indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  const [copiedPantone, setCopiedPantone] = useState(false);

  const handleCopyPantone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSpecimen?.code) {
      navigator.clipboard.writeText(activeSpecimen.code);
      setCopiedPantone(true);
      setTimeout(() => setCopiedPantone(false), 1800);
    }
  };

  return (
    <header className="sticky top-0 z-50 hairline-b bg-[var(--bg-page)]/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        
        {/* Brand identity with micro-accent */}
        <div className="flex items-center gap-3 select-none">
          <div 
            onClick={() => onSelectSection('archive')}
            className="flex items-end gap-1 h-5 w-5 shrink-0 cursor-pointer" 
            aria-hidden="true"
          >
            <motion.div 
              whileHover={{ scaleY: 1.25 }}
              className="w-1 h-3 bg-[var(--text-primary)] transition-transform origin-bottom" 
            />
            <motion.div 
              whileHover={{ scaleY: 1.15 }}
              className="w-1 h-4.5 bg-[var(--text-primary)] transition-transform origin-bottom" 
            />
            <motion.div 
              animate={{ backgroundColor: currentColorHex }}
              transition={{ duration: 0.35 }}
              className="w-1 h-5 shadow-xs" 
            />
          </div>
          <div className="flex items-center gap-2">
            <span 
              onClick={() => onSelectSection('archive')}
              className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              ColorAtlas
            </span>
            <button
              onClick={handleCopyPantone}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-specimen-mono font-bold text-[var(--text-primary)] border border-[var(--border-grid)] bg-[var(--bg-tile)] hover:border-[var(--text-primary)] shadow-2xs transition-all cursor-pointer group"
              title={`Click to copy ${activeSpecimen?.code || 'Pantone code'} directly`}
            >
              <span 
                className="w-1.5 h-1.5 rounded-none transition-colors duration-300 shrink-0" 
                style={{ backgroundColor: currentColorHex }} 
              />
              <span>{activeSpecimen?.code || 'PANTONE'}</span>
              {copiedPantone ? (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-[var(--text-faint)] group-hover:text-[var(--text-primary)] shrink-0" />
              )}
              {copiedPantone && <span className="text-emerald-500 text-[8px] font-bold">COPIED</span>}
            </button>
          </div>
        </div>

        {/* Section Navigation with Linear/Apple style shared layoutId sliding background */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-none border border-[var(--border-grid)] bg-[var(--bg-tile)]/70 backdrop-blur-xs">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id as ActiveSection)}
                className={`relative px-3.5 py-1.5 rounded-none text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'text-[var(--bg-page)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                    }}
                    className="absolute inset-0 bg-[var(--text-primary)] shadow-xs z-0"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Switcher Button with Magnetic pull */}
        <div className="flex items-center gap-3">
          <MagneticButton
            onClick={onToggleTheme}
            className="p-2 rounded-none border border-[var(--border-grid)] bg-[var(--bg-tile)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors cursor-pointer shadow-xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            ariaLabel="Toggle dark/light theme"
            magneticStrength={0.35}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -40, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 40, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </MagneticButton>
        </div>

      </div>

      {/* Mobile sub-nav strip */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 hairline-t overflow-x-auto bg-[var(--bg-page)]/95">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id as ActiveSection)}
              className={`relative px-3 py-1 rounded-none text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-[var(--bg-page)] font-bold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavTabMobile"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="absolute inset-0 bg-[var(--text-primary)] z-0"
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtle Scroll Progress Hairline Indicator */}
      <motion.div
        style={{
          scaleX,
          backgroundColor: currentColorHex,
          transformOrigin: '0%',
        }}
        className="absolute bottom-0 left-0 right-0 h-[2px] transition-colors duration-300"
      />
    </header>
  );
};
