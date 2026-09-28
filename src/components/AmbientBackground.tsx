/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from '../utils/colorScience';

interface AmbientBackgroundProps {
  currentColorHex: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ currentColorHex }) => {
  // Derive a harmonious secondary ambient color (shifted hue)
  const secondaryColorHex = useMemo(() => {
    try {
      const rgb = hexToRgb(currentColorHex);
      const hsl = rgbToHsl(rgb);
      const shiftedHue = (hsl.h + 35) % 360;
      const secondaryRgb = hslToRgb({ h: shiftedHue, s: Math.max(30, hsl.s * 0.8), l: Math.min(65, Math.max(35, hsl.l)) });
      return rgbToHex(secondaryRgb);
    } catch {
      return '#3b82f6';
    }
  }, [currentColorHex]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
      {/* 1. Primary Continuous Floating Chromatic Orb */}
      <motion.div
        animate={{
          x: [0, 45, -35, 20, 0],
          y: [0, -40, 25, -20, 0],
          scale: [1, 1.12, 0.95, 1.08, 1],
          opacity: [0.12, 0.18, 0.13, 0.19, 0.12],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle, ${currentColorHex} 0%, transparent 68%)`,
        }}
        className="absolute -top-[12%] -right-[8%] w-[580px] h-[580px] sm:w-[720px] sm:h-[720px] rounded-full blur-3xl filter transform-gpu will-change-transform"
      />

      {/* 2. Secondary Ambient Floating Hue Orb */}
      <motion.div
        animate={{
          x: [0, -50, 40, -25, 0],
          y: [0, 50, -30, 40, 0],
          scale: [1, 0.94, 1.14, 0.98, 1],
          opacity: [0.08, 0.14, 0.09, 0.15, 0.08],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        style={{
          background: `radial-gradient(circle, ${secondaryColorHex} 0%, transparent 70%)`,
        }}
        className="absolute top-[35%] -left-[10%] w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] rounded-full blur-3xl filter transform-gpu will-change-transform"
      />

      {/* 3. Lower Horizon Subtle Glow */}
      <motion.div
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(ellipse at center, ${currentColorHex} 0%, transparent 72%)`,
        }}
        className="absolute bottom-[-15%] right-[20%] w-[600px] h-[450px] rounded-full blur-3xl filter transform-gpu"
      />

      {/* Architectural Subtle Registration Crosshairs drifting at slow pace */}
      <div className="absolute inset-0 opacity-20 dark:opacity-15">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-24 left-10 text-[9px] font-specimen-mono text-[var(--text-faint)] tracking-widest hidden lg:block"
        >
          + 47°22'N 08°32'E
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-32 right-12 text-[9px] font-specimen-mono text-[var(--text-faint)] tracking-widest hidden lg:block"
        >
          REF. ISO-12647-2 +
        </motion.div>
      </div>
    </div>
  );
};
