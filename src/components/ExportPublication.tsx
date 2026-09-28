/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PantoneSpecimen, ColorMatchResult } from '../types';
import { Copy, Check, Download, Code, FileText, Printer } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface ExportPublicationProps {
  activeSpecimen: PantoneSpecimen;
  matches: ColorMatchResult[];
  userHex: string;
}

export const ExportPublication: React.FC<ExportPublicationProps> = ({
  activeSpecimen,
  matches,
  userHex,
}) => {
  const [activeTab, setActiveTab] = useState<'css' | 'tailwind' | 'json'>('css');
  const [copied, setCopied] = useState(false);
  const [copiedPantone, setCopiedPantone] = useState(false);

  // CSS Custom Properties snippet
  const cssVariables = `:root {
  --color-active: ${userHex.toLowerCase()};
  --pantone-code: "${activeSpecimen.code}";
  --pantone-hex: ${activeSpecimen.hex.toLowerCase()};
  --pantone-rgb: ${activeSpecimen.rgb.r}, ${activeSpecimen.rgb.g}, ${activeSpecimen.rgb.b};
  --pantone-cmyk: ${activeSpecimen.cmyk.c}%, ${activeSpecimen.cmyk.m}%, ${activeSpecimen.cmyk.y}%, ${activeSpecimen.cmyk.k}%;
${matches.slice(1, 4).map((m, i) => `  --pantone-alt-0${i + 1}: ${m.specimen.hex.toLowerCase()}; /* ${m.specimen.code} */`).join('\n')}
}`;

  // Tailwind v4 @theme snippet
  const tailwindSnippet = `@theme {
  --color-brand-primary: ${activeSpecimen.hex.toLowerCase()};
  --color-brand-target: ${userHex.toLowerCase()};
${matches.slice(1, 4).map((m, i) => `  --color-brand-alt-0${i + 1}: ${m.specimen.hex.toLowerCase()};`).join('\n')}
}`;

  // JSON Design Tokens
  const jsonTokens = JSON.stringify({
    "target": { "hex": userHex },
    "pantone": {
      "code": activeSpecimen.code,
      "name": activeSpecimen.name,
      "hex": activeSpecimen.hex,
      "rgb": activeSpecimen.rgb,
      "cmyk": activeSpecimen.cmyk,
      "category": activeSpecimen.category
    },
    "closestMatches": matches.slice(1, 4).map(m => ({
      "code": m.specimen.code,
      "name": m.specimen.name,
      "hex": m.specimen.hex,
      "deltaE": m.deltaE
    }))
  }, null, 2);

  const currentSnippet = activeTab === 'css' ? cssVariables : activeTab === 'tailwind' ? tailwindSnippet : jsonTokens;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400">
  <rect width="320" height="400" fill="#FFFFFF" rx="0" />
  <rect x="20" y="20" width="280" height="260" fill="${activeSpecimen.hex}" rx="0" />
  <text x="24" y="320" font-family="-apple-system, sans-serif" font-size="20" font-weight="bold" fill="#111111">${activeSpecimen.code}</text>
  <text x="24" y="344" font-family="-apple-system, sans-serif" font-size="14" fill="#666666">${activeSpecimen.name}</text>
  <text x="24" y="372" font-family="monospace" font-size="12" fill="#888888">HEX ${activeSpecimen.hex} • RGB ${activeSpecimen.rgb.r}, ${activeSpecimen.rgb.g}, ${activeSpecimen.rgb.b}</text>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSpecimen.code.replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)] relative overflow-hidden" id="export-blocks">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-3 bg-[var(--text-primary)] inline-block"></span>
              <span className="text-[11px] font-specimen-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                Design Handover // 05
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              Export Color Tokens
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Ready-to-use variables, design tokens, and vector swatch cards
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <MagneticButton
              onClick={() => {
                navigator.clipboard.writeText(activeSpecimen.code);
                setCopiedPantone(true);
                setTimeout(() => setCopiedPantone(false), 1800);
              }}
              className="px-3.5 py-1.5 rounded-none bg-[var(--text-primary)] hover:opacity-95 text-xs font-specimen-mono text-[var(--bg-page)] font-bold cursor-pointer shadow-xs transition-opacity"
              magneticStrength={0.25}
              title={`Copy ${activeSpecimen.code} directly`}
            >
              <span className="flex items-center gap-1.5">
                {copiedPantone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied {activeSpecimen.code}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy {activeSpecimen.code}</span>
                  </>
                )}
              </span>
            </MagneticButton>

            <MagneticButton
              onClick={handleDownloadSvg}
              className="px-3.5 py-1.5 rounded-none border border-[var(--border-grid)] bg-[var(--bg-tile)] hover:border-[var(--text-primary)] text-xs font-specimen-mono text-[var(--text-primary)] cursor-pointer shadow-xs transition-colors"
              magneticStrength={0.25}
            >
              <span className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>SVG Chip</span>
              </span>
            </MagneticButton>

            <MagneticButton
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-none border border-[var(--border-grid)] bg-[var(--bg-tile)] hover:border-[var(--text-primary)] text-xs font-specimen-mono text-[var(--text-primary)] cursor-pointer shadow-xs transition-colors"
              magneticStrength={0.25}
            >
              <span className="flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Proof</span>
              </span>
            </MagneticButton>
          </div>
        </div>

        {/* Code Snippet Box with smooth tab transitions */}
        <div className="rounded-none bg-[var(--bg-tile)] border border-[var(--border-grid)] overflow-hidden shadow-xs">
          {/* Tabs bar */}
          <div className="px-5 py-3 hairline-b flex items-center justify-between bg-[var(--bg-stone)]/20">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'css', label: 'CSS Variables' },
                { id: 'tailwind', label: 'Tailwind CSS' },
                { id: 'json', label: 'JSON Tokens' },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative px-3 py-1 rounded-none text-xs font-specimen-mono cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? 'text-[var(--bg-page)] font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="exportTabActive"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute inset-0 bg-[var(--text-primary)] shadow-xs z-0"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <MagneticButton
              onClick={handleCopy}
              className="px-3 py-1 rounded-none bg-[var(--text-primary)] text-[var(--bg-page)] text-xs font-specimen-mono cursor-pointer hover:opacity-95 shadow-xs"
              magneticStrength={0.25}
            >
              <span className="flex items-center gap-1.5">
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-1 text-emerald-400 font-bold"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </MagneticButton>
          </div>

          {/* Code Viewer with subtle crossfade on tab switch */}
          <div className="relative overflow-hidden bg-[var(--bg-page)]/40">
            <AnimatePresence mode="wait">
              <motion.pre
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="p-5 text-xs font-specimen-mono text-[var(--text-primary)] overflow-x-auto whitespace-pre leading-relaxed"
              >
                {currentSnippet}
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
};
