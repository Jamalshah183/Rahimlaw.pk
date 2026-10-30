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
        Layer hierarchy:
          - Image with Scales of Justice (z-index 1)
          - Warm Cream Gradient Overlay
        Placed behind IMAGE 1 so IMAGE 1's right rounded corners are fully visible.
        ========================================================================
      */}
      <div
        className="absolute top-0 right-0 w-full md:w-[52%] h-full z-[1] hidden md:block overflow-hidden"
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

        {/* Layer 2: Luminous Bright / Pearl highlight gradient overlay */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.70) 45%, #F3F0E7 95%)',
          }}
          aria-hidden="true"
        />

        {/* Soft radial highlight behind scales */}
        <div
          className="absolute inset-0 w-full h-full bg-radial from-white/30 via-white/50 to-[#F3F0E7]/90 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* 
        ========================================================================
        IMAGE 1 — LEFT BACKGROUND (Desk, Paperwork, Signing) + copper OVERLAY
        Desktop: ~58% width.
        Mobile: Tall enough (h-[65%] min-h-[545px]) to fully contain all HeroContent.
        Revealing from left to right with cinematic smooth curve.
        ========================================================================
      */}
      <motion.div
        initial={{ x: '-100%', opacity: 0.2 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 w-full md:w-[58%] h-[65%] min-h-[545px] sm:h-[63%] md:min-h-0 md:h-full md:bottom-0 rounded-b-[50px] md:rounded-b-none md:rounded-r-[50px] overflow-hidden z-[2]"
        style={{
          boxShadow: 'none',
        }}
      >
        {/* Layer 1: Left legal desk photograph */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroConfig.leftBackground})`,
          }}
          aria-hidden="true"
        />

        {/* Layer 2: Warm copper overlay matching CEO section (#612912) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(180deg, #612912 0%, #612912 65%, #452415 100%)',
            opacity: 0.88,
          }}
          aria-hidden="true"
        />

        {/* Subtle vignette depth gradient on left without shadow on the right */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-black/25 via-transparent to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
};
