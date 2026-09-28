/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PaletteStudy, PantoneSpecimen } from '../types';
import { PANTONE_DATABASE } from './pantoneDatabase';
import {
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  findClosestPantoneMatches,
  rgbToCmyk,
} from '../utils/colorScience';

// Helper to find an authentic Pantone specimen corresponding to given HSL coordinates
function findSpecimenForHsl(
  h: number,
  s: number,
  l: number,
  database: PantoneSpecimen[],
  excludeCodes: string[] = []
): PantoneSpecimen {
  const normH = ((h % 360) + 360) % 360;
  const targetRgb = hslToRgb({
    h: normH,
    s: Math.max(0, Math.min(100, s)),
    l: Math.max(0, Math.min(100, l)),
  });
  const targetLab = rgbToLab(targetRgb);
  const matches = findClosestPantoneMatches(targetLab, database, 8);
  const candidate = matches.find(m => !excludeCodes.includes(m.specimen.code));
  return candidate ? candidate.specimen : matches[0]?.specimen || database[0];
}

/**
 * Dynamically generates 6 curated color harmonies anchored directly
 * on the user's selected hex code and active specimen.
 */
export function generateCuratedPaletteStudies(
  currentColorHex: string,
  activeSpecimen: PantoneSpecimen,
  database: PantoneSpecimen[] = PANTONE_DATABASE
): PaletteStudy[] {
  const rgb = hexToRgb(currentColorHex);
  const hsl = rgbToHsl(rgb);

  // The selected color swatch as the anchor
  const leadSpecimen: PantoneSpecimen = {
    code: activeSpecimen?.code || 'Selected Hex',
    name: activeSpecimen?.name || 'Selected Color',
    hex: currentColorHex.toUpperCase(),
    rgb,
    cmyk: rgbToCmyk(rgb),
    lab: rgbToLab(rgb),
    category: activeSpecimen?.category || 'formula_coated',
    substrate: activeSpecimen?.substrate || 'coated',
  };

  const codeLead = leadSpecimen.code;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  // Study 01: Complementary Contrast (180 deg)
  const comp = findSpecimenForHsl(hsl.h + 180, Math.max(45, hsl.s), hsl.l, database, [codeLead]);
  const darkAnchor = findSpecimenForHsl(hsl.h + 195, 35, 14, database, [codeLead, comp.code]);
  const lightGround = findSpecimenForHsl(hsl.h + 20, 15, 92, database, [codeLead, comp.code, darkAnchor.code]);

  // Study 02: Analogous Chromatic Progression (Adjacent 32 deg)
  const analog1 = findSpecimenForHsl(hsl.h + 32, Math.min(95, hsl.s + 8), Math.min(75, hsl.l + 5), database, [codeLead]);
  const analog2 = findSpecimenForHsl(hsl.h - 32, Math.max(25, hsl.s - 5), Math.max(28, hsl.l - 8), database, [codeLead, analog1.code]);
  const analogMuted = findSpecimenForHsl(hsl.h, 20, 86, database, [codeLead, analog1.code, analog2.code]);

  // Study 03: Split-Complementary Architectural Tension (150 deg & 210 deg)
  const split1 = findSpecimenForHsl(hsl.h + 150, Math.min(85, hsl.s + 5), hsl.l, database, [codeLead]);
  const split2 = findSpecimenForHsl(hsl.h + 210, Math.min(85, hsl.s + 5), hsl.l, database, [codeLead, split1.code]);
  const deepShadow = findSpecimenForHsl(hsl.h + 180, 22, 16, database, [codeLead, split1.code, split2.code]);

  // Study 04: Monochromatic Tonal Hierarchy
  const monoDeep = findSpecimenForHsl(hsl.h, Math.min(100, hsl.s + 15), Math.max(16, hsl.l - 26), database, [codeLead]);
  const monoSoft = findSpecimenForHsl(hsl.h, Math.max(20, hsl.s - 25), Math.min(90, hsl.l + 22), database, [codeLead, monoDeep.code]);
  const monoBlack = findSpecimenForHsl(hsl.h, 10, 12, database, [codeLead, monoDeep.code, monoSoft.code]);

  // Study 05: Modernist Triad Balance (120 deg & 240 deg)
  const triad1 = findSpecimenForHsl(hsl.h + 120, Math.min(90, hsl.s), hsl.l, database, [codeLead]);
  const triad2 = findSpecimenForHsl(hsl.h + 240, Math.min(90, hsl.s), hsl.l, database, [codeLead, triad1.code]);
  const triadNeutral = findSpecimenForHsl(hsl.h + 60, 14, 91, database, [codeLead, triad1.code, triad2.code]);

  // Study 06: Earth & Mineral Materiality
  const rawTerra = findSpecimenForHsl(28, 55, 38, database, [codeLead]);
  const travertine = findSpecimenForHsl(38, 22, 84, database, [codeLead, rawTerra.code]);
  const darkBasalt = findSpecimenForHsl(210, 18, 18, database, [codeLead, rawTerra.code, travertine.code]);

  return [
    {
      id: 'dynamic-study-01',
      title: 'Study 01 — Complementary Contrast',
      subtitle: `Direct 180° Complementary Harmony • ${currentColorHex}`,
      ratio: [45, 25, 15, 15],
      dateCreated: today,
      curatorNotes: `Direct chromatic vibration centering ${codeLead} (${currentColorHex}) against its complementary counterpart with deep obsidian and travertine anchors.`,
      specimens: [leadSpecimen, comp, darkAnchor, lightGround],
    },
    {
      id: 'dynamic-study-02',
      title: 'Study 02 — Analogous Horizon',
      subtitle: `Adjacent 30° Spectral Progression • ${currentColorHex}`,
      ratio: [40, 30, 20, 10],
      dateCreated: today,
      curatorNotes: `Cohesive sequential flow transitioning from ${codeLead} into neighbouring spectral hues for fluid editorial rhythm.`,
      specimens: [leadSpecimen, analog1, analog2, analogMuted],
    },
    {
      id: 'dynamic-study-03',
      title: 'Study 03 — Split-Complementary Tension',
      subtitle: `Geometric 150° / 210° Dual Balance • ${currentColorHex}`,
      ratio: [45, 25, 20, 10],
      dateCreated: today,
      curatorNotes: `Nuanced chromatic equilibrium flanking the direct complement with high-chroma dual accents and deep grounding tone.`,
      specimens: [leadSpecimen, split1, split2, deepShadow],
    },
    {
      id: 'dynamic-study-04',
      title: 'Study 04 — Monochromatic Tonality',
      subtitle: `Lightness & Saturation Cascade • ${currentColorHex}`,
      ratio: [40, 25, 20, 15],
      dateCreated: today,
      curatorNotes: `Subtle single-hue gradation displaying the full lightness range and tonal depth of ${codeLead}.`,
      specimens: [leadSpecimen, monoDeep, monoSoft, monoBlack],
    },
    {
      id: 'dynamic-study-05',
      title: 'Study 05 — Modernist Triad',
      subtitle: `Equilateral 120° Triadic Balance • ${currentColorHex}`,
      ratio: [40, 25, 20, 15],
      dateCreated: today,
      curatorNotes: `Bauhaus three-point spectral equilibrium anchoring ${codeLead} with equidistant high-contrast companions.`,
      specimens: [leadSpecimen, triad1, triad2, triadNeutral],
    },
    {
      id: 'dynamic-study-06',
      title: 'Study 06 — Earth & Mineral Materiality',
      subtitle: `Architectural Material Specification • ${currentColorHex}`,
      ratio: [45, 25, 15, 15],
      dateCreated: today,
      curatorNotes: `Architectural specification grounding ${codeLead} against quarried stone, terracotta ceramic, and dark basalt.`,
      specimens: [leadSpecimen, rawTerra, travertine, darkBasalt],
    },
  ];
}

export const INITIAL_PALETTE_STUDIES: PaletteStudy[] = generateCuratedPaletteStudies(
  '#FA5B0F',
  PANTONE_DATABASE[0]
);
