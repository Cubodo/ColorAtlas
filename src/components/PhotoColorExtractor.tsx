/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Pipette, 
  RotateCcw, 
  Shuffle, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  Copy, 
  Check, 
  ArrowUpRight, 
  BookmarkPlus, 
  Undo2, 
  Redo2,
  Eye,
} from 'lucide-react';
import { PantoneSpecimen, PaletteStudy } from '../types';
import { PANTONE_DATABASE } from '../data/pantoneDatabase';
import { 
  rgbToHex, 
  findClosestPantoneMatches, 
  rgbToLab, 
  getContrastTextColor 
} from '../utils/colorScience';

export interface PhotoHandle {
  id: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
  hex: string;
  closestSpecimen?: PantoneSpecimen;
  matchScore?: number;
  deltaE?: number;
}

interface PhotoColorExtractorProps {
  onSelectColor: (hex: string) => void;
  onSelectSpecimen: (specimen: PantoneSpecimen) => void;
  onAddStudy: (study: PaletteStudy) => void;
  onNavigateSection: (section: 'archive' | 'specimens' | 'palettes') => void;
}

// Preset photography library with reliable, CORS-ready high-resolution imagery
const PRESET_PHOTOS = [
  {
    id: 'alpine-ridge',
    label: 'Alpine Ridge',
    tag: 'Mountain / Reference',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    description: 'Snow peaks, azure sky, and alpine rock',
    initialHandles: [
      { x: 0.22, y: 0.35 },
      { x: 0.15, y: 0.53 },
      { x: 0.09, y: 0.63 },
      { x: 0.46, y: 0.78 },
      { x: 0.95, y: 0.80 },
    ]
  },
  {
    id: 'bauhaus-arch',
    label: 'Modernist Facade',
    tag: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    description: 'Clean geometry, concrete neutrals, and warm accents',
    initialHandles: [
      { x: 0.20, y: 0.25 },
      { x: 0.35, y: 0.45 },
      { x: 0.50, y: 0.35 },
      { x: 0.70, y: 0.65 },
      { x: 0.85, y: 0.80 },
    ]
  },
  {
    id: 'desert-dunes',
    label: 'Sahara Dunes',
    tag: 'Landscape',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
    description: 'Warm ochre, terracotta shadow, and sunlit crests',
    initialHandles: [
      { x: 0.15, y: 0.20 },
      { x: 0.35, y: 0.40 },
      { x: 0.55, y: 0.55 },
      { x: 0.75, y: 0.70 },
      { x: 0.90, y: 0.85 },
    ]
  },
  {
    id: 'botanical-flora',
    label: 'Botanical Flora',
    tag: 'Organic',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=80',
    description: 'Floral petals, vibrant pollen, and leafy deep greens',
    initialHandles: [
      { x: 0.20, y: 0.30 },
      { x: 0.40, y: 0.35 },
      { x: 0.50, y: 0.50 },
      { x: 0.65, y: 0.65 },
      { x: 0.80, y: 0.75 },
    ]
  },
];

export const PhotoColorExtractor: React.FC<PhotoColorExtractorProps> = ({
  onSelectColor,
  onSelectSpecimen,
  onAddStudy,
  onNavigateSection,
}) => {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('https://images.pexels.com/photos/34723571/pexels-photo-34723571.jpeg');
  const [imageTitle, setImageTitle] = useState<string>('Pexels Photo');
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [showConnectingLine, setShowConnectingLine] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedStudyMessage, setSavedStudyMessage] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(16 / 10);

  // Direct canvas photo change & drag-and-drop states
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [showCanvasUrlInput, setShowCanvasUrlInput] = useState<boolean>(false);

  // Handles state
  const [handles, setHandles] = useState<PhotoHandle[]>([
    { id: 'h-1', x: 0.22, y: 0.35, hex: '#2A5E8C' },
    { id: 'h-2', x: 0.15, y: 0.53, hex: '#3C7DA6' },
    { id: 'h-3', x: 0.09, y: 0.63, hex: '#73B2D9' },
    { id: 'h-4', x: 0.46, y: 0.78, hex: '#594C34' },
    { id: 'h-5', x: 0.95, y: 0.80, hex: '#BFB093' },
  ]);

  // Undo / Redo history
  const [history, setHistory] = useState<PhotoHandle[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // References
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggingHandleIndexRef = useRef<number | null>(null);

  // Sample pixel color from the offscreen canvas at normalized (x, y) coordinates
  const samplePixel = useCallback((normX: number, normY: number): string => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      return '#888888';
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#888888';

    const px = Math.floor(Math.max(0, Math.min(canvas.width - 1, normX * canvas.width)));
    const py = Math.floor(Math.max(0, Math.min(canvas.height - 1, normY * canvas.height)));

    try {
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      return rgbToHex({ r: pixel[0], g: pixel[1], b: pixel[2] });
    } catch {
      // Fallback if cross-origin canvas security prevents direct read
      return '#333333';
    }
  }, []);

  // Compute closest Pantone specimen for a hex
  const computePantoneMatch = useCallback((hex: string) => {
    try {
      const clean = hex.replace('#', '');
      const num = parseInt(clean, 16);
      if (isNaN(num)) return undefined;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const lab = rgbToLab({ r, g, b });
      const matches = findClosestPantoneMatches(lab, PANTONE_DATABASE, 1);
      return matches[0];
    } catch {
      return undefined;
    }
  }, []);

  // Push new state to history
  const pushToHistory = useCallback((newHandles: PhotoHandle[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newHandles];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Load image onto offscreen canvas and re-sample handles
  const processImage = useCallback((imgElement: HTMLImageElement, initialCoords?: { x: number; y: number }[]) => {
    const natW = imgElement.naturalWidth || imgElement.width || 800;
    const natH = imgElement.naturalHeight || imgElement.height || 600;
    if (natW && natH) {
      setImageAspectRatio(natW / natH);
    }

    const canvas = document.createElement('canvas');
    canvas.width = natW;
    canvas.height = natH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    canvasRef.current = canvas;
    setImageLoaded(true);

    // Re-sample handles
    setHandles(prev => {
      const coordsToUse = initialCoords || prev.map(h => ({ x: h.x, y: h.y }));
      const updated = coordsToUse.map((coords, i) => {
        const id = prev[i]?.id || `h-${Date.now()}-${i}`;
        const hex = samplePixel(coords.x, coords.y);
        const match = computePantoneMatch(hex);
        return {
          id,
          x: coords.x,
          y: coords.y,
          hex,
          closestSpecimen: match?.specimen,
          matchScore: match?.matchScore,
          deltaE: match?.deltaE,
        };
      });
      return updated;
    });
  }, [samplePixel, computePantoneMatch]);

  // Initialize or change image
  const loadImage = useCallback((src: string, coords?: { x: number; y: number }[]) => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      processImage(img, coords);
    };
    img.onerror = () => {
      // If CORS fails on direct anonymous load, attempt to load directly without crossorigin
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        processImage(fallbackImg, coords);
      };
      fallbackImg.src = src;
    };
    img.src = src;
  }, [processImage]);

  // Initial load on mount
  useEffect(() => {
    loadImage(currentImageSrc, [
      { x: 0.18, y: 0.28 },
      { x: 0.32, y: 0.44 },
      { x: 0.50, y: 0.38 },
      { x: 0.68, y: 0.62 },
      { x: 0.82, y: 0.76 },
    ]);
  }, []);

  // Handle file upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCurrentImageSrc(objectUrl);
    setImageTitle(file.name.replace(/\.[^/.]+$/, ''));
    loadImage(objectUrl);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  // Handle URL submit
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setCurrentImageSrc(urlInput.trim());
    setImageTitle('Custom Web Image');
    loadImage(urlInput.trim());
    setShowUrlModal(false);
    setUrlInput('');
  };

  // Direct Drag & Drop event handlers on the photo canvas
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setCurrentImageSrc(objectUrl);
      setImageTitle(file.name.replace(/\.[^/.]+$/, ''));
      loadImage(objectUrl);
    }
  };

  // Dragging logic for handles
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    draggingHandleIndexRef.current = index;
    setActiveHandleIndex(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingHandleIndexRef.current === null) return;
    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;

    const clampedX = Math.max(0.01, Math.min(0.99, rawX));
    const clampedY = Math.max(0.01, Math.min(0.99, rawY));

    const index = draggingHandleIndexRef.current;
    const newHex = samplePixel(clampedX, clampedY);
    const match = computePantoneMatch(newHex);

    setHandles(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        x: clampedX,
        y: clampedY,
        hex: newHex,
        closestSpecimen: match?.specimen,
        matchScore: match?.matchScore,
        deltaE: match?.deltaE,
      };
      return copy;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingHandleIndexRef.current !== null) {
      pushToHistory(handles);
      draggingHandleIndexRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
    }
  };

  // Click on image to add a new handle or pick color
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = imageContainerRef.current;
    if (!container) return;
    if (handles.length >= 8) return; // Limit to 8 handles for clean UI

    const rect = container.getBoundingClientRect();
    const clickX = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const clickY = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

    const newHex = samplePixel(clickX, clickY);
    const match = computePantoneMatch(newHex);

    const newHandle: PhotoHandle = {
      id: `h-${Date.now()}`,
      x: clickX,
      y: clickY,
      hex: newHex,
      closestSpecimen: match?.specimen,
      matchScore: match?.matchScore,
      deltaE: match?.deltaE,
    };

    const nextHandles = [...handles, newHandle];
    setHandles(nextHandles);
    pushToHistory(nextHandles);
    setActiveHandleIndex(nextHandles.length - 1);
  };

  // Delete handle
  const handleDeleteHandle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (handles.length <= 2) return; // Maintain at least 2 colors for a gradient
    const filtered = handles.filter(h => h.id !== id);
    setHandles(filtered);
    pushToHistory(filtered);
    setActiveHandleIndex(null);
  };

  // Reset handles to diagonal default line
  const handleResetHandles = () => {
    const defaultCoords = [
      { x: 0.15, y: 0.25 },
      { x: 0.32, y: 0.42 },
      { x: 0.50, y: 0.55 },
      { x: 0.70, y: 0.70 },
      { x: 0.88, y: 0.82 },
    ];
    const newHandles = defaultCoords.map((coords, i) => {
      const hex = samplePixel(coords.x, coords.y);
      const match = computePantoneMatch(hex);
      return {
        id: `h-${Date.now()}-${i}`,
        x: coords.x,
        y: coords.y,
        hex,
        closestSpecimen: match?.specimen,
        matchScore: match?.matchScore,
        deltaE: match?.deltaE,
      };
    });
    setHandles(newHandles);
    pushToHistory(newHandles);
  };

  // Auto-extract dominant spatial color points
  const handleAutoExtractDominant = () => {
    const candidatePoints = [
      { x: 0.20, y: 0.18 },
      { x: 0.15, y: 0.45 },
      { x: 0.48, y: 0.50 },
      { x: 0.78, y: 0.35 },
      { x: 0.85, y: 0.82 },
    ];

    const newHandles = candidatePoints.map((pt, i) => {
      const hex = samplePixel(pt.x, pt.y);
      const match = computePantoneMatch(hex);
      return {
        id: `h-auto-${Date.now()}-${i}`,
        x: pt.x,
        y: pt.y,
        hex,
        closestSpecimen: match?.specimen,
        matchScore: match?.matchScore,
        deltaE: match?.deltaE,
      };
    });

    setHandles(newHandles);
    pushToHistory(newHandles);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setHandles(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setHandles(history[historyIndex + 1]);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Compute CSS gradient string
  const cssGradient = useMemo(() => {
    if (handles.length === 0) return 'linear-gradient(90deg, #333333, #888888)';
    const colorStops = handles.map(h => h.hex).join(', ');
    return `linear-gradient(90deg, ${colorStops})`;
  }, [handles]);

  // Save current extracted colors as a new Palette Study
  const handleSaveAsPaletteStudy = () => {
    const specimens: PantoneSpecimen[] = handles.map((h, i) => {
      if (h.closestSpecimen) {
        return h.closestSpecimen;
      }
      return {
        code: `EXTRACT ${i + 1}`,
        name: `Image Tone #${h.hex.replace('#', '')}`,
        category: 'formula_coated',
        hex: h.hex,
        rgb: { r: 128, g: 128, b: 128 },
        cmyk: { c: 0, m: 0, y: 0, k: 50 },
        lab: { l: 50, a: 0, b: 0 },
        substrate: 'coated',
      };
    });

    const equalRatio = Math.round(100 / specimens.length);
    const ratios = specimens.map((_, i) => (i === 0 ? 100 - equalRatio * (specimens.length - 1) : equalRatio));

    const study: PaletteStudy = {
      id: `photo-study-${Date.now()}`,
      title: `Photo Study — ${imageTitle}`,
      subtitle: `Gradient Synthesis from Photo Handles • ${new Date().toISOString().slice(0, 10)}`,
      ratio: ratios,
      dateCreated: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      curatorNotes: `Extracted directly from photographic analysis of "${imageTitle}". Contains ${handles.length} calibrated tonal nodes.`,
      specimens,
    };

    onAddStudy(study);
    setSavedStudyMessage(true);
    setTimeout(() => setSavedStudyMessage(false), 2400);
  };

  return (
    <section className="w-full hairline-b bg-[var(--bg-page)]" id="photo-extractor">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        
        {/* Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-grid)] mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-3 bg-[var(--text-primary)] inline-block"></span>
              <span className="text-[11px] font-specimen-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                Photo Sampling // 06
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--text-primary)] font-sans">
              Edit your color gradient.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Refine your colors by moving the handles on the image and gradient.
            </p>
          </div>

          {/* Quick source actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-specimen-mono">
            {/* Upload from Device */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tile)] border border-[var(--border-grid)] hover:border-[var(--text-primary)] text-[var(--text-primary)] transition-all cursor-pointer shadow-xs text-xs font-medium"
              title="Upload image file from device"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>

            {/* Load Image via URL */}
            <button
              onClick={() => setShowUrlModal(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tile)] border border-[var(--border-grid)] hover:border-[var(--text-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs text-xs font-medium"
              title="Load image from URL link"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image Link</span>
            </button>

            {/* Undo / Redo */}
            <div className="inline-flex items-center border border-[var(--border-grid)] bg-[var(--bg-tile)] shadow-xs">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo last change"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-3.5 bg-[var(--border-grid)]" />
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo change"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal / Bar for URL input */}
        {showUrlModal && (
          <form 
            onSubmit={handleUrlSubmit} 
            className="mb-6 p-4 bg-[var(--bg-tile)] border border-[var(--border-grid)] shadow-xs flex flex-col sm:flex-row items-center gap-3 animate-in fade-in duration-150"
          >
            <div className="flex-1 w-full flex items-center gap-2 border border-[var(--border-grid)] bg-[var(--bg-page)] px-3 py-2">
              <LinkIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                className="w-full bg-transparent text-xs font-specimen-mono text-[var(--text-primary)] focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs font-specimen-mono font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                Load Photo
              </button>
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="px-3 py-2 border border-[var(--border-grid)] text-xs font-specimen-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Secondary Toolbar (Eyedropper tool, Reset, Shuffle, Line toggle) */}
        <div className="flex items-center justify-between gap-3 mb-4 text-xs font-specimen-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEyedropperActive(prev => !prev)}
              className={`p-2 border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                isEyedropperActive 
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-page)]' 
                  : 'border-[var(--border-grid)] bg-[var(--bg-tile)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'
              }`}
              title="Click on image to add a new color pointer (up to 8)"
            >
              <Pipette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">
                {isEyedropperActive ? 'Eyedropper Active' : 'Add Pointer'}
              </span>
            </button>

            <button
              onClick={handleResetHandles}
              className="p-2 border border-[var(--border-grid)] bg-[var(--bg-tile)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
              title="Reset pointers to diagonal line"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleAutoExtractDominant}
              className="p-2 border border-[var(--border-grid)] bg-[var(--bg-tile)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Auto-distribute 5 handles across dominant regions"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auto-Extract</span>
            </button>

            <button
              onClick={() => setShowConnectingLine(prev => !prev)}
              className={`px-2.5 py-1.5 border transition-all cursor-pointer shadow-xs text-[11px] ${
                showConnectingLine 
                  ? 'border-[var(--text-primary)] bg-[var(--bg-page)] text-[var(--text-primary)] font-medium' 
                  : 'border-[var(--border-grid)] bg-[var(--bg-tile)] text-[var(--text-faint)]'
              }`}
              title="Toggle connecting path line between pointers"
            >
              Path Line: {showConnectingLine ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] hidden md:flex items-center gap-2">
            <span>{handles.length} active handles</span>
            <span>•</span>
            <span className="text-[var(--text-faint)]">Drag handles anywhere on image</span>
          </div>
        </div>

        {/* WORKSPACE GRID: Reference Image on Left, Gradient + Stacked Swatch Cards on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT: Image Canvas with Interactive Draggable Handles and Connecting Line */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div 
              ref={imageContainerRef}
              onClick={handleImageClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : '16 / 10',
                maxHeight: '560px',
                width: imageAspectRatio ? `min(100%, calc(560px * ${imageAspectRatio}))` : '100%',
              }}
              className={`relative mx-auto max-w-full bg-neutral-950 border shadow-sm rounded-none overflow-hidden select-none cursor-crosshair group transition-all flex items-center justify-center ${
                isDraggingFile 
                  ? 'border-dashed border-white ring-4 ring-white/20' 
                  : 'border-[var(--border-grid)]'
              }`}
            >
              {/* Image element - fitted with either height or width reduction, fully visible */}
              <img
                src={currentImageSrc}
                alt={imageTitle}
                onLoad={(e) => {
                  const target = e.currentTarget;
                  if (target.naturalWidth && target.naturalHeight) {
                    setImageAspectRatio(target.naturalWidth / target.naturalHeight);
                  }
                }}
                className="w-full h-full object-contain pointer-events-none transition-opacity duration-300"
                style={{ opacity: imageLoaded ? 1 : 0.4 }}
              />

              {/* Drag-and-Drop Active Overlay */}
              {isDraggingFile && (
                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150 border-2 border-dashed border-white pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <p className="text-sm font-bold text-white font-specimen-mono tracking-wide">
                    Drop image file here
                  </p>
                  <p className="text-xs text-neutral-300 font-specimen-mono mt-1">
                    Auto-analyzes colors and updates pointers instantly
                  </p>
                </div>
              )}

              {/* Top Floating Action Bar: Direct Upload & Change Controls on the Image Canvas */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-30 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 bg-white text-neutral-900 hover:bg-neutral-100 text-[11px] font-specimen-mono font-bold backdrop-blur-md border border-white/40 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Upload photo from your computer/device"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCanvasUrlInput(prev => !prev);
                  }}
                  className="px-2.5 py-1.5 bg-black/75 hover:bg-black/90 text-white text-[11px] font-specimen-mono font-medium backdrop-blur-md border border-white/20 hover:border-white/40 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Load image from web URL"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>URL</span>
                </button>
              </div>

              {/* Inline URL Loader Bar directly over the image */}
              {showCanvasUrlInput && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-12 left-3 right-3 z-35 p-2 bg-neutral-950/95 backdrop-blur-md border border-white/25 shadow-2xl flex items-center gap-2 animate-in fade-in duration-150"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                    className="flex-1 bg-transparent text-xs font-specimen-mono text-white placeholder-neutral-400 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (urlInput.trim()) {
                          setCurrentImageSrc(urlInput.trim());
                          setImageTitle('Custom Web Image');
                          loadImage(urlInput.trim());
                          setShowCanvasUrlInput(false);
                          setUrlInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (urlInput.trim()) {
                        setCurrentImageSrc(urlInput.trim());
                        setImageTitle('Custom Web Image');
                        loadImage(urlInput.trim());
                        setShowCanvasUrlInput(false);
                        setUrlInput('');
                      }
                    }}
                    className="px-3 py-1 bg-white text-black text-[11px] font-specimen-mono font-bold uppercase hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCanvasUrlInput(false)}
                    className="px-2 py-1 text-neutral-400 hover:text-white text-[11px] font-specimen-mono transition-colors cursor-pointer shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Connecting Line Polyline SVG Overlay */}
              {showConnectingLine && handles.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {/* Subtle dark backdrop line for contrast on bright skies */}
                  <polyline
                    points={handles.map(h => `${h.x * 100}%,${h.y * 100}%`).join(' ')}
                    fill="none"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Main crisp white connecting line (matching reference style) */}
                  <polyline
                    points={handles.map(h => `${h.x * 100}%,${h.y * 100}%`).join(' ')}
                    fill="none"
                    stroke="rgba(255,255,255,0.92)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="none"
                  />
                </svg>
              )}

              {/* Interactive Draggable Handle Pins */}
              {handles.map((handle, index) => {
                const isActive = activeHandleIndex === index;
                const isContrastDark = getContrastTextColor(handle.hex) === '#111111';

                return (
                  <div
                    key={handle.id}
                    onPointerDown={(e) => handlePointerDown(index, e)}
                    style={{
                      left: `${handle.x * 100}%`,
                      top: `${handle.y * 100}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing touch-none group/handle"
                  >
                    {/* Outer handle ring matching reference photo style */}
                    <div 
                      className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[2.5px] border-white shadow-md flex items-center justify-center transition-transform hover:scale-110 ${
                        isActive ? 'scale-115 ring-2 ring-black/40' : ''
                      }`}
                      style={{
                        backgroundColor: handle.hex,
                      }}
                    >
                      {/* Inner index marker */}
                      <span 
                        className="text-[10px] font-specimen-mono font-bold select-none drop-shadow-xs"
                        style={{ color: isContrastDark ? '#111111' : '#ffffff' }}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Hover tooltip showing hex and match */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/handle:flex flex-col items-center pointer-events-none z-30">
                      <div className="px-2.5 py-1 bg-black/85 backdrop-blur-md text-white text-[10px] font-specimen-mono whitespace-nowrap shadow-lg border border-white/20">
                        <span className="font-bold">{handle.hex}</span>
                        {handle.closestSpecimen && (
                          <span className="text-neutral-300 ml-1.5">• {handle.closestSpecimen.code}</span>
                        )}
                      </div>
                      <div className="w-1.5 h-1.5 bg-black/85 rotate-45 -mt-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preset Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
              <span className="text-[10px] font-specimen-mono text-[var(--text-faint)] uppercase tracking-wider shrink-0">
                Presets:
              </span>
              {PRESET_PHOTOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setCurrentImageSrc(preset.url);
                    setImageTitle(preset.label);
                    loadImage(preset.url, preset.initialHandles);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-specimen-mono border transition-all shrink-0 cursor-pointer ${
                    currentImageSrc === preset.url
                      ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-page)] font-bold'
                      : 'border-[var(--border-grid)] bg-[var(--bg-tile)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={`${preset.label} — ${preset.description}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Micro instructional prompt */}
            <div className="flex items-center justify-between text-[11px] font-specimen-mono text-[var(--text-faint)] px-1">
              <span>Click on the image to place another pointer (up to 8).</span>
              <span>Drag circles to sample different areas.</span>
            </div>
          </div>

          {/* RIGHT: Gradient Bar + Stacked Swatch Cards */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* 1. Horizontal Gradient Preview Bar with interactive handle markers */}
            <div className="border border-[var(--border-grid)] bg-[var(--bg-tile)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-specimen-mono mb-2.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-primary)]">
                  Gradient Spectrum
                </span>
                <button
                  onClick={() => copyToClipboard(cssGradient, 'gradient-css')}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copy CSS linear gradient string"
                >
                  {copiedKey === 'gradient-css' ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied CSS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy CSS
                    </span>
                  )}
                </button>
              </div>

              {/* The Smooth Continuous Gradient Bar */}
              <div 
                className="relative w-full h-14 rounded-md shadow-inner border border-black/15 overflow-visible"
                style={{
                  background: cssGradient,
                }}
              >
                {/* Horizontal connection line across the gradient bar */}
                <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white/40 -translate-y-1/2 pointer-events-none" />

                {/* Nodes matching the reference gradient bar handles */}
                {handles.map((h, i) => {
                  const pct = (i / Math.max(1, handles.length - 1)) * 100;
                  return (
                    <div
                      key={h.id}
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125 z-10"
                      style={{
                        left: `${pct}%`,
                        backgroundColor: h.hex,
                      }}
                      title={`Handle #${i + 1}: ${h.hex}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* 2. Stacked Color Swatch Cards */}
            <div className="flex flex-col border border-[var(--border-grid)] bg-[var(--bg-tile)] shadow-xs divide-y divide-[var(--border-grid)] overflow-hidden">
              {handles.map((handle, index) => {
                const contrastColor = getContrastTextColor(handle.hex);
                const isLight = contrastColor === '#111111';

                return (
                  <div
                    key={handle.id}
                    className="relative w-full h-14 sm:h-16 px-4 flex items-center justify-between transition-all group/swatch"
                    style={{
                      backgroundColor: handle.hex,
                      color: contrastColor,
                    }}
                  >
                    {/* Left: Swatch Hex Code & Closest Pantone Standard */}
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-5 h-5 rounded-full border border-current/25 flex items-center justify-center text-[10px] font-specimen-mono font-bold shrink-0 opacity-80"
                      >
                        {index + 1}
                      </span>

                      <div>
                        <div className="text-sm sm:text-base font-bold font-specimen-mono tracking-wider">
                          {handle.hex.toUpperCase()}
                        </div>
                        {handle.closestSpecimen && (
                          <div className="text-[10px] font-specimen-mono opacity-85 truncate max-w-[170px] sm:max-w-[220px]">
                            {handle.closestSpecimen.code}
                            {handle.matchScore && ` (${handle.matchScore}%)`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions (Set as Studio target, Copy Hex, Remove) */}
                    <div className="flex items-center gap-1">
                      {/* Set as Active Studio Target Color */}
                      <button
                        onClick={() => {
                          onSelectColor(handle.hex);
                          if (handle.closestSpecimen) {
                            onSelectSpecimen(handle.closestSpecimen);
                          }
                          onNavigateSection('archive');
                        }}
                        className="p-2 rounded-none transition-opacity hover:opacity-100 opacity-80 cursor-pointer"
                        style={{
                          backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                        }}
                        title="Set as target in Color Studio & find matches"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Hex */}
                      <button
                        onClick={() => copyToClipboard(handle.hex, handle.id)}
                        className="p-2 rounded-none transition-opacity hover:opacity-100 opacity-80 cursor-pointer"
                        style={{
                          backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                        }}
                        title="Copy HEX to clipboard"
                      >
                        {copiedKey === handle.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Handle */}
                      {handles.length > 2 && (
                        <button
                          onClick={(e) => handleDeleteHandle(handle.id, e)}
                          className="p-2 rounded-none transition-opacity hover:opacity-100 opacity-70 hover:opacity-100 cursor-pointer"
                          style={{
                            backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                          }}
                          title="Delete this pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Bottom Action Suite: Save as Palette Study & Export */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                onClick={handleSaveAsPaletteStudy}
                className="w-full sm:flex-1 py-2.5 px-4 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs font-specimen-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                {savedStudyMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved to Palettes!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save as Palette Study</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (handles.length > 0) {
                    onSelectColor(handles[0].hex);
                    if (handles[0].closestSpecimen) {
                      onSelectSpecimen(handles[0].closestSpecimen);
                    }
                    onNavigateSection('archive');
                  }
                }}
                className="w-full sm:w-auto py-2.5 px-4 border border-[var(--border-grid)] bg-[var(--bg-tile)] text-[var(--text-primary)] text-xs font-specimen-mono font-medium hover:border-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Studio Benchmark</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
