import React from 'react';
import { motion } from 'framer-motion';
import { heroConfig } from '../../data/heroConfig';

export const HeroBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
      {/* 
        ========================================================================
        IMAGE 2 — RIGHT BACKGROUND (Scales of Justice & Architectural Setting)
        Desktop: ~52% width from the right.
        NOW DARK COPPER (#612912 / #452415) - switched with the left side
        ========================================================================
      */}
      <div
        className="absolute top-0 right-0 w-full md:w-[52%] h-full z-[1] overflow-hidden"
      >
        {/* Layer 1: Right warm legal / scales background photograph */}
        <div
          className="absolute inset-0 w-full h-full bg-cover"
          style={{
            backgroundImage: `url(${heroConfig.rightBackground})`,
            backgroundPosition: '50% 50%',
          }}
          aria-hidden="true"
        />

        {/* Layer 2: Rich dark copper overlay matching CEO section (#612912) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(180deg, #612912 0%, #612912 65%, #452415 100%)',
            opacity: 0.90,
          }}
          aria-hidden="true"
        />

        {/* Subtle vignette depth gradient on right */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-l from-black/35 via-transparent to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* 
        ========================================================================
        IMAGE 1 — LEFT BACKGROUND + LIGHT / WHITE / CREAM OVERLAY
        Desktop: ~58% width.
        Mobile: Tall enough (h-[65%] min-h-[545px]) to fully contain all HeroContent.
        NOW LIGHT / WHITE / CREAM - switched with the right side so the logo pops out!
        Animation preserved exactly as it is (cinematic smooth reveal).
        ========================================================================
      */}
      <motion.div
        initial={{ x: '-100%', opacity: 0.2 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 w-full md:w-[58%] h-[65%] min-h-[545px] sm:h-[63%] md:min-h-0 md:h-full md:bottom-0 rounded-b-[50px] md:rounded-b-none md:rounded-r-[50px] overflow-hidden z-[2] shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:shadow-[14px_0_36px_rgba(0,0,0,0.18)] border-b md:border-b-0 md:border-r border-slate-200/60"
        style={{
          boxShadow: 'none',
        }}
      >
        {/* Layer 1: Left high-end law chambers background image with rich visibility */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-55"
          style={{
            backgroundImage: `url(${heroConfig.leftBackground})`,
            filter: 'contrast(1.05) brightness(1.02)',
          }}
          aria-hidden="true"
        />

        {/* Layer 2: Soft warm gradient overlay ensuring high contrast and clarity */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(248, 250, 252, 0.72) 50%, rgba(243, 240, 231, 0.78) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Soft radial highlight */}
        <div
          className="absolute inset-0 w-full h-full bg-radial from-white/40 via-white/70 to-[#F8FAFC]/90 pointer-events-none"
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
};
