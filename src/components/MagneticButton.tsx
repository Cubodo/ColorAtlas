/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, ReactNode } from 'react';
import { motion, useSpring } from 'motion/react';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  ariaLabel?: string;
  magneticStrength?: number; // 0 to 1, default ~0.28
  disabled?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  onClick,
  title,
  ariaLabel,
  magneticStrength = 0.28,
  disabled = false,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Soft high-damping spring for a luxurious, physics-accurate feel
  const springConfig = { stiffness: 220, damping: 18, mass: 0.1 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * magneticStrength;
    const distanceY = (e.clientY - centerY) * magneticStrength;

    // Limit maximum pull to 8px to keep it subtle & premium
    const maxOffset = 8;
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, distanceX));
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, distanceY));

    x.set(clampedX);
    y.set(clampedY);
  };

  const handleMouseEnter = () => {
    if (!disabled) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.96 }}
      className={`relative inline-flex items-center justify-center transition-shadow select-none will-change-transform ${className}`}
    >
      {children}
    </motion.button>
  );
};
