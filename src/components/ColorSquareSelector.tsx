/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ColorCoordinate {
  u: number; // 0.0 (left) to 1.0 (right)
  v: number; // 0.0 (top) to 1.0 (bottom)
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorSquareSelectorProps {
  baseColor?: string; // Default bottom edge solid color: '#FA5B0F'
  value?: ColorCoordinate;
  onChange?: (coord: ColorCoordinate, rgb: RGB, hex: string) => void;
  size?: number; // width & height in pixels (default 240)
  className?: string;
}

export function ColorSquareSelector({
  baseColor = '#FA5B0F',
  value = { u: 0.35, v: 0.65 },
  onChange,
  size = 240,
  className = '',
}: ColorSquareSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coord, setCoord] = useState<ColorCoordinate>(value);
  const [isDragging, setIsDragging] = useState(false);

  // Sync internal coordinate only when not actively dragging
  useEffect(() => {
    if (!isDragging && value) {
      setCoord(prev => {
        if (Math.abs(prev.u - value.u) > 0.005 || Math.abs(prev.v - value.v) > 0.005) {
          return value;
        }
        return prev;
      });
    }
  }, [value, isDragging]);

  // Parse Hex to RGB
  const baseRgb = React.useMemo(() => {
    const clean = baseColor.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }, [baseColor]);

  // Bilinear Color Interpolation Function:
  // - Top-Left (u=0, v=0): White (255, 255, 255)
  // - Top-Right (u=1, v=0): Black (0, 0, 0)
  // - Bottom Edge (v=1): Solid Base Color
  const interpolateColor = useCallback(
    (u: number, v: number): RGB => {
      const top = (1 - u) * 255;
      const r = Math.round((1 - v) * top + v * baseRgb.r);
      const g = Math.round((1 - v) * top + v * baseRgb.g);
      const b = Math.round((1 - v) * top + v * baseRgb.b);
      return {
        r: Math.max(0, Math.min(255, r)),
        g: Math.max(0, Math.min(255, g)),
        b: Math.max(0, Math.min(255, b)),
      };
    },
    [baseRgb]
  );

  const rgbToHex = (c: RGB) =>
    '#' + [c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

  // Draw square plot canvas and active reticle (No crosshairs, only color pointer)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = size;
    const h = size;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    let idx = 0;
    for (let y = 0; y < h; y++) {
      const v = y / (h - 1);
      const oneMinusV = 1 - v;
      for (let x = 0; x < w; x++) {
        const u = x / (w - 1);
        const top = (1 - u) * 255;

        data[idx] = oneMinusV * top + v * baseRgb.r;
        data[idx + 1] = oneMinusV * top + v * baseRgb.g;
        data[idx + 2] = oneMinusV * top + v * baseRgb.b;
        data[idx + 3] = 255;
        idx += 4;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw active color pointer (NO x and y crosshair lines)
    const cx = Math.max(8, Math.min(w - 8, coord.u * w));
    const cy = Math.max(8, Math.min(h - 8, coord.v * h));
    const color = interpolateColor(coord.u, coord.v);

    // Outer dark ring for contrast on bright/white areas
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner bright ring for contrast on dark/black areas
    ctx.beginPath();
    ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center color indicator pip
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.fill();
  }, [coord, baseRgb, interpolateColor, size]);

  // Handle pointer interactions
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newCoord = { u: Number(u.toFixed(4)), v: Number(v.toFixed(4)) };
    setCoord(newCoord);

    const rgb = interpolateColor(newCoord.u, newCoord.v);
    const hex = rgbToHex(rgb);
    onChange?.(newCoord, rgb, hex);
  };

  return (
    <div className={`flex flex-col gap-2 select-none ${className}`}>
      {/* Top micro-spec label */}
      <div className="flex items-center justify-between text-[11px] font-specimen-mono text-[var(--text-muted)] px-0.5">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white border border-black/30 dark:border-white/30 inline-block"></span>
          White (0,0) → Black (1,0)
        </span>
        <span className="flex items-center gap-1.5">
          <span 
            className="w-2.5 h-2.5 border border-black/20 dark:border-white/20 inline-block shrink-0" 
            style={{ backgroundColor: baseColor }}
          />
          <span className="text-[var(--text-primary)] font-bold">Bottom: {baseColor}</span>
        </span>
      </div>

      {/* Canvas Square Stage (Compact size, no crosshairs) */}
      <div 
        className="relative mx-auto bg-black border border-[var(--border-grid)] shadow-xs overflow-hidden"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="w-full h-full cursor-pointer touch-none block"
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsDragging(true);
            handlePointer(e);
          }}
          onPointerMove={e => {
            if (isDragging) handlePointer(e);
          }}
          onPointerUp={e => {
            setIsDragging(false);
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {}
          }}
          onPointerCancel={e => {
            setIsDragging(false);
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {}
          }}
        />
      </div>

      {/* Bottom coordinate readout */}
      <div className="flex items-center justify-between text-[10px] font-specimen-mono text-[var(--text-faint)] px-0.5">
        <span>U: {(coord.u * 100).toFixed(0)}% (Lightness)</span>
        <span>V: {(coord.v * 100).toFixed(0)}% (Solid Hue)</span>
      </div>
    </div>
  );
}
