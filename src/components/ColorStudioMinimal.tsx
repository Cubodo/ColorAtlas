/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PantoneSpecimen, ColorMatchResult, ColorRGB, ColorCMYK, ColorHSL } from '../types';
import { 
  hexToRgb, 
  rgbToHex, 
  rgbToCmyk, 
  cmykToRgb,
  rgbToLab, 
  rgbToHsl, 
  hslToRgb, 
  getContrastTextColor 
} from '../utils/colorScience';
import { 
  Copy, 
  Check, 
  Pipette, 
  ArrowDown, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ColorSquareSelector, ColorCoordinate, RGB } from './ColorSquareSelector';
import { MagneticButton } from './MagneticButton';

interface MetricInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (val: number) => void;
}

const MetricInput: React.FC<MetricInputProps> = ({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}) => {
  const [localVal, setLocalVal] = useState<string>(String(value));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalVal(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setLocalVal(text);
    if (text === '') return;
    const num = parseInt(text, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const num = parseInt(localVal, 10);
    if (isNaN(num)) {
      setLocalVal(String(value));
    } else {
      const clamped = Math.max(min, Math.min(max, num));
      setLocalVal(String(clamped));
      onChange(clamped);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex items-center border border-[var(--border-grid)] bg-[var(--bg-tile)] focus-within:border-[var(--text-primary)] transition-all shadow-xs">
      <span className="px-2.5 py-1.5 text-[10px] font-specimen-mono font-bold text-[var(--text-muted)] bg-[var(--bg-page)] border-r border-[var(--border-grid)] select-none shrink-0">
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={localVal}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full min-w-0 px-2 py-1.5 text-xs font-bold font-specimen-mono text-[var(--text-primary)] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {unit && (
        <span className="pr-2 text-[10px] font-specimen-mono text-[var(--text-faint)] select-none shrink-0 font-semibold">
          {unit}
        </span>
      )}
    </div>
  );
};

interface ColorStudioMinimalProps {
  currentColorHex: string;
  onColorChange: (newHex: string) => void;
  primaryMatch: ColorMatchResult;
  activeSpecimen: PantoneSpecimen;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
  onNavigateSection: (section: 'specimens') => void;
}

export const ColorStudioMinimal: React.FC<ColorStudioMinimalProps> = ({
  currentColorHex,
  onColorChange,
  primaryMatch,
  activeSpecimen: _activeSpecimen,
  onSelectSpecimen,
  onNavigateSection,
}) => {
  const [hexInput, setHexInput] = useState(currentColorHex);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active base hue angle (0 - 360) for the pure solid color along the bottom of the plane
  const [baseHue, setBaseHue] = useState<number>(() => {
    const initialHsl = rgbToHsl(hexToRgb(currentColorHex));
    return initialHsl.s > 10 ? initialHsl.h : 24;
  });

  // Current active 2D coordinate inside the color plane (u: lightness, v: solid saturation)
  const [squareCoord, setSquareCoord] = useState<ColorCoordinate>(() => {
    const initialHsl = rgbToHsl(hexToRgb(currentColorHex));
    return {
      u: Number(Math.max(0, Math.min(1, 1 - initialHsl.l / 100)).toFixed(4)),
      v: Number(Math.max(0, Math.min(1, initialHsl.s / 100)).toFixed(4)),
    };
  });

  // Flag to lock coordinates during internal hue slider or 2D plane manipulation
  const isInteractingInternallyRef = useRef(false);
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position cursor at the end of text when hexInput updates while focused
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [hexInput]);

  // Sync state when currentColorHex changes from EXTERNAL triggers (swatch click, palette click, etc.)
  useEffect(() => {
    setHexInput(currentColorHex);

    // CRITICAL FIX: If the color update originated from internal slider or plane interaction,
    // NEVER overwrite squareCoord or baseHue! This guarantees that changing the hue spectrum
    // will NOT move or affect the color plane selector's position!
    if (isInteractingInternallyRef.current) {
      return;
    }

    const extRgb = hexToRgb(currentColorHex);
    const extHsl = rgbToHsl(extRgb);

    // Only update baseHue if external color has noticeable saturation
    if (extHsl.s > 10) {
      setBaseHue(extHsl.h);
    }

    const v = Math.max(0, Math.min(1, extHsl.s / 100));
    const u = Math.max(0, Math.min(1, 1 - extHsl.l / 100));
    setSquareCoord({
      u: Number(u.toFixed(4)),
      v: Number(v.toFixed(4)),
    });
  }, [currentColorHex]);

  const rgb = useMemo(() => hexToRgb(currentColorHex), [currentColorHex]);
  const cmyk = useMemo(() => rgbToCmyk(rgb), [rgb]);
  const lab = useMemo(() => rgbToLab(rgb), [rgb]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const contrastText = useMemo(() => getContrastTextColor(currentColorHex), [currentColorHex]);
  const isLight = contrastText === '#111111';

  // Handlers to edit individual values to tweak colors:
  const handleRgbChange = (channel: keyof ColorRGB, val: number) => {
    const nextRgb: ColorRGB = { ...rgb, [channel]: val };
    onColorChange(rgbToHex(nextRgb));
  };

  const handleCmykChange = (channel: keyof ColorCMYK, val: number) => {
    const nextCmyk: ColorCMYK = { ...cmyk, [channel]: val };
    const nextRgb = cmykToRgb(nextCmyk);
    onColorChange(rgbToHex(nextRgb));
  };

  const handleHslChange = (channel: keyof ColorHSL, val: number) => {
    const nextHsl: ColorHSL = { ...hsl, [channel]: val };
    const nextRgb = hslToRgb(nextHsl);
    if (channel === 'h') {
      setBaseHue(val);
    }
    onColorChange(rgbToHex(nextRgb));
  };

  // Pure saturated base color along bottom of 2D selector
  // Note: Only changes when baseHue changes! Never changes during 2D plane dragging!
  const baseColor = useMemo(() => {
    const baseRgb = hslToRgb({ h: baseHue, s: 100, l: 50 });
    return rgbToHex(baseRgb);
  }, [baseHue]);

  // Handle direct hex string input
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setHexInput(val);
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onColorChange(val);
    }
  };

  // Handle native color picker
  const handleNativePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    onColorChange(val);
  };

  // Handle Hue spectrum change (Leaves squareCoord strictly unaffected!)
  const handleHueChange = (newHue: number) => {
    isInteractingInternallyRef.current = true;
    setBaseHue(newHue);

    // Recalculate color at current squareCoord with the new base hue
    const newBaseRgb = hslToRgb({ h: newHue, s: 100, l: 50 });
    const top = (1 - squareCoord.u) * 255;
    const r = Math.round((1 - squareCoord.v) * top + squareCoord.v * newBaseRgb.r);
    const g = Math.round((1 - squareCoord.v) * top + squareCoord.v * newBaseRgb.g);
    const b = Math.round((1 - squareCoord.v) * top + squareCoord.v * newBaseRgb.b);
    const clampedRgb = {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
    };
    onColorChange(rgbToHex(clampedRgb));

    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      isInteractingInternallyRef.current = false;
    }, 350);
  };

  // Handle 2D Color Square selector change
  const handleSquareChange = (newCoord: ColorCoordinate, _rgb: RGB, newHex: string) => {
    isInteractingInternallyRef.current = true;
    setSquareCoord(newCoord);
    onColorChange(newHex);

    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      isInteractingInternallyRef.current = false;
    }, 350);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)]" id="color-studio">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Editorial Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-grid)] mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-3 bg-[var(--text-primary)] inline-block"></span>
              <span className="text-[11px] font-specimen-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                Studio Benchmark // 01
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--text-primary)] font-sans">
              Color Synthesis & Specification
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Direct numeric channel calibration, real-time spectral synthesis, and authentic Pantone standard matching
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-specimen-mono text-[var(--text-muted)] shrink-0 self-start md:self-end flex-wrap">
            <button
              onClick={() => copyToClipboard(primaryMatch.specimen.code, 'masthead-pantone')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tile)] hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-page)] border border-[var(--border-grid)] shadow-xs font-bold transition-all cursor-pointer"
              title={`Copy ${primaryMatch.specimen.code} directly`}
            >
              {copiedKey === 'masthead-pantone' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {primaryMatch.specimen.code}</span>
                </>
              )}
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs">
              <span 
                className="w-2.5 h-2.5 rounded-none inline-block border border-black/20 dark:border-white/20 shrink-0" 
                style={{ backgroundColor: currentColorHex }}
              />
              <span className="font-bold text-[var(--text-primary)] tracking-wide">{currentColorHex.toUpperCase()}</span>
              <span className="text-[10px] text-[var(--text-faint)] font-medium">TARGET</span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Harmonized Studio Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Column Left: Active Color Specimen + Ingestion + Closest Match Deck */}
          <motion.div 
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col space-y-6"
          >
            
            {/* 1. Active Color Master Deck */}
            <div className="flex flex-col border border-[var(--border-grid)] bg-[var(--bg-tile)] shadow-xs overflow-hidden">
              {/* Swatch Showcase Canvas with smooth motion color background */}
              <motion.div 
                animate={{ backgroundColor: currentColorHex }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative w-full h-52 sm:h-56 rounded-none overflow-hidden flex flex-col justify-between p-6"
              >
                {/* Top indicator & quick copy */}
                <div className="flex items-center justify-between z-10 flex-wrap gap-2" style={{ color: contrastText }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none inline-block" style={{ backgroundColor: contrastText }}></span>
                    <span className="text-[11px] uppercase font-specimen-mono tracking-widest font-semibold opacity-90">
                      Active Color Target
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Direct Copy Pantone Code Button */}
                    <MagneticButton
                      onClick={() => copyToClipboard(primaryMatch.specimen.code, 'hero-pantone-code')}
                      className="px-2.5 py-1 rounded-none text-[11px] font-specimen-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                      title={`Directly copy Pantone code: ${primaryMatch.specimen.code}`}
                      magneticStrength={0.25}
                    >
                      <span
                        className="px-2.5 py-0.5 rounded-none flex items-center gap-1.5 font-bold shadow-xs"
                        style={{
                          backgroundColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.22)',
                          color: contrastText,
                        }}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {copiedKey === 'hero-pantone-code' ? (
                            <motion.span
                              key="copied-pantone"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-1 text-emerald-400 font-bold"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied Pantone</span>
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy-pantone"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-1.5"
                            >
                              <Copy className="w-3 h-3 opacity-80" />
                              <span>Copy Pantone</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </MagneticButton>

                    <MagneticButton
                      onClick={() => copyToClipboard(currentColorHex, 'master-hex')}
                      className="px-2.5 py-1 rounded-none text-[11px] font-specimen-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                      title="Copy Hex to clipboard"
                      magneticStrength={0.25}
                    >
                      <span
                        className="px-2 py-0.5 rounded-none flex items-center gap-1.5"
                        style={{
                          backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                          color: contrastText,
                        }}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {copiedKey === 'master-hex' ? (
                            <motion.span
                              key="copied"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-1 text-emerald-500 font-bold"
                            >
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Copied</span>
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-1.5"
                            >
                              <Copy className="w-3 h-3 opacity-75" />
                              <span>Copy Hex</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </MagneticButton>
                  </div>
                </div>

                {/* Center Hero HEX Display with gentle pop transition */}
                <div className="my-auto z-10" style={{ color: contrastText }}>
                  <motion.h1 
                    key={currentColorHex}
                    initial={{ opacity: 0.7, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-4xl sm:text-5xl font-light font-specimen-mono tracking-tight select-all"
                  >
                    {currentColorHex.toUpperCase()}
                  </motion.h1>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-medium opacity-90 truncate">
                      Matched to <span className="underline decoration-1 underline-offset-4 font-bold">{primaryMatch.specimen.code}</span>
                      {primaryMatch.specimen.name && primaryMatch.specimen.name !== primaryMatch.specimen.code && ` — ${primaryMatch.specimen.name}`}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(primaryMatch.specimen.code, 'subtext-pantone');
                      }}
                      className="px-2 py-0.5 text-[10px] font-specimen-mono uppercase tracking-wider rounded-none border border-current/30 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer inline-flex items-center gap-1 font-semibold"
                      title={`Copy ${primaryMatch.specimen.code} directly`}
                    >
                      {copiedKey === 'subtext-pantone' ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5 opacity-80" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* High-Legibility Precision Values Strip (Structured Under Swatch) */}
              <div className="grid grid-cols-3 border-t border-[var(--border-grid)] bg-[var(--bg-tile)] divide-x divide-[var(--border-grid)]">
                <button
                  onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
                  className="p-3 text-left hover:bg-[var(--bg-page)]/70 active:bg-[var(--bg-page)] transition-all cursor-pointer group"
                  title="Click to copy RGB"
                >
                  <div className="text-[10px] font-specimen-mono uppercase text-[var(--text-faint)] group-hover:text-[var(--text-primary)] font-semibold flex items-center justify-between">
                    <span>RGB</span>
                    {copiedKey === 'rgb' && <span className="text-emerald-500 text-[9px] font-bold">COPIED</span>}
                  </div>
                  <div className="text-xs font-bold font-specimen-mono text-[var(--text-primary)] mt-0.5 truncate transition-transform group-hover:translate-x-0.5">
                    {rgb.r}, {rgb.g}, {rgb.b}
                  </div>
                </button>

                <button
                  onClick={() => copyToClipboard(`${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`, 'cmyk')}
                  className="p-3 text-left hover:bg-[var(--bg-page)]/70 active:bg-[var(--bg-page)] transition-all cursor-pointer group"
                  title="Click to copy CMYK"
                >
                  <div className="text-[10px] font-specimen-mono uppercase text-[var(--text-faint)] group-hover:text-[var(--text-primary)] font-semibold flex items-center justify-between">
                    <span>CMYK</span>
                    {copiedKey === 'cmyk' && <span className="text-emerald-500 text-[9px] font-bold">COPIED</span>}
                  </div>
                  <div className="text-xs font-bold font-specimen-mono text-[var(--text-primary)] mt-0.5 truncate transition-transform group-hover:translate-x-0.5">
                    {cmyk.c}, {cmyk.m}, {cmyk.y}, {cmyk.k}
                  </div>
                </button>

                <button
                  onClick={() => copyToClipboard(`${lab.l}, ${lab.a}, ${lab.b}`, 'lab')}
                  className="p-3 text-left hover:bg-[var(--bg-page)]/70 active:bg-[var(--bg-page)] transition-all cursor-pointer group"
                  title="Click to copy LAB"
                >
                  <div className="text-[10px] font-specimen-mono uppercase text-[var(--text-faint)] group-hover:text-[var(--text-primary)] font-semibold flex items-center justify-between">
                    <span>CIELAB</span>
                    {copiedKey === 'lab' && <span className="text-emerald-500 text-[9px] font-bold">COPIED</span>}
                  </div>
                  <div className="text-xs font-bold font-specimen-mono text-[var(--text-primary)] mt-0.5 truncate transition-transform group-hover:translate-x-0.5">
                    {lab.l}, {lab.a}, {lab.b}
                  </div>
                </button>
              </div>

              {/* Integrated Ingestion Controls */}
              <div className="p-4 border-t border-[var(--border-grid)] bg-[var(--bg-page)]/40 flex items-center gap-3">
                <label 
                  htmlFor="studio-color-picker"
                  className="relative w-11 h-11 rounded-none shrink-0 cursor-pointer border border-black/15 shadow-sm block hover:scale-105 active:scale-95 transition-transform overflow-hidden"
                  style={{ backgroundColor: currentColorHex }}
                  title="Open system color picker / eyedropper"
                >
                  <input
                    id="studio-color-picker"
                    type="color"
                    value={currentColorHex}
                    onChange={handleNativePicker}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 bg-black/40 text-white transition-opacity">
                    <Pipette className="w-4 h-4" />
                  </span>
                </label>

                <div 
                  onClick={() => {
                    inputRef.current?.focus();
                  }}
                  className="flex-1 flex items-center px-3.5 py-2 rounded-none border border-[var(--border-grid)] bg-[var(--bg-tile)] focus-within:border-[var(--text-primary)] focus-within:shadow-xs transition-all cursor-text relative shadow-xs"
                >
                  <span className="text-base font-specimen-mono text-[var(--text-muted)] mr-1.5 font-bold select-none">#</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={hexInput.replace('#', '')}
                    onChange={handleHexChange}
                    maxLength={6}
                    placeholder="FA5B0F"
                    className="w-full bg-transparent text-base font-bold font-specimen-mono text-[var(--text-primary)] uppercase tracking-widest focus:outline-none"
                    aria-label="Hex color value input"
                  />
                  <span className="text-[10px] font-specimen-mono text-[var(--text-faint)] uppercase tracking-wider shrink-0 hidden sm:inline">
                    HEX 6-DIGIT
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Primary Pantone Match Benchmark Card with smooth hover lift and direct copy */}
            <motion.div 
              whileHover={{ y: -3, transition: { duration: 0.18, ease: 'easeOut' } }}
              whileTap={{ scale: 0.99 }}
              className="p-5 rounded-none bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[var(--text-primary)] hover:shadow-md transition-all"
            >
              <div 
                onClick={() => {
                  onSelectSpecimen(primaryMatch.specimen);
                  onNavigateSection('specimens');
                }}
                className="flex items-center gap-4 cursor-pointer flex-1"
                title="Click to inspect this specimen in Archive"
              >
                <motion.div 
                  animate={{ backgroundColor: primaryMatch.specimen.hex }}
                  transition={{ duration: 0.25 }}
                  className="w-13 h-13 rounded-none border border-black/10 dark:border-white/10 shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-specimen-mono text-emerald-600 dark:text-emerald-400 font-bold tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {primaryMatch.matchScore}% Match
                    </span>
                    <span className="text-[10px] font-specimen-mono text-[var(--text-faint)]">
                      (ΔE {primaryMatch.deltaE.toFixed(2)})
                    </span>
                  </div>
                  <div className="text-base font-bold font-specimen-mono text-[var(--text-primary)] leading-tight mt-0.5">
                    {primaryMatch.specimen.code}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-[200px] sm:max-w-[280px]">
                    {primaryMatch.specimen.name && primaryMatch.specimen.name !== primaryMatch.specimen.code ? primaryMatch.specimen.name : (primaryMatch.specimen.collectionRef || 'Formula Guide Coated')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-grid)]">
                {/* Direct Button to Copy Pantone Code */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(primaryMatch.specimen.code, 'primary-match-pantone');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[var(--bg-page)] hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-page)] border border-[var(--border-grid)] text-xs font-specimen-mono font-bold transition-all shadow-xs cursor-pointer"
                  title={`Copy "${primaryMatch.specimen.code}" directly to clipboard`}
                >
                  {copiedKey === 'primary-match-pantone' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onSelectSpecimen(primaryMatch.specimen);
                    onNavigateSection('specimens');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-specimen-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Inspect in Archive"
                >
                  <span className="hidden md:inline">Inspect</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-all" />
                </button>
              </div>
            </motion.div>

            {/* Direct Pantone Code Quick Bar */}
            <div className="p-4 rounded-none bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10px] font-specimen-mono text-[var(--text-muted)]">
                <span className="uppercase font-bold tracking-widest text-[var(--text-primary)]">
                  Quick Copy Calibrated Standard
                </span>
                <span className="text-[var(--text-faint)]">DIRECT CLIPBOARD</span>
              </div>
              <div className="flex items-center justify-between gap-3 p-2.5 bg-[var(--bg-page)]/60 border border-[var(--border-grid)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span 
                    className="w-4 h-4 rounded-none shrink-0 border border-black/15 shadow-xs" 
                    style={{ backgroundColor: primaryMatch.specimen.hex }} 
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold font-specimen-mono text-[var(--text-primary)] block truncate">
                      {primaryMatch.specimen.code}
                    </span>
                    <span className="text-[10px] text-[var(--text-faint)] font-specimen-mono truncate block">
                      {primaryMatch.specimen.hex} • {primaryMatch.matchScore}% Match
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(primaryMatch.specimen.code, 'quick-bar-pantone')}
                  className="px-3 py-1.5 rounded-none bg-[var(--text-primary)] text-[var(--bg-page)] text-xs font-specimen-mono font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  title={`Copy ${primaryMatch.specimen.code} directly`}
                >
                  {copiedKey === 'quick-bar-pantone' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Pantone</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>

          {/* Column Right: Chromatic Synthesizer Deck (Hue Spectrum + 2D Bilinear Plane + Channel Calibration) */}
          <motion.div 
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col space-y-6"
          >
            
            <div className="p-6 sm:p-7 rounded-none bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs space-y-6">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-grid)] pb-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)] font-specimen-mono">
                    Chromatic Synthesizer
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-specimen-mono mt-0.5">
                    Spectral Angle & Bilinear Tone Plane Calibration
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-[var(--bg-page)] border border-[var(--border-grid)] text-xs font-bold font-specimen-mono text-[var(--text-primary)] shadow-xs">
                    {Math.round(baseHue)}° HUE
                  </span>
                </div>
              </div>

              {/* Section 1: Hue Spectrum Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-specimen-mono">
                  <span className="text-[var(--text-muted)] uppercase tracking-wider text-[11px] font-medium">
                    Spectral Hue Sweep
                  </span>
                  <span className="text-[var(--text-faint)] text-[10px]">0° → 360°</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={Math.round(baseHue)}
                  onChange={(e) => handleHueChange(Number(e.target.value))}
                  className="w-full h-3.5 rounded-none cursor-pointer appearance-none transition-all outline-none"
                  style={{
                    background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                  }}
                  title="Tune Color Spectrum Hue (0° - 360°)"
                  aria-label="Hue Spectrum Slider"
                />

                {/* Calibrated Spectral Anchor Labels */}
                <div className="flex justify-between text-[9px] font-specimen-mono text-[var(--text-faint)] pt-0.5 select-none px-0.5">
                  <span>0° R</span>
                  <span>60° Y</span>
                  <span>120° G</span>
                  <span>180° C</span>
                  <span>240° B</span>
                  <span>300° M</span>
                  <span>360° R</span>
                </div>
              </div>

              {/* Hairline Divider & Dual-Pane Calibration Workspace */}
              <div className="border-t border-[var(--border-grid)] pt-6">
                <div className="flex items-center justify-between text-xs font-specimen-mono mb-4">
                  <span className="text-[var(--text-primary)] font-semibold uppercase tracking-wider">
                    2D Color Plane & Channel Calibration
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider hidden sm:inline">
                    Direct Channel Calibration
                  </span>
                </div>

                {/* Left Side (Color Selector Box) + Right Side (Technical Color Metrics) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Side: 2D Color Plane Box */}
                  <div className="sm:col-span-5 flex flex-col justify-between items-center p-4 bg-[var(--bg-page)]/40 border border-[var(--border-grid)] shadow-xs">
                    <div className="relative p-1 border border-[var(--border-grid)] bg-[var(--bg-tile)]">
                      <ColorSquareSelector
                        baseColor={baseColor}
                        value={squareCoord}
                        onChange={handleSquareChange}
                        size={195}
                        className="w-full max-w-[195px]"
                      />
                    </div>
                    <p className="mt-3 text-[10px] font-specimen-mono text-[var(--text-faint)] leading-relaxed text-center">
                      (0,0) White → (1,0) Black → Solid Base
                    </p>
                  </div>

                  {/* Right Side — Technical Color Metrics */}
                  <div className="sm:col-span-7 flex flex-col justify-between space-y-4 p-4 bg-[var(--bg-page)]/40 border border-[var(--border-grid)] shadow-xs">
                    
                    {/* RGB Channels */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-specimen-mono">
                        <span className="font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-rose-500 inline-block"></span>
                          <span>RGB Breakdown</span>
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-specimen-mono">
                          0 — 255
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <MetricInput label="R" value={rgb.r} min={0} max={255} onChange={(v) => handleRgbChange('r', v)} />
                        <MetricInput label="G" value={rgb.g} min={0} max={255} onChange={(v) => handleRgbChange('g', v)} />
                        <MetricInput label="B" value={rgb.b} min={0} max={255} onChange={(v) => handleRgbChange('b', v)} />
                      </div>
                    </div>

                    {/* HSL Cylindrical */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-specimen-mono">
                        <span className="font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-amber-500 inline-block"></span>
                          <span>HSL Cylindrical</span>
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-specimen-mono">
                          H° • S% • L%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <MetricInput label="H" value={hsl.h} min={0} max={360} unit="°" onChange={(v) => handleHslChange('h', v)} />
                        <MetricInput label="S" value={hsl.s} min={0} max={100} unit="%" onChange={(v) => handleHslChange('s', v)} />
                        <MetricInput label="L" value={hsl.l} min={0} max={100} unit="%" onChange={(v) => handleHslChange('l', v)} />
                      </div>
                    </div>

                    {/* CMYK Process */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-specimen-mono">
                        <span className="font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-cyan-500 inline-block"></span>
                          <span>CMYK Process</span>
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-specimen-mono">
                          0 — 100%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <MetricInput label="C" value={cmyk.c} min={0} max={100} unit="%" onChange={(v) => handleCmykChange('c', v)} />
                        <MetricInput label="M" value={cmyk.m} min={0} max={100} unit="%" onChange={(v) => handleCmykChange('m', v)} />
                        <MetricInput label="Y" value={cmyk.y} min={0} max={100} unit="%" onChange={(v) => handleCmykChange('y', v)} />
                        <MetricInput label="K" value={cmyk.k} min={0} max={100} unit="%" onChange={(v) => handleCmykChange('k', v)} />
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
};
