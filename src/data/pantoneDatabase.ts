/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PantoneSpecimen } from '../types';
import { hexToRgb, rgbToCmyk, rgbToLab } from '../utils/colorScience';

import fhiPart1 from './fhi_part1.json';
import fhiPart2 from './fhi_part2.json';
import fhiPart3 from './fhi_part3.json';
import fhiPart4 from './fhi_part4.json';
import fhiPart5 from './fhi_part5.json';
import fhiPart6 from './fhi_part6.json';
import fhiPart7 from './fhi_part7.json';
import fhiPart8 from './fhi_part8.json';
import fhiPart9 from './fhi_part9.json';
import fhiPart10 from './fhi_part10.json';
import fhiPart11 from './fhi_part11.json';
import pantoneCoatedList from './pantone_coated.json';

interface RawSpecimen {
  code: string;
  name: string;
  category: 'formula_coated' | 'formula_uncoated' | 'fhi_tcx' | 'metallics' | 'pastels';
  hex: string;
  substrate: 'coated' | 'uncoated' | 'cotton_tcx' | 'metallic';
  yearIntroduced?: number;
  collectionRef?: string;
  description?: string;
}

const RAW_PANTONE_SPECIMENS: RawSpecimen[] = [
  // 1. Vermilion, Oranges & Cadmiums (Prominent in Swiss & Reference imagery)
  {
    code: 'Pantone 1655 C',
    name: 'Cadmium Tangerine',
    category: 'formula_coated',
    hex: '#FA5B0F',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Vivid high-chroma international vermilion standard for modernist graphic identity.',
  },
  {
    code: 'Pantone 1655 U',
    name: 'Cadmium Tangerine Matte',
    category: 'formula_uncoated',
    hex: '#E85B20',
    substrate: 'uncoated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Uncoated',
    description: 'Absorbed fiber edition with warm matte paper texture.',
  },
  {
    code: 'Pantone 021 C',
    name: 'Pantone Orange 021',
    category: 'formula_coated',
    hex: '#FE5000',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Foundational baseline spot color formulated with pure monoazo orange pigment.',
  },
  {
    code: 'Pantone 172 C',
    name: 'Fiery Vermilion',
    category: 'formula_coated',
    hex: '#FA4616',
    substrate: 'coated',
    yearIntroduced: 1968,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'High energy industrial red-orange with clean D65 reflectance peak at 610nm.',
  },
  {
    code: 'Pantone 1585 C',
    name: 'Persimmon Ember',
    category: 'formula_coated',
    hex: '#FF6A13',
    substrate: 'coated',
    yearIntroduced: 1984,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Warm glowing amber-orange with subtle ochre undertones.',
  },
  {
    code: 'Pantone 1797 C',
    name: 'Swiss Red',
    category: 'formula_coated',
    hex: '#CB333B',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Classic Swiss Style typographic red, emblematic of mid-century Zurich posters.',
  },
  {
    code: 'Pantone 186 C',
    name: 'Crimson Standard',
    category: 'formula_coated',
    hex: '#C8102E',
    substrate: 'coated',
    yearIntroduced: 1972,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Universal benchmark corporate red with disciplined neutrality.',
  },
  {
    code: 'Pantone 200 C',
    name: 'Imperial Carmine',
    category: 'formula_coated',
    hex: '#BA0C2F',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Deep mineral red with blue undertones.',
  },
  {
    code: 'Pantone 18-1442 TCX',
    name: 'Terracotta Architectural',
    category: 'fhi_tcx',
    hex: '#A05244',
    substrate: 'cotton_tcx',
    yearIntroduced: 2002,
    collectionRef: 'Fashion, Home + Interiors',
    description: 'Fired earth pigment formulated for architectural ceramics and woven linens.',
  },

  // 2. Oceanic Blues, Petrol & Deep Teals (Reference Gradient counter-tones)
  {
    code: 'Pantone 2965 C',
    name: 'Deep Petrol Teal',
    category: 'formula_coated',
    hex: '#00263E',
    substrate: 'coated',
    yearIntroduced: 1978,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Subterranean oceanic navy with diffuse cyan undertone, anchoring atmospheric layouts.',
  },
  {
    code: 'Pantone 548 C',
    name: 'Baltic Slate Blue',
    category: 'formula_coated',
    hex: '#003A4D',
    substrate: 'coated',
    yearIntroduced: 1986,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Atmospheric Nordic coastal tint with mineral depth.',
  },
  {
    code: 'Pantone 303 C',
    name: 'Midnight Prussian',
    category: 'formula_coated',
    hex: '#002B49',
    substrate: 'coated',
    yearIntroduced: 1968,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Heavy architectural indigo with low reflectance and velvet absorption.',
  },
  {
    code: 'Pantone 7469 C',
    name: 'Modernist Cyan',
    category: 'formula_coated',
    hex: '#006272',
    substrate: 'coated',
    yearIntroduced: 2000,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Balanced bridge between cerulean and viridian, favoured in editorial spreads.',
  },
  {
    code: 'Pantone 321 C',
    name: 'Nordic Seafoam Deep',
    category: 'formula_coated',
    hex: '#00857C',
    substrate: 'coated',
    yearIntroduced: 1975,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Clear marine emerald with crisp daylight readability.',
  },
  {
    code: 'Pantone 286 C',
    name: 'International Cobalt',
    category: 'formula_coated',
    hex: '#0032A0',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'High-purity sapphire blue derived from copper phthalocyanine.',
  },
  {
    code: 'Pantone 19-4052 TCX',
    name: 'Classic Navy Specimen',
    category: 'fhi_tcx',
    hex: '#0F4C81',
    substrate: 'cotton_tcx',
    yearIntroduced: 2020,
    collectionRef: 'Fashion, Home + Interiors',
    description: 'Pantone Color of the Year 2020; enduring timeless twilight hue.',
  },
  {
    code: 'Pantone 540 C',
    name: 'Nocturne Indigo',
    category: 'formula_coated',
    hex: '#003057',
    substrate: 'coated',
    yearIntroduced: 1970,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Severe, formal corporate blue tailored for authoritative annual reports.',
  },

  // 3. Architectural Stones, Warm Off-Whites & Swiss Neutrals (from spec palette)
  {
    code: 'Pantone 7527 C',
    name: 'Warm Off White',
    category: 'formula_coated',
    hex: '#F2F0EB',
    substrate: 'coated',
    yearIntroduced: 2005,
    collectionRef: 'Architectural Neutrals',
    description: 'Signature background tone: calico, bleached unwashed cotton, and raw limestone.',
  },
  {
    code: 'Pantone 7534 C',
    name: 'Light Stone Specimen',
    category: 'formula_coated',
    hex: '#D9D5CF',
    substrate: 'coated',
    yearIntroduced: 2005,
    collectionRef: 'Architectural Neutrals',
    description: 'Cast concrete and cut Portland stone with zero chromatic bias.',
  },
  {
    code: 'Pantone 419 C',
    name: 'Charcoal Architectural',
    category: 'formula_coated',
    hex: '#383433',
    substrate: 'coated',
    yearIntroduced: 1980,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Warm carbon pigment, softer than pure black, ideal for modernist body text.',
  },
  {
    code: 'Pantone Black 6 C',
    name: 'Deep Archival Black',
    category: 'formula_coated',
    hex: '#111111',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Dense lampblack with subtle cool absorption for absolute contrast.',
  },
  {
    code: 'Pantone Warm Gray 1 C',
    name: 'Warm Gray 01',
    category: 'formula_coated',
    hex: '#E5E1DD',
    substrate: 'coated',
    yearIntroduced: 1974,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Feather-light warm neutral for subtle architectural framing.',
  },
  {
    code: 'Pantone Warm Gray 4 C',
    name: 'Warm Gray 04',
    category: 'formula_coated',
    hex: '#BCB4AB',
    substrate: 'coated',
    yearIntroduced: 1974,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Muted travertine with gentle clay undertones.',
  },
  {
    code: 'Pantone Warm Gray 8 C',
    name: 'Warm Gray 08',
    category: 'formula_coated',
    hex: '#8C827A',
    substrate: 'coated',
    yearIntroduced: 1974,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Aged pewter and untreated cedar weathering tone.',
  },
  {
    code: 'Pantone Cool Gray 2 C',
    name: 'Cool Gray 02',
    category: 'formula_coated',
    hex: '#D0D0CE',
    substrate: 'coated',
    yearIntroduced: 1974,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Precision milled aluminum tone with faint bluish overcast.',
  },
  {
    code: 'Pantone Cool Gray 9 C',
    name: 'Cool Gray 09',
    category: 'formula_coated',
    hex: '#53565A',
    substrate: 'coated',
    yearIntroduced: 1974,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Brutalist slate gray used in engineering manuals and architectural drafting.',
  },
  {
    code: 'Pantone Cool Gray 11 C',
    name: 'Cool Gray 11',
    category: 'formula_coated',
    hex: '#27251F',
    substrate: 'coated',
    yearIntroduced: 1974,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Deep obsidian matrix, providing rigorous structural foundation.',
  },

  // 4. Botanical, Mineral & Viridian
  {
    code: 'Pantone 5535 C',
    name: 'Forest Canopy Deep',
    category: 'formula_coated',
    hex: '#183028',
    substrate: 'coated',
    yearIntroduced: 1988,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Subdued coniferous spruce green with profound shadow presence.',
  },
  {
    code: 'Pantone 3435 C',
    name: 'Evergreen Specimen',
    category: 'formula_coated',
    hex: '#154734',
    substrate: 'coated',
    yearIntroduced: 1978,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Standard institutional botanical green with archival stability.',
  },
  {
    code: 'Pantone 562 C',
    name: 'Oxidized Copper',
    category: 'formula_coated',
    hex: '#006B54',
    substrate: 'coated',
    yearIntroduced: 1982,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Weathered copper verdigris found in architectural cupolas and historic roofs.',
  },
  {
    code: 'Pantone 5773 C',
    name: 'Dry Sage Specimen',
    category: 'formula_coated',
    hex: '#9A9C82',
    substrate: 'coated',
    yearIntroduced: 1995,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Muted botanical olive with gray powder finish.',
  },
  {
    code: 'Pantone 7496 C',
    name: 'Golden Moss',
    category: 'formula_coated',
    hex: '#8D9B4A',
    substrate: 'coated',
    yearIntroduced: 2002,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Chroma-rich chartreuse lichen on granite boulders.',
  },

  // 5. Ochre, Solar Yellows & Amber
  {
    code: 'Pantone 123 C',
    name: 'Golden Ochre',
    category: 'formula_coated',
    hex: '#FFC72C',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Classic cadmium warm yellow found in Bauhaus poster typography.',
  },
  {
    code: 'Pantone 109 C',
    name: 'Lemon Primrose',
    category: 'formula_coated',
    hex: '#FFD100',
    substrate: 'coated',
    yearIntroduced: 1963,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Luminous high-frequency spectral yellow for caution and geometric accents.',
  },
  {
    code: 'Pantone 137 C',
    name: 'Marigold Amber',
    category: 'formula_coated',
    hex: '#FFA300',
    substrate: 'coated',
    yearIntroduced: 1970,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Sun-drenched honey yellow with rich organic body.',
  },
  {
    code: 'Pantone 144 C',
    name: 'Raw Saffron',
    category: 'formula_coated',
    hex: '#ED8B00',
    substrate: 'coated',
    yearIntroduced: 1970,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Traditional spice pigment bridging deep gold and primary orange.',
  },

  // 6. Architectural Earth, Terracotta, Sienna & Sand
  {
    code: 'Pantone 469 C',
    name: 'Raw Umber Stone',
    category: 'formula_coated',
    hex: '#603D20',
    substrate: 'coated',
    yearIntroduced: 1972,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Earth pigment containing natural iron and manganese oxide.',
  },
  {
    code: 'Pantone 7575 C',
    name: 'Venetian Clay',
    category: 'formula_coated',
    hex: '#B85338',
    substrate: 'coated',
    yearIntroduced: 2005,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Sunbaked canal brickwork in historic Italian architecture.',
  },
  {
    code: 'Pantone 7515 C',
    name: 'Burnt Sienna',
    category: 'formula_coated',
    hex: '#A15D48',
    substrate: 'coated',
    yearIntroduced: 2005,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Calcined natural earth yielding warm reddish-brown glaze.',
  },
  {
    code: 'Pantone 7506 C',
    name: 'Ivory Vellum',
    category: 'formula_coated',
    hex: '#F4DEB3',
    substrate: 'coated',
    yearIntroduced: 2005,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Handmade rag paper and parchment tone with delicate wheat hue.',
  },

  // 7. Violet, Tyrian & Iris
  {
    code: 'Pantone 2685 C',
    name: 'Deep Tyrian Violet',
    category: 'formula_coated',
    hex: '#330072',
    substrate: 'coated',
    yearIntroduced: 1976,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Monastic purple with high pigment density and solemn presence.',
  },
  {
    code: 'Pantone 519 C',
    name: 'Aubergine Specimen',
    category: 'formula_coated',
    hex: '#582C4D',
    substrate: 'coated',
    yearIntroduced: 1984,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Smoky blackened plum, prized in luxury textile and binding cloth.',
  },
  {
    code: 'Pantone 7678 C',
    name: 'Iris Lavender',
    category: 'formula_coated',
    hex: '#6A6588',
    substrate: 'coated',
    yearIntroduced: 2010,
    collectionRef: 'Formula Guide Solid Coated',
    description: 'Architectural mineral lilac with grey particulate overcast.',
  },

  // 8. Metallics & Specialty Architectural Finishes
  {
    code: 'Pantone 877 C',
    name: 'Silver Leaf Metallic',
    category: 'metallics',
    hex: '#8A8D8F',
    substrate: 'metallic',
    yearIntroduced: 1980,
    collectionRef: 'Packaging Metallics',
    description: 'Coarse leafing aluminum flake pigment with microscopic specular highlight.',
  },
  {
    code: 'Pantone 871 C',
    name: 'Pale Gold Bronzing',
    category: 'metallics',
    hex: '#86724E',
    substrate: 'metallic',
    yearIntroduced: 1980,
    collectionRef: 'Packaging Metallics',
    description: 'Fine bronze alloy powder suspended in archival linseed varnish.',
  },
  {
    code: 'Pantone 876 C',
    name: 'Copper Specular',
    category: 'metallics',
    hex: '#8C5A42',
    substrate: 'metallic',
    yearIntroduced: 1984,
    collectionRef: 'Packaging Metallics',
    description: 'Warm reflective copper leafing ink formulated for embossed book spines.',
  },

  // 9. Pastels & Soft Chromatics
  {
    code: 'Pantone 9160 C',
    name: 'Celadon Celadon',
    category: 'pastels',
    hex: '#E5EDE5',
    substrate: 'coated',
    yearIntroduced: 2008,
    collectionRef: 'Pastels & Neons',
    description: 'Song dynasty ceramic glaze tone with pale jade whisper.',
  },
  {
    code: 'Pantone 9280 C',
    name: 'Dusty Rose Porcelain',
    category: 'pastels',
    hex: '#F2DFDD',
    substrate: 'coated',
    yearIntroduced: 2008,
    collectionRef: 'Pastels & Neons',
    description: 'Faint blush of crushed quartz and zinc white pigment.',
  },
  {
    code: 'Pantone 9040 C',
    name: 'Chalk White Whisper',
    category: 'pastels',
    hex: '#F3F4F1',
    substrate: 'coated',
    yearIntroduced: 2008,
    collectionRef: 'Pastels & Neons',
    description: 'Barely perceptible tinted white with limestone undertone.',
  },
];

function formatPantoneName(rawName: string): string {
  return rawName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Convert all FHI JSON datasets into RawSpecimens
const fhiDatasets: Record<string, { name: string; hex: string }>[] = [
  fhiPart1 as Record<string, { name: string; hex: string }>,
  fhiPart2 as Record<string, { name: string; hex: string }>,
  fhiPart3 as Record<string, { name: string; hex: string }>,
  fhiPart4 as Record<string, { name: string; hex: string }>,
  fhiPart5 as Record<string, { name: string; hex: string }>,
  fhiPart6 as Record<string, { name: string; hex: string }>,
  fhiPart7 as Record<string, { name: string; hex: string }>,
  fhiPart8 as Record<string, { name: string; hex: string }>,
  fhiPart9 as Record<string, { name: string; hex: string }>,
  fhiPart10 as Record<string, { name: string; hex: string }>,
  fhiPart11 as Record<string, { name: string; hex: string }>,
];

interface CoatedRawItem {
  code: string;
  hex: string;
  l: number;
  a: number;
  b: number;
}

const seenCodes = new Set<string>();
RAW_PANTONE_SPECIMENS.forEach(s => seenCodes.add(s.code.toUpperCase()));

// 1. Curated baseline specimens (with human descriptions and iconic formulations)
const curatedSpecimens: PantoneSpecimen[] = RAW_PANTONE_SPECIMENS.map(raw => {
  const rgb = hexToRgb(raw.hex);
  const cmyk = rgbToCmyk(rgb);
  const lab = rgbToLab(rgb);
  return {
    ...raw,
    rgb,
    cmyk,
    lab,
  };
});

// 2. Comprehensive Pantone Solid Coated Master Library (2,715 official spectrophotometric formulations)
const coatedSpecimens: PantoneSpecimen[] = [];
for (const entry of (pantoneCoatedList as CoatedRawItem[])) {
  const codeUpper = entry.code.toUpperCase();
  if (!seenCodes.has(codeUpper)) {
    seenCodes.add(codeUpper);
    const rgb = hexToRgb(entry.hex);
    const cmyk = rgbToCmyk(rgb);
    coatedSpecimens.push({
      code: entry.code,
      name: entry.code,
      category: 'formula_coated',
      substrate: 'coated',
      hex: entry.hex,
      rgb,
      cmyk,
      lab: { l: entry.l, a: entry.a, b: entry.b },
      collectionRef: 'Pantone Formula Guide Solid Coated',
      description: 'Pantone Formula Guide Solid Coated spot color standard for graphic arts and packaging.',
    });
  }
}

// 3. Fashion, Home + Interiors (TCX Cotton)
const fhiSpecimens: PantoneSpecimen[] = [];
for (const dataset of fhiDatasets) {
  for (const [codeKey, data] of Object.entries(dataset)) {
    const code = `Pantone ${codeKey} TCX`;
    const codeUpper = code.toUpperCase();
    if (!seenCodes.has(codeUpper)) {
      seenCodes.add(codeUpper);
      const cleanHex = (data.hex.startsWith('#') ? data.hex : `#${data.hex}`).toUpperCase();
      const rgb = hexToRgb(cleanHex);
      const cmyk = rgbToCmyk(rgb);
      const lab = rgbToLab(rgb);
      fhiSpecimens.push({
        code,
        name: formatPantoneName(data.name),
        category: 'fhi_tcx',
        hex: cleanHex,
        rgb,
        cmyk,
        lab,
        substrate: 'cotton_tcx',
        collectionRef: 'Fashion, Home + Interiors (TCX)',
        description: 'Pantone Fashion, Home + Interiors cotton standard for textile and industrial finish.',
      });
    }
  }
}

// Full combined calibrated database
export const PANTONE_DATABASE: PantoneSpecimen[] = [
  ...curatedSpecimens,
  ...coatedSpecimens,
  ...fhiSpecimens,
];

export const FHI_SPECIMENS = PANTONE_DATABASE.filter(s => s.category === 'fhi_tcx');
export const FORMULA_COATED_SPECIMENS = PANTONE_DATABASE.filter(s => s.category === 'formula_coated');
export const FORMULA_UNCOATED_SPECIMENS = PANTONE_DATABASE.filter(s => s.category === 'formula_uncoated');
export const PASTEL_SPECIMENS = PANTONE_DATABASE.filter(s => s.category === 'pastels');

