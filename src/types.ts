/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubstrateType = 'coated' | 'uncoated' | 'cotton_tcx' | 'metallic';

export interface ColorRGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface ColorCMYK {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export interface ColorLAB {
  l: number; // 0-100
  a: number; // -128 to 127
  b: number; // -128 to 127
}

export interface ColorHSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface PantoneSpecimen {
  code: string;         // e.g. "Pantone 1655 C"
  name: string;         // e.g. "Bright Tangerine"
  category: 'formula_coated' | 'formula_uncoated' | 'fhi_tcx' | 'metallics' | 'pastels';
  hex: string;
  rgb: ColorRGB;
  cmyk: ColorCMYK;
  lab: ColorLAB;
  substrate: SubstrateType;
  yearIntroduced?: number;
  collectionRef?: string;
  description?: string;
}

export interface ColorMatchResult {
  specimen: PantoneSpecimen;
  deltaE: number;       // CIEDE2000
  deltaE76: number;     // CIE76
  matchScore: number;   // 0 - 100%
  perceptualRating: 'Imperceptible' | 'Excellent Match' | 'Commercial Match' | 'Close Variant';
}

export interface PaletteStudy {
  id: string;
  title: string;
  subtitle: string;
  specimens: PantoneSpecimen[];
  ratio: number[];      // Visual weight ratios (e.g. [50, 25, 15, 10])
  dateCreated: string;
  curatorNotes?: string;
}

export type ThemeMode = 'dark' | 'light';

export type ActiveSection = 'archive' | 'specimens' | 'palettes' | 'export' | 'photo';

