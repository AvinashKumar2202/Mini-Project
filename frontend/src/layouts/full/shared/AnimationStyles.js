import React from 'react';
import { GlobalStyles } from '@mui/material';

/**
 * AnimationStyles – injects shared CSS @keyframes into the document once.
 * Import and render this component near the app root (e.g. FullLayout).
 */
const AnimationStyles = () => (
  <GlobalStyles
    styles={{
      /* ── Entrance: slide up + fade in ─────────────────────────────── */
      '@keyframes fadeSlideUp': {
        from: { opacity: 0, transform: 'translateY(28px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },

      /* ── Slow gradient background shift ──────────────────────────── */
      '@keyframes gradientShift': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },

      /* ── Bell / icon "ring" shake ────────────────────────────────── */
      '@keyframes bellShake': {
        '0%, 100%': { transform: 'rotate(0deg)' },
        '10%': { transform: 'rotate(-18deg)' },
        '20%': { transform: 'rotate(18deg)' },
        '30%': { transform: 'rotate(-12deg)' },
        '40%': { transform: 'rotate(12deg)' },
        '50%': { transform: 'rotate(-6deg)' },
        '60%': { transform: 'rotate(6deg)' },
        '70%': { transform: 'rotate(-3deg)' },
        '80%': { transform: 'rotate(3deg)' },
        '90%': { transform: 'rotate(0deg)' },
      },

      /* ── Glow pulse – for buttons/chips ─────────────────────────── */
      '@keyframes pulseGlow': {
        '0%, 100%': { boxShadow: '0 0 0 0 rgba(108,99,255,0.0)' },
        '50%': { boxShadow: '0 0 20px 6px rgba(108,99,255,0.45)' },
      },

      /* ── Text shimmer ────────────────────────────────────────────── */
      '@keyframes shimmer': {
        '0%': { backgroundPosition: '-200% center' },
        '100%': { backgroundPosition: '200% center' },
      },

      /* ── Aurora / floating blobs ─────────────────────────────────── */
      '@keyframes floatBlob': {
        '0%, 100%': { transform: 'translateY(0px) scale(1)' },
        '50%': { transform: 'translateY(-30px) scale(1.06)' },
      },

      /* ── Stagger fade utility classes ───────────────────────────── */
      '.anim-fade-up': {
        animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
      },
      '.anim-fade-up-d1': { animationDelay: '0.08s' },
      '.anim-fade-up-d2': { animationDelay: '0.16s' },
      '.anim-fade-up-d3': { animationDelay: '0.24s' },
      '.anim-fade-up-d4': { animationDelay: '0.32s' },
      '.anim-fade-up-d5': { animationDelay: '0.40s' },

      /* ── Skeleton shimmer ───────────────────────────────────────── */
      '@keyframes shimmerBg': {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    }}
  />
);

export default AnimationStyles;
