/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PantoneSpecimen, ColorMatchResult } from '../types';
import { generateAtmosphericArtwork, hexToRgb, rgbToCmyk, rgbToLab, getContrastTextColor, rgbToHsl, hslToRgb, rgbToHex } from '../utils/colorScience';
import { Copy, Check, ArrowDownRight, Compass, Sparkles, Sliders, Pipette, Hash } from 'lucide-react';

interface HeroAtmosphericProps {
  userHex: string;
  onColorChange: (newHex: string) => void;
  closestMatch: ColorMatchResult;
  activeSpecimen: PantoneSpecimen;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
  onExploreSpecimens: () => void;
  showGridLines: boolean;
}

export const HeroAtmospheric: React.FC<HeroAtmosphericProps> = ({
  userHex,
  onColorChange,
  closestMatch,
  activeSpecimen,
  onSelectSpecimen,
  onExploreSpecimens,
  showGridLines,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [hexInput, setHexInput] = React.useState(userHex);

  const userRgb = React.useMemo(() => hexToRgb(userHex), [userHex]);
  const userCmyk = React.useMemo(() => rgbToCmyk(userRgb), [userRgb]);
  const userLab = React.useMemo(() => rgbToLab(userRgb), [userRgb]);
  const artwork = React.useMemo(() => generateAtmosphericArtwork(userHex), [userHex]);
  const textColor = React.useMemo(() => getContrastTextColor(userHex), [userHex]);
  const isLight = textColor === '#111111';

  const subtleSwatchGradient = React.useMemo(() => {
    const hsl = rgbToHsl(userRgb);
    // Deliberate, subtle tonal modulation (+6% lightness highlight to -6% rich depth)
    const lightRgb = hslToRgb({
      h: hsl.h,
      s: Math.min(100, Math.max(0, hsl.s + 2)),
      l: Math.min(97, Math.max(3, hsl.l + 6)),
    });
    const deepRgb = hslToRgb({
      h: hsl.h,
      s: Math.min(100, Math.max(0, hsl.s + 3)),
      l: Math.max(3, Math.min(97, hsl.l - 6)),
    });
    const lightHex = rgbToHex(lightRgb);
    const deepHex = rgbToHex(deepRgb);
    return `linear-gradient(145deg, ${lightHex} 0%, ${userHex} 52%, ${deepHex} 100%)`;
  }, [userRgb, userHex]);

  // Sync internal hex input with parent
  React.useEffect(() => {
    setHexInput(userHex);
  }, [userHex]);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setHexInput(val);
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onColorChange(val);
    }
  };

  const handleNativeColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    onColorChange(val);
  };

  const handleCopyHex = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative w-full hairline-b bg-[var(--bg-page)] overflow-hidden">
      {/* Editorial Spread Grid: Asymmetrical Layout */}
      <div className="grid grid-cols-12 min-h-[calc(100vh-100px)]">
        
        {/* Left Column / Editorial Color Panel - Master Swatch touches outer box borders */}
        <div className="col-span-12 lg:col-span-7 relative min-h-[520px] lg:min-h-full hairline-r flex flex-col justify-between overflow-hidden group bg-[var(--bg-tile)]">
          
          {/* Dynamic Ambient Atmospheric Artwork Canvas behind */}
          <div
            className="absolute inset-0 transition-all duration-1000 ease-out pointer-events-none"
            style={{
              background: artwork.background,
              filter: 'blur(36px) saturate(1.2)',
              transform: 'scale(1.15)',
              opacity: 0.85,
            }}
          />

          {/* Archival Grain / Film Overlay for physical publication feel */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
            }}
          />

          {/* Top Registration / Header Bar (Touches left & right borders of the box) */}
          <div className="relative z-20 flex items-center justify-between text-white px-5 sm:px-8 py-3.5 hairline-b border-white/15 bg-black/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {/* Three-bar modernist logo mark in white */}
              <div className="flex items-end gap-1 h-5 w-5 shrink-0" aria-hidden="true">
                <div className="w-1 h-3 bg-white"></div>
                <div className="w-1 h-4.5 bg-white"></div>
                <div className="w-1 h-5 bg-white"></div>
              </div>
              <span className="text-[11px] font-specimen-mono tracking-widest uppercase text-white/95">
                MASTER SPECIMEN • {userHex.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="glass-gradient-pill px-2.5 py-0.5 text-[10px] font-specimen-mono tracking-wider uppercase text-white font-medium">
                Curated Master Swatch
              </span>
              <span className="hidden sm:inline-block glass-gradient-pill px-2 py-0.5 text-[10px] font-specimen-mono text-white/90">
                ΔE {closestMatch.deltaE.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Curated Master Swatch: Touching the border of the box edge-to-edge */}
          <div
            className="relative flex-1 w-full min-h-[380px] sm:min-h-[440px] transition-all duration-500 overflow-hidden flex flex-col justify-between p-5 sm:p-8"
            style={{ background: subtleSwatchGradient }}
          >
            {/* Swiss Grid Construction Lines running flush to the box borders */}
            {showGridLines && (
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute top-1/2 left-0 right-0 h-[1px]"
                  style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)' }}
                />
                <div
                  className="absolute top-0 bottom-0 left-1/2 w-[1px]"
                  style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)' }}
                />
                <div
                  className="absolute inset-2 sm:inset-4 border"
                  style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
                />
              </div>
            )}

            {/* Top Swatch Corner Registration Elements */}
            <div className="relative z-10 flex items-start justify-between" style={{ color: textColor }}>
              <div
                className="px-3 py-1 text-[10px] sm:text-[11px] font-bold font-specimen-mono uppercase tracking-widest flex items-center gap-1.5 border"
                style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.12)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)',
                  color: textColor,
                }}
              >
                <Sparkles className="w-3 h-3 opacity-90" />
                <span>SOLID CHROMATIC FIELD</span>
              </div>

              <div className="text-right font-specimen-mono text-[10px] sm:text-[11px]">
                <div
                  className="px-2.5 py-1 uppercase tracking-widest border"
                  style={{
                    backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.12)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)',
                    color: textColor,
                  }}
                >
                  ISO 12647-2 • D65
                </div>
              </div>
            </div>

            {/* Centerpiece Solid Architectural Master Panel (Matching Selected HEX with No Gradients) */}
            <div className="relative z-10 my-auto py-2 w-full max-w-xl mx-auto">
              <div
                className="p-6 sm:p-8 text-center sm:text-left transition-all duration-300 transform hover:scale-[1.01] border shadow-2xl relative"
                style={{
                  backgroundColor: userHex,
                  color: textColor,
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
                }}
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-4"
                  style={{ borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-specimen-mono tracking-[0.25em] font-semibold opacity-90">
                      Curated Master Swatch
                    </span>
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-specimen-mono uppercase tracking-wider font-bold border"
                      style={{
                        backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)',
                        borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)',
                        color: textColor,
                      }}
                    >
                      Live Search
                    </span>
                  </div>
                  <div className="text-xs font-specimen-mono opacity-90">
                    Pairing: {closestMatch.specimen.code}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest opacity-75 font-specimen-mono mb-1">
                      MASTER FORMULATION
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-extralight font-specimen-mono tracking-tight drop-shadow-xs">
                      {userHex.toUpperCase()}
                    </h2>
                    <p className="mt-1 text-sm opacity-90 font-light tracking-wide">
                      Calibrated Match: <span className="font-semibold">{closestMatch.specimen.code}</span> ({closestMatch.specimen.name})
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyHex(userHex.toUpperCase())}
                    className="px-4 py-2 hover:opacity-85 transition-all text-xs font-specimen-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer self-start sm:self-end shrink-0 border"
                    style={{
                      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.12)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)',
                      color: textColor,
                    }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Master' : `Copy ${userHex.toUpperCase()}`}</span>
                  </button>
                </div>

                {/* Colorimetric Coordinates: Clean Solid Tints (No Gradients) */}
                <div
                  className="mt-5 pt-4 border-t grid grid-cols-3 gap-2 sm:gap-3 text-center"
                  style={{ borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)' }}
                >
                  <div
                    className="py-2 px-1 border"
                    style={{
                      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.18)',
                    }}
                  >
                    <div className="text-[9px] uppercase font-specimen-mono opacity-75">sRGB</div>
                    <div className="text-[11px] sm:text-xs font-bold font-specimen-mono mt-0.5">
                      {userRgb.r}, {userRgb.g}, {userRgb.b}
                    </div>
                  </div>
                  <div
                    className="py-2 px-1 border"
                    style={{
                      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.18)',
                    }}
                  >
                    <div className="text-[9px] uppercase font-specimen-mono opacity-75">Process CMYK</div>
                    <div className="text-[11px] sm:text-xs font-bold font-specimen-mono mt-0.5">
                      {userCmyk.c}% {userCmyk.m}% {userCmyk.y}% {userCmyk.k}%
                    </div>
                  </div>
                  <div
                    className="py-2 px-1 border"
                    style={{
                      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.18)',
                    }}
                  >
                    <div className="text-[9px] uppercase font-specimen-mono opacity-75">CIE L*a*b*</div>
                    <div className="text-[11px] sm:text-xs font-bold font-specimen-mono mt-0.5">
                      {userLab.l}, {userLab.a}, {userLab.b}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Scale & Registration Ruler touching the borders of the swatch */}
            <div className="relative z-10 flex items-end justify-between font-specimen-mono text-[10px] pt-2" style={{ color: textColor }}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-[1px] inline-block" style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)' }} />
                <span>0mm</span>
                <span className="w-16 h-[1px] inline-block" style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)' }} />
                <span>50mm</span>
                <span className="w-8 h-[1px] inline-block" style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)' }} />
                <span>100mm</span>
              </div>
              <div className="uppercase tracking-widest text-[9px] opacity-80">
                FLUSH ARCHITECTURAL BOUNDARY • 100% SOLID
              </div>
            </div>
          </div>

          {/* Bottom Footnote in Hero Artwork (Touches left & right borders of the box) */}
          <div className="relative z-20 flex items-center justify-between text-white/90 text-[11px] font-specimen-mono px-5 sm:px-8 py-3.5 hairline-t border-white/15 bg-black/30 backdrop-blur-md">
            <div>
              <span className="text-white/60 uppercase text-[9px] tracking-wider mr-2">Substrate Finish:</span>
              <span className="font-medium uppercase">
                {activeSpecimen.substrate === 'coated' ? 'Offset Litho Coated Paper (Clay Gloss)' : 'Textured Uncoated Rag (300 GSM)'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-white/80 text-[10px] sm:text-[11px]">
              <span className="hidden sm:inline">ILLUMINANT D65</span>
              <span>2° OBSERVER</span>
            </div>
          </div>
        </div>

        {/* Right Column / Architectural Editorial Tiles & Metadata */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-[var(--bg-page)]">
          
          {/* Top Editorial Tile: Selected Colour & Match Status */}
          <div className="p-6 sm:p-8 hairline-b">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-widest font-specimen-mono text-[var(--text-muted)] mb-3">
              <span>01 / Color Ingestion</span>
              <span className="text-[var(--text-primary)] font-bold">SYSTEM ACTIVE</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              Selected Colour & Precision Match
            </h3>

            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed max-w-md">
              Evaluated across CIE 1976 and CIEDE2000 industrial print colorimetry tolerances. 
              The active formulation exhibits minimal metamerism under standard daylight (D65).
            </p>

            {/* Interactive Primary Color Ingestion & Comparison Strip with Glass Gradient Effect */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 hairline-box overflow-hidden shadow-xs">
              {/* Target / Interactive Color Input Field (With Glass Gradient Effect) */}
              <div className="p-4 sm:p-5 glass-gradient-card hairline-r hairline-b sm:hairline-b-0 flex flex-col justify-between relative group">
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] tracking-wider">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                      <Pipette className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                      Live Color Ingestion
                    </span>
                    <span className="glass-gradient-pill text-[9px] px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300 font-specimen-mono font-semibold">
                      DIRECT INPUT
                    </span>
                  </div>

                  {/* Primary Color Input Box */}
                  <div className="mt-3 flex items-center border-2 border-[var(--text-primary)] bg-[var(--bg-page)]/80 backdrop-blur-xs p-1.5 focus-within:ring-2 focus-within:ring-[var(--text-primary)] transition-all">
                    {/* Native Color Picker Swatch Button */}
                    <label
                      htmlFor="hero-native-color-picker"
                      className="relative w-8 h-8 shrink-0 cursor-pointer border border-black/20 block hover:scale-105 transition-transform"
                      style={{ backgroundColor: userHex }}
                      title="Click to open system color spectrum picker"
                    >
                      <input
                        id="hero-native-color-picker"
                        type="color"
                        value={userHex}
                        onChange={handleNativeColorPicker}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>

                    <div className="flex items-center ml-2.5 w-full">
                      <span className="text-xl font-light text-[var(--text-muted)] font-specimen-mono mr-1">#</span>
                      <input
                        type="text"
                        value={hexInput.replace('#', '')}
                        onChange={handleHexInputChange}
                        maxLength={6}
                        placeholder="FA5B0F"
                        className="w-full bg-transparent text-xl font-bold font-specimen-mono text-[var(--text-primary)] uppercase tracking-wider focus:outline-none"
                        title="Enter any 6-digit hex color"
                        aria-label="Hex color code input"
                      />
                    </div>
                  </div>
                </div>

                {/* Micro Quick Presets directly visible in hero */}
                <div className="mt-4 pt-3 border-t border-[var(--border-grid)]">
                  <div className="text-[9px] uppercase font-specimen-mono text-[var(--text-faint)] mb-1.5 flex items-center justify-between">
                    <span>Quick Architectural Presets</span>
                    <span>sRGB</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {[
                      { hex: '#FA5B0F', label: '1655 C' },
                      { hex: '#00263E', label: '2965 C' },
                      { hex: '#CB333B', label: '1797 C' },
                      { hex: '#FFC72C', label: '123 C' },
                      { hex: '#183028', label: '5535 C' },
                      { hex: '#D9D5CF', label: '7534 C' },
                    ].map(p => (
                      <button
                        key={p.hex}
                        onClick={() => {
                          setHexInput(p.hex);
                          onColorChange(p.hex);
                        }}
                        className={`w-5 h-5 border cursor-pointer shrink-0 transition-transform hover:scale-110 ${
                          userHex.toUpperCase() === p.hex ? 'ring-2 ring-[var(--text-primary)] scale-105' : 'border-black/20'
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={`${p.label} (${p.hex})`}
                        aria-label={`Select preset ${p.label}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Closest Pantone Archive Match (With Glass Gradient Effect) */}
              <div className="p-4 sm:p-5 glass-gradient-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] tracking-wider">
                      Closest Pantone Match
                    </div>
                    <span className="glass-gradient-pill text-[9px] px-2 py-0.5 font-bold font-specimen-mono text-[var(--text-primary)]">
                      {closestMatch.matchScore}% MATCH
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold font-specimen-mono text-[var(--text-primary)] mt-1 truncate">
                    {closestMatch.specimen.code}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {closestMatch.specimen.name}
                  </div>
                </div>

                <div className="mt-3">
                  <div
                    className="h-12 w-full border border-black/10 transition-colors cursor-pointer flex items-center justify-center group/btn relative shadow-xs"
                    style={{ backgroundColor: closestMatch.specimen.hex }}
                    onClick={() => onSelectSpecimen(closestMatch.specimen)}
                    title={`Click to adopt ${closestMatch.specimen.code}`}
                  >
                    <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity bg-black/75 text-white text-[10px] font-specimen-mono uppercase px-2 py-0.5 tracking-wider backdrop-blur-xs">
                      Inspect Specimen
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-specimen-mono text-[var(--text-muted)]">
                    <span>ΔE {closestMatch.deltaE.toFixed(2)}</span>
                    <span className="uppercase">{closestMatch.perceptualRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Image Inspired Sub-grid Tile (3 cols x 2 rows stone grid) */}
          <div className="p-6 sm:p-8 hairline-b bg-[var(--bg-stone)]/30">
            <div className="text-[10px] uppercase tracking-widest font-specimen-mono text-[var(--text-faint)] mb-3">
              Modular Construction System
            </div>

            {/* 3x2 modular sub-grid block matching reference image */}
            <div className="grid grid-cols-3 grid-rows-2 hairline-box bg-[var(--bg-tile)]">
              <div className="p-3 hairline-r hairline-b">
                <div className="text-[9px] uppercase font-specimen-mono text-[var(--text-faint)]">ΔE00 Tolerance</div>
                <div className="text-base font-semibold font-specimen-mono text-[var(--text-primary)] mt-1">
                  {closestMatch.deltaE.toFixed(2)}
                </div>
              </div>
              <div className="p-3 hairline-r hairline-b">
                <div className="text-[9px] uppercase font-specimen-mono text-[var(--text-faint)]">CIE L*a*b*</div>
                <div className="text-xs font-semibold font-specimen-mono text-[var(--text-primary)] mt-1">
                  {activeSpecimen.lab.l}/{activeSpecimen.lab.a}/{activeSpecimen.lab.b}
                </div>
              </div>
              <div className="p-3 hairline-b">
                <div className="text-[9px] uppercase font-specimen-mono text-[var(--text-faint)]">Substrate</div>
                <div className="text-xs font-semibold font-specimen-mono text-[var(--text-primary)] mt-1 uppercase">
                  {activeSpecimen.substrate}
                </div>
              </div>
              <div className="p-3 hairline-r">
                <div className="text-[9px] uppercase font-specimen-mono text-[var(--text-faint)]">Reflectance</div>
                <div className="text-sm font-semibold font-specimen-mono text-[var(--text-primary)] mt-1">
                  {(activeSpecimen.lab.l * 0.95).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 hairline-r">
                <div className="text-[9px] uppercase font-specimen-mono text-[var(--text-faint)]">Collection</div>
                <div className="text-xs font-semibold font-specimen-mono text-[var(--text-primary)] mt-1">
                  Guide 2026
                </div>
              </div>
              <div className="p-3 flex items-center justify-center bg-[var(--charcoal)] text-white">
                {/* 3-bar logo mark */}
                <div className="flex items-end gap-1 h-4 w-4" aria-hidden="true">
                  <div className="w-0.5 h-2 bg-white"></div>
                  <div className="w-0.5 h-3 bg-white"></div>
                  <div className="w-0.5 h-4 bg-white"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Architectural Quote & Specimen Navigation */}
          <div className="p-6 sm:p-8 flex items-center justify-between">
            <div>
              <p className="text-xs italic text-[var(--text-muted)] max-w-xs leading-normal">
                "Color is an architectural instrument. It changes the proportions of an interior and directs perception."
              </p>
              <div className="mt-1 text-[10px] uppercase font-specimen-mono text-[var(--text-faint)]">
                — Modernist Monograph No. 04
              </div>
            </div>

            <button
              onClick={onExploreSpecimens}
              className="flex items-center gap-2 px-4 py-3 bg-[var(--text-primary)] text-[var(--bg-page)] hover:opacity-90 transition-opacity text-xs uppercase tracking-wider font-medium cursor-pointer"
            >
              <span>Explore Archive</span>
              <ArrowDownRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
