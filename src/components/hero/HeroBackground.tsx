import React from 'react';
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

        {/* Layer 2: Luminous Bright Snow / Soft Linen highlight gradient overlay */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(180deg, #F6F6F6 0%, rgba(246, 246, 246, 0.70) 45%, #F3F0E7 95%)',
          }}
          aria-hidden="true"
        />

        {/* Soft radial highlight behind scales */}
        <div
          className="absolute inset-0 w-full h-full bg-radial from-white/30 via-[#F3F0E7]/50 to-[#F6F6F6]/90 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* 
        ========================================================================
        IMAGE 1 — LEFT BACKGROUND (Desk, Paperwork, Signing) + DARK WALNUT OVERLAY
        Desktop: ~58% width.
        Mobile: Tall enough (h-[65%] min-h-[545px]) to fully contain all HeroContent.
        z-index: 2 (renders ON TOP of IMAGE 2).
        Right side on desktop / bottom on mobile has rounded corners (50px) and NO shadow.
        ========================================================================
      */}
      <div
        className="absolute top-0 left-0 w-full md:w-[58%] h-[65%] min-h-[545px] sm:h-[63%] md:min-h-0 md:h-full md:bottom-0 rounded-b-[50px] md:rounded-b-none md:rounded-r-[50px] overflow-hidden z-[2] transition-all duration-300"
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

        {/* Layer 2: Independent Primary Dark Walnut Color Overlay (#452415 at 92% opacity) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundColor: heroConfig.colors.primaryBurgundy,
            opacity: heroConfig.colors.leftOverlayOpacity,
          }}
          aria-hidden="true"
        />

        {/* Subtle rich walnut depth gradient on left */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-black/35 via-transparent to-[#612912]/20 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
