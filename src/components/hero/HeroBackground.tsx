import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { heroConfig } from '../../data/heroConfig';

export const HeroBackground: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        Mobile: Animates from top to bottom (upward to downward).
        Desktop: Animates from left to right.
        ========================================================================
      */}
      <motion.div
        key={isMobile ? 'hero-bg-mobile' : 'hero-bg-desktop'}
        initial={isMobile ? { y: '-100%', x: 0, opacity: 0.2 } : { x: '-100%', y: 0, opacity: 0.2 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 w-full md:w-[58%] h-[65%] min-h-[545px] sm:h-[63%] md:min-h-0 md:h-full md:bottom-0 rounded-b-[50px] md:rounded-b-none md:rounded-r-[50px] overflow-hidden z-[2] shadow-[0_15px_35px_rgba(0,0,0,0.3)] md:shadow-[20px_0_45px_rgba(0,0,0,0.4),8px_0_16px_rgba(0,0,0,0.25)] border-b md:border-b-0 md:border-r border-slate-200/60"
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
