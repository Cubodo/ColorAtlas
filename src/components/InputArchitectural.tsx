/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ColorRGB, ColorCMYK, ColorLAB, SubstrateType, PantoneSpecimen } from '../types';
import { hexToRgb, rgbToHex, rgbToCmyk, cmykToRgb, rgbToLab, rgbToHsl, hslToRgb } from '../utils/colorScience';
import { Sliders, RefreshCw, Pipette, Hash, Sparkles } from 'lucide-react';

interface InputArchitecturalProps {
  currentColorHex: string;
  onColorChange: (newHex: string) => void;
  currentSubstrate: SubstrateType;
  onSubstrateChange: (sub: SubstrateType) => void;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
  recentSpecimens: PantoneSpecimen[];
}

export const InputArchitectural: React.FC<InputArchitecturalProps> = ({
  currentColorHex,
  onColorChange,
  currentSubstrate,
  onSubstrateChange,
  onSelectSpecimen,
  recentSpecimens,
}) => {
  const [hexInput, setHexInput] = useState(currentColorHex);
  const rgb = hexToRgb(currentColorHex);
  const cmyk = rgbToCmyk(rgb);
  const lab = rgbToLab(rgb);
  const hsl = rgbToHsl(rgb);

  // Sync hex when external prop updates
  React.useEffect(() => {
    setHexInput(currentColorHex);
  }, [currentColorHex]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    setHexInput(val);
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onColorChange(val);
    }
  };

  const handleRgbChange = (channel: keyof ColorRGB, val: number) => {
    const clamped = Math.max(0, Math.min(255, isNaN(val) ? 0 : val));
    const nextRgb = { ...rgb, [channel]: clamped };
    onColorChange(rgbToHex(nextRgb));
  };

  const handleCmykChange = (channel: keyof ColorCMYK, val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    const nextCmyk = { ...cmyk, [channel]: clamped };
    const nextRgb = cmykToRgb(nextCmyk);
    onColorChange(rgbToHex(nextRgb));
  };

  const [brightnessDirection, setBrightnessDirection] = useState<'whiteToBlack' | 'blackToWhite'>('whiteToBlack');
  const [lastNonZeroHue, setLastNonZeroHue] = useState<number>(hsl.h);
  const [lastNonZeroSat, setLastNonZeroSat] = useState<number>(hsl.s);

  React.useEffect(() => {
    if (hsl.s > 5) {
      setLastNonZeroSat(hsl.s);
      setLastNonZeroHue(hsl.h);
    }
  }, [hsl.h, hsl.s]);

  const handleHueSliderChange = (newHue: number) => {
    setLastNonZeroHue(newHue);
    const sat = hsl.s > 5 ? hsl.s : (lastNonZeroSat || 70);
    const lightness = (hsl.l <= 3 || hsl.l >= 97) ? 50 : hsl.l;
    const nextRgb = hslToRgb({ h: newHue, s: sat, l: lightness });
    onColorChange(rgbToHex(nextRgb));
  };

  const handleBrightnessChange = (sliderValue: number) => {
    // If direction is 'whiteToBlack', slider 0 is white (100% lightness) and 100 is black (0% lightness)
    const targetLightness = brightnessDirection === 'whiteToBlack' ? (100 - sliderValue) : sliderValue;
    const clampedL = Math.max(0, Math.min(100, targetLightness));
    const targetHue = hsl.s > 5 ? hsl.h : lastNonZeroHue;
    const targetSat = hsl.s > 5 ? hsl.s : (lastNonZeroSat || 70);
    const nextRgb = hslToRgb({ h: targetHue, s: targetSat, l: clampedL });
    onColorChange(rgbToHex(nextRgb));
  };

  const [presetTab, setPresetTab] = useState<'formula' | 'fhi'>('fhi');

  const ARCHIVAL_PRESETS = [
    { name: 'Cadmium 1655', hex: '#FA5B0F', label: '1655 C' },
    { name: 'Deep Petrol', hex: '#00263E', label: '2965 C' },
    { name: 'Swiss Red', hex: '#CB333B', label: '1797 C' },
    { name: 'Warm Stone', hex: '#D9D5CF', label: '7534 C' },
    { name: 'Venetian Clay', hex: '#B85338', label: '7575 C' },
    { name: 'Bauhaus Ochre', hex: '#FFC72C', label: '123 C' },
    { name: 'Forest Viridian', hex: '#183028', label: '5535 C' },
    { name: 'Baltic Slate', hex: '#003A4D', label: '548 C' },
    { name: 'Charcoal Black', hex: '#111111', label: 'Black 6' },
  ];

  const FHI_ICONS_PRESETS = [
    { name: 'Tangerine Tango', hex: '#DD4124', label: '17-1463 TCX' },
    { name: 'Classic Blue', hex: '#0F4C81', label: '19-4052 TCX' },
    { name: 'Rose Quartz', hex: '#F7CAC9', label: '13-1520 TCX' },
    { name: 'Peach Fuzz', hex: '#FFBE98', label: '13-1023 TCX' },
    { name: 'Marsala', hex: '#955251', label: '18-1438 TCX' },
    { name: 'Mimosa', hex: '#FFC845', label: '14-0848 TCX' },
    { name: 'Emerald', hex: '#009B77', label: '17-5641 TCX' },
    { name: 'Bright White', hex: '#F4F5F0', label: '11-0601 TCX' },
    { name: 'Pirate Black', hex: '#373838', label: '19-4305 TCX' },
  ];

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)]" id="color-engine">
      {/* Editorial Section Header */}
      <div className="grid grid-cols-12 hairline-b">
        <div className="col-span-12 md:col-span-4 px-6 sm:px-8 py-5 hairline-r">
          <div className="text-[10px] uppercase font-specimen-mono tracking-widest text-[var(--text-faint)]">
            SECTION 02 / COLOR INGESTION ARCHITECTURE
          </div>
          <h2 className="text-xl font-light text-[var(--text-primary)] uppercase tracking-tight mt-1">
            Modular Color Engine
          </h2>
        </div>
        <div className="col-span-12 md:col-span-8 px-6 sm:px-8 py-5 flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)] max-w-xl">
            Input spectral targets directly into the modular architectural grid. 
            Calibrated for standard D65 illuminant, 2-degree standard observer, and sRGB to CIE L*a*b* transformations.
          </p>
          <div className="hidden sm:flex items-center gap-2 font-specimen-mono text-[11px] text-[var(--text-faint)]">
            <span className="w-2 h-2 rounded-none bg-emerald-500 inline-block"></span>
            ACTIVE CALIBRATION
          </div>
        </div>
      </div>

      {/* Main Architectural Grid for Color Inputs */}
      <div className="grid grid-cols-12 items-stretch">
        
        {/* Left: Dedicated Color Ingestion Tile (HEX + RGB + CMYK + LAB) */}
        <div className="col-span-12 lg:col-span-7 hairline-r">
          <div className="grid grid-cols-1 sm:grid-cols-2 hairline-b">
            
            {/* HEX Input Tile */}
            <div className="p-6 sm:p-8 hairline-r border-b sm:border-b-0 border-[var(--border-grid)] bg-[var(--bg-tile)]">
              <div className="flex items-center justify-between text-[11px] font-specimen-mono uppercase text-[var(--text-faint)] mb-2">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  HEX Notation
                </span>
                <span>sRGB SPACE</span>
              </div>

              <div className="flex items-center mt-2 border-b-2 border-[var(--text-primary)] pb-1">
                <span className="text-2xl font-light text-[var(--text-muted)] font-specimen-mono mr-1">#</span>
                <input
                  type="text"
                  value={hexInput.replace('#', '')}
                  onChange={handleHexChange}
                  maxLength={6}
                  placeholder="FA5B0F"
                  className="w-full bg-transparent text-2xl font-bold font-specimen-mono text-[var(--text-primary)] uppercase tracking-widest focus:outline-none"
                  aria-label="HEX Color Code"
                />
                <label
                  htmlFor="architectural-native-picker"
                  className="relative w-7 h-7 border border-black/20 shrink-0 cursor-pointer block hover:scale-105 transition-transform"
                  style={{ backgroundColor: currentColorHex }}
                  title="Click to pick color with native spectrum picker"
                >
                  <input
                    id="architectural-native-picker"
                    type="color"
                    value={currentColorHex}
                    onChange={(e) => onColorChange(e.target.value.toUpperCase())}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>

              <div className="mt-3 text-[10px] text-[var(--text-muted)] font-specimen-mono">
                Luminance: {((0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255 * 100).toFixed(1)}%
              </div>
            </div>

            {/* RGB Discrete Integer Input Tile */}
            <div className="p-6 sm:p-8 bg-[var(--bg-tile)]">
              <div className="flex items-center justify-between text-[11px] font-specimen-mono uppercase text-[var(--text-faint)] mb-2">
                <span>RGB Channels</span>
                <span>0 — 255 INT</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-2">
                {(['r', 'g', 'b'] as const).map(channel => (
                  <div key={channel} className="border-b border-[var(--border-grid)] pb-1">
                    <span className="text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] block">
                      {channel.toUpperCase()}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgb[channel]}
                      onChange={(e) => handleRgbChange(channel, parseInt(e.target.value))}
                      className="w-full bg-transparent text-lg font-bold font-specimen-mono text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[10px] text-[var(--text-muted)] font-specimen-mono">
                Gamma: 2.2 • D65 Reference
              </div>
            </div>
          </div>

          {/* CMYK & LAB Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            
            {/* CMYK Process Separation Tile */}
            <div className="p-6 sm:p-8 hairline-r border-b sm:border-b-0 border-[var(--border-grid)] bg-[var(--bg-tile)]">
              <div className="flex items-center justify-between text-[11px] font-specimen-mono uppercase text-[var(--text-faint)] mb-2">
                <span>CMYK Separation</span>
                <span>PERCENT 0–100%</span>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-2">
                {(['c', 'm', 'y', 'k'] as const).map(key => (
                  <div key={key} className="border-b border-[var(--border-grid)] pb-1">
                    <span className="text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] block">
                      {key.toUpperCase()}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cmyk[key]}
                      onChange={(e) => handleCmykChange(key, parseInt(e.target.value))}
                      className="w-full bg-transparent text-base font-bold font-specimen-mono text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[10px] text-[var(--text-muted)] font-specimen-mono">
                Total Area Coverage (TAC): {cmyk.c + cmyk.m + cmyk.y + cmyk.k}%
              </div>
            </div>

            {/* CIE L*a*b* Perceptual Coordinate Tile */}
            <div className="p-6 sm:p-8 bg-[var(--bg-tile)]">
              <div className="flex items-center justify-between text-[11px] font-specimen-mono uppercase text-[var(--text-faint)] mb-2">
                <span>CIE 1976 L*a*b*</span>
                <span>DEVICE-INDEPENDENT</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="border-b border-[var(--border-grid)] pb-1">
                  <span className="text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] block">L*</span>
                  <div className="text-base font-bold font-specimen-mono text-[var(--text-primary)]">
                    {lab.l.toFixed(1)}
                  </div>
                </div>
                <div className="border-b border-[var(--border-grid)] pb-1">
                  <span className="text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] block">a*</span>
                  <div className="text-base font-bold font-specimen-mono text-[var(--text-primary)]">
                    {lab.a > 0 ? `+${lab.a.toFixed(1)}` : lab.a.toFixed(1)}
                  </div>
                </div>
                <div className="border-b border-[var(--border-grid)] pb-1">
                  <span className="text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] block">b*</span>
                  <div className="text-base font-bold font-specimen-mono text-[var(--text-primary)]">
                    {lab.b > 0 ? `+${lab.b.toFixed(1)}` : lab.b.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-[var(--text-muted)] font-specimen-mono">
                Chromatic Radius C*: {Math.sqrt(lab.a * lab.a + lab.b * lab.b).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Continuous Spectral Hue Ribbon */}
          <div className="p-6 sm:p-8 hairline-t bg-[var(--bg-stone)]/20">
            <div className="flex items-center justify-between text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] mb-2">
              <span>Continuous Spectral Hue Sweep</span>
              <span>{hsl.h}° SPECTRUM</span>
            </div>

            <div className="relative">
              <input
                type="range"
                min={0}
                max={360}
                value={hsl.h}
                onChange={(e) => handleHueSliderChange(parseInt(e.target.value))}
                className="w-full h-4 appearance-none cursor-pointer border border-[var(--border-grid)]"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}
              />
            </div>
          </div>

          {/* Continuous Brightness & Luminance Attenuation Ribbon (White to Black) */}
          <div className="p-6 sm:p-8 hairline-t bg-[var(--bg-stone)]/20">
            <div className="flex items-center justify-between text-[10px] uppercase font-specimen-mono text-[var(--text-faint)] mb-2">
              <div className="flex items-center gap-2">
                <span>Brightness & Luminance Attenuation</span>
                <span className="text-[9px] px-1.5 py-0.5 border border-[var(--border-grid)] bg-[var(--bg-tile)] font-semibold text-[var(--text-muted)]">
                  {brightnessDirection === 'whiteToBlack' ? 'White → Black' : 'Black → White'}
                </span>
              </div>
              <span>{hsl.l}% LIGHTNESS (L*)</span>
            </div>

            <div className="relative">
              <input
                type="range"
                min={0}
                max={100}
                value={brightnessDirection === 'whiteToBlack' ? (100 - hsl.l) : hsl.l}
                onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                className="w-full h-4 appearance-none cursor-pointer border border-[var(--border-grid)]"
                style={{
                  background: brightnessDirection === 'whiteToBlack'
                    ? `linear-gradient(to right, #ffffff 0%, hsl(${hsl.s > 5 ? hsl.h : lastNonZeroHue}, ${Math.max(hsl.s, 20)}%, 50%) 50%, #000000 100%)`
                    : `linear-gradient(to right, #000000 0%, hsl(${hsl.s > 5 ? hsl.h : lastNonZeroHue}, ${Math.max(hsl.s, 20)}%, 50%) 50%, #ffffff 100%)`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] font-specimen-mono text-[var(--text-muted)] mt-1.5 uppercase">
              <span>{brightnessDirection === 'whiteToBlack' ? 'White (100% L*)' : 'Black (0% L*)'}</span>
              <button
                type="button"
                onClick={() => setBrightnessDirection(prev => prev === 'whiteToBlack' ? 'blackToWhite' : 'whiteToBlack')}
                className="text-[9px] hover:text-[var(--text-primary)] underline cursor-pointer transition-colors"
                title="Toggle bar direction"
              >
                Invert Bar
              </button>
              <span>{brightnessDirection === 'whiteToBlack' ? 'Black (0% L*)' : 'White (100% L*)'}</span>
            </div>
          </div>
        </div>

        {/* Right: Substrate Finish & Archival Modernist Specimens */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-[var(--bg-page)]">
          
          {/* Substrate Selector */}
          <div className="p-6 sm:p-8 hairline-b">
            <div className="text-[10px] uppercase tracking-widest font-specimen-mono text-[var(--text-faint)] mb-3">
              Substrate & Ink Carrier Specification
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'coated', name: 'Formula Coated (C)', desc: 'Offset gloss art paper • 150gsm' },
                { id: 'uncoated', name: 'Formula Uncoated (U)', desc: 'Matte cotton rag absorbency • 300gsm' },
                { id: 'cotton_tcx', name: 'FHI Cotton (TCX)', desc: 'Textile dye immersion on raw warp' },
                { id: 'metallic', name: 'Packaging Metallics', desc: 'Specular aluminum & bronze leaf' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => onSubstrateChange(sub.id as SubstrateType)}
                  className={`p-3 text-left border cursor-pointer transition-all ${
                    currentSubstrate === sub.id
                      ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-page)]'
                      : 'border-[var(--border-grid)] bg-[var(--bg-tile)] hover:border-[var(--text-muted)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="text-xs font-semibold uppercase font-specimen-mono">
                    {sub.name}
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5 leading-tight">
                    {sub.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Archival Modernist Presets */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-specimen-mono text-[var(--text-faint)] mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPresetTab('fhi')}
                  className={`cursor-pointer transition-colors ${presetTab === 'fhi' ? 'text-[var(--text-primary)] font-bold underline underline-offset-4' : 'hover:text-[var(--text-primary)]'}`}
                >
                  FHI Cotton TCX Icons
                </button>
                <span>•</span>
                <button
                  onClick={() => setPresetTab('formula')}
                  className={`cursor-pointer transition-colors ${presetTab === 'formula' ? 'text-[var(--text-primary)] font-bold underline underline-offset-4' : 'hover:text-[var(--text-primary)]'}`}
                >
                  Formula Guide Classics
                </button>
              </div>
              <span>2.6K+ DATASET</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(presetTab === 'fhi' ? FHI_ICONS_PRESETS : ARCHIVAL_PRESETS).map((p) => (
                <button
                  key={p.hex + p.label}
                  onClick={() => onColorChange(p.hex)}
                  className="p-2 border border-[var(--border-grid)] bg-[var(--bg-tile)] hover:border-[var(--text-primary)] text-left cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-specimen-mono text-[var(--text-faint)] truncate max-w-[70px]">
                      {p.label}
                    </span>
                    <div
                      className="w-3.5 h-3.5 border border-black/15 shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate mt-1">
                    {p.name}
                  </div>
                  <div className="text-[9px] font-specimen-mono text-[var(--text-muted)]">
                    {p.hex}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Micro Information Strip */}
          <div className="px-6 sm:px-8 py-3 bg-[var(--bg-stone)]/40 hairline-t flex items-center justify-between text-[10px] font-specimen-mono text-[var(--text-muted)]">
            <span>PRINTING PROCESS: SPOT COLOR / 4C PROCESS</span>
            <span>STANDARD: ISO 12647-2</span>
          </div>
        </div>
      </div>
    </section>
  );
};
