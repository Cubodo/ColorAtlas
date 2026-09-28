/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorRGB, ColorCMYK, ColorLAB, ColorHSL, PantoneSpecimen, ColorMatchResult } from '../types';

// Convert HEX string to RGB
export function hexToRgb(hex: string): ColorRGB {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) {
    return { r: 56, g: 52, b: 51 }; // default charcoal
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 56, g: 52, b: 51 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to 6-char HEX string
export function rgbToHex({ r, g, b }: ColorRGB): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert RGB to standard 4-color process CMYK (0-100)
export function rgbToCmyk({ r, g, b }: ColorRGB): ColorCMYK {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const kNorm = 1 - Math.max(rNorm, gNorm, bNorm);
  if (kNorm >= 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const cNorm = (1 - rNorm - kNorm) / (1 - kNorm);
  const mNorm = (1 - gNorm - kNorm) / (1 - kNorm);
  const yNorm = (1 - bNorm - kNorm) / (1 - kNorm);

  return {
    c: Math.round(cNorm * 100),
    m: Math.round(mNorm * 100),
    y: Math.round(yNorm * 100),
    k: Math.round(kNorm * 100),
  };
}

// Convert CMYK to RGB
export function cmykToRgb({ c, m, y, k }: ColorCMYK): ColorRGB {
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;

  const r = 255 * (1 - cNorm) * (1 - kNorm);
  const g = 255 * (1 - mNorm) * (1 - kNorm);
  const b = 255 * (1 - yNorm) * (1 - kNorm);

  return {
    r: Math.round(Math.max(0, Math.min(255, r))),
    g: Math.round(Math.max(0, Math.min(255, g))),
    b: Math.round(Math.max(0, Math.min(255, b))),
  };
}

// Convert RGB to HSL
export function rgbToHsl({ r, g, b }: ColorRGB): ColorHSL {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB
export function hslToRgb({ h, s, l }: ColorHSL): ColorRGB {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tAdj = t;
    if (tAdj < 0) tAdj += 1;
    if (tAdj > 1) tAdj -= 1;
    if (tAdj < 1 / 6) return p + (q - p) * 6 * tAdj;
    if (tAdj < 1 / 2) return q;
    if (tAdj < 2 / 3) return p + (q - p) * (2 / 3 - tAdj) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = hue2rgb(p, q, hNorm + 1 / 3);
  const g = hue2rgb(p, q, hNorm);
  const b = hue2rgb(p, q, hNorm - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Convert sRGB to CIE 1931 XYZ (D65 standard observer)
export function rgbToXyz({ r, g, b }: ColorRGB): { x: number; y: number; z: number } {
  let rN = r / 255;
  let gN = g / 255;
  let bN = b / 255;

  rN = rN > 0.04045 ? Math.pow((rN + 0.055) / 1.055, 2.4) : rN / 12.92;
  gN = gN > 0.04045 ? Math.pow((gN + 0.055) / 1.055, 2.4) : gN / 12.92;
  bN = bN > 0.04045 ? Math.pow((bN + 0.055) / 1.055, 2.4) : bN / 12.92;

  rN *= 100;
  gN *= 100;
  bN *= 100;

  // Observer: 2°, Illuminant: D65
  const x = rN * 0.4124564 + gN * 0.3575761 + bN * 0.1804375;
  const y = rN * 0.2126729 + gN * 0.7151522 + bN * 0.0721750;
  const z = rN * 0.0193339 + gN * 0.1191920 + bN * 0.9503041;

  return { x, y, z };
}

// Convert XYZ to CIE L*a*b*
export function xyzToLab({ x, y, z }: { x: number; y: number; z: number }): ColorLAB {
  // Reference white D65
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let xN = x / refX;
  let yN = y / refY;
  let zN = z / refZ;

  const f = (t: number) => (t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116));

  const fX = f(xN);
  const fY = f(yN);
  const fZ = f(zN);

  const l = Math.max(0, Math.min(100, (116 * fY) - 16));
  const a = 500 * (fX - fY);
  const b = 200 * (fY - fZ);

  return {
    l: Math.round(l * 10) / 10,
    a: Math.round(a * 10) / 10,
    b: Math.round(b * 10) / 10,
  };
}

export function rgbToLab(rgb: ColorRGB): ColorLAB {
  return xyzToLab(rgbToXyz(rgb));
}

// Convert CIE L*a*b* to XYZ (D65 standard observer)
export function labToXyz({ l, a, b }: ColorLAB): { x: number; y: number; z: number } {
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  const yVal = (l + 16) / 116;
  const xVal = a / 500 + yVal;
  const zVal = yVal - b / 200;

  const invF = (t: number) => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };

  return {
    x: invF(xVal) * refX,
    y: invF(yVal) * refY,
    z: invF(zVal) * refZ,
  };
}

// Convert XYZ to sRGB
export function xyzToRgb({ x, y, z }: { x: number; y: number; z: number }): ColorRGB {
  const xN = x / 100;
  const yN = y / 100;
  const zN = z / 100;

  let r = xN * 3.2406 + yN * -1.5372 + zN * -0.4986;
  let g = xN * -0.9689 + yN * 1.8758 + zN * 0.0415;
  let b = xN * 0.0557 + yN * -0.2040 + zN * 1.0570;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val * 255)));

  return {
    r: clamp(r),
    g: clamp(g),
    b: clamp(b),
  };
}

// Convert CIE L*a*b* directly to sRGB
export function labToRgb(lab: ColorLAB): ColorRGB {
  return xyzToRgb(labToXyz(lab));
}

// Convert CIE L*a*b* to HEX string
export function labToHex(lab: ColorLAB): string {
  return rgbToHex(labToRgb(lab));
}

// CIE76 Delta E
export function calculateDeltaE76(lab1: ColorLAB, lab2: ColorLAB): number {
  const dL = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// CIEDE2000 Delta E (Official Standard)
export function calculateDeltaE2000(lab1: ColorLAB, lab2: ColorLAB): number {
  const rad2deg = (rad: number) => (rad * 180) / Math.PI;
  const deg2rad = (deg: number) => (deg * Math.PI) / 180;

  const L1 = lab1.l;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.l;
  const a2 = lab2.a;
  const b2 = lab2.b;

  const avgL = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1Prime = a1 * (1 + G);
  const a2Prime = a2 * (1 + G);

  const C1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
  const C2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);
  const avgCPrime = (C1Prime + C2Prime) / 2;

  let h1Prime = rad2deg(Math.atan2(b1, a1Prime));
  if (h1Prime < 0) h1Prime += 360;

  let h2Prime = rad2deg(Math.atan2(b2, a2Prime));
  if (h2Prime < 0) h2Prime += 360;

  let diffHPrime = h2Prime - h1Prime;
  if (Math.abs(diffHPrime) > 180) {
    if (h2Prime <= h1Prime) diffHPrime += 360;
    else diffHPrime -= 360;
  }

  const deltaLPrime = L2 - L1;
  const deltaCPrime = C2Prime - C1Prime;
  const deltaHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin(deg2rad(diffHPrime / 2));

  let avgHPrime = (h1Prime + h2Prime) / 2;
  if (Math.abs(h1Prime - h2Prime) > 180) {
    if (h1Prime + h2Prime < 360) avgHPrime += 180;
    else avgHPrime -= 180;
  }

  const T =
    1 -
    0.17 * Math.cos(deg2rad(avgHPrime - 30)) +
    0.24 * Math.cos(deg2rad(2 * avgHPrime)) +
    0.32 * Math.cos(deg2rad(3 * avgHPrime + 6)) -
    0.20 * Math.cos(deg2rad(4 * avgHPrime - 63));

  const deltaTheta = 30 * Math.exp(-Math.pow((avgHPrime - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCPrime, 7) / (Math.pow(avgCPrime, 7) + Math.pow(25, 7)));
  const RT = -Math.sin(deg2rad(2 * deltaTheta)) * RC;

  const SL = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
  const SC = 1 + 0.045 * avgCPrime;
  const SH = 1 + 0.015 * avgCPrime * T;

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const dE = Math.sqrt(
    Math.pow(deltaLPrime / (kL * SL), 2) +
    Math.pow(deltaCPrime / (kC * SC), 2) +
    Math.pow(deltaHPrime / (kH * SH), 2) +
    RT * (deltaCPrime / (kC * SC)) * (deltaHPrime / (kH * SH))
  );

  return Math.round(dE * 100) / 100;
}

// Perceptual classification based on delta E (CIEDE2000)
export function getPerceptualRating(deltaE: number): 'Imperceptible' | 'Excellent Match' | 'Commercial Match' | 'Close Variant' {
  if (deltaE < 1.0) return 'Imperceptible';
  if (deltaE < 2.0) return 'Excellent Match';
  if (deltaE < 3.5) return 'Commercial Match';
  return 'Close Variant';
}

// Find closest matches
export function findClosestPantoneMatches(
  targetLab: ColorLAB,
  database: PantoneSpecimen[],
  limit = 12
): ColorMatchResult[] {
  const scored = database.map(specimen => {
    const deltaE = calculateDeltaE2000(targetLab, specimen.lab);
    const deltaE76 = calculateDeltaE76(targetLab, specimen.lab);
    // Score out of 100: ΔE 0 is 100%, ΔE 5 is 75%, ΔE 10 is 50%
    const matchScore = Math.max(0, Math.min(100, Math.round((100 - deltaE * 5.2) * 10) / 10));
    const perceptualRating = getPerceptualRating(deltaE);
    return {
      specimen,
      deltaE,
      deltaE76: Math.round(deltaE76 * 100) / 100,
      matchScore,
      perceptualRating,
    };
  });

  scored.sort((a, b) => a.deltaE - b.deltaE);
  return scored.slice(0, limit);
}

// Generate atmospheric blurred background style dynamically inspired by the reference image
export function generateAtmosphericArtwork(hex: string): {
  background: string;
  secondaryTone: string;
  deepTone: string;
  lightTone: string;
} {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  // Generate deep tonal compliment and ambient highlight
  // Similar to reference: deep petrol/teal navy transitioning into fiery vermilion / amber
  const analogHue = (hsl.h + 35) % 360;
  const contrastHue = (hsl.h + 180) % 360;

  const deepToneRgb = hslToRgb({ h: (contrastHue + 15) % 360, s: Math.min(65, hsl.s + 10), l: 12 });
  const secondaryToneRgb = hslToRgb({ h: analogHue, s: Math.min(90, hsl.s + 15), l: Math.max(30, hsl.l - 10) });
  const lightToneRgb = hslToRgb({ h: (hsl.h - 15 + 360) % 360, s: Math.min(95, hsl.s + 20), l: Math.min(82, hsl.l + 25) });

  const deepToneHex = rgbToHex(deepToneRgb);
  const secondaryToneHex = rgbToHex(secondaryToneRgb);
  const lightToneHex = rgbToHex(lightToneRgb);

  // Smooth, atmospheric blurred gradient with diffuse edges and soft transitions
  const background = `
    radial-gradient(ellipse 90% 70% at 75% 35%, ${hex} 0%, transparent 65%),
    radial-gradient(ellipse 80% 90% at 20% 70%, ${secondaryToneHex} 0%, transparent 70%),
    radial-gradient(circle 60% at 85% 85%, ${lightToneHex} 0%, transparent 60%),
    radial-gradient(circle 90% at 10% 10%, ${deepToneHex} 10%, #111111 85%)
  `.replace(/\s+/g, ' ').trim();

  return {
    background,
    secondaryTone: secondaryToneHex,
    deepTone: deepToneHex,
    lightTone: lightToneHex,
  };
}

// Get contrast text color (black or white)
export function getContrastTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  // ITU-R BT.709 relative luminance
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return lum > 0.52 ? '#111111' : '#F4F2EE';
}
