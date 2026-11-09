import React from 'react';
import { HeroBackground } from './hero/HeroBackground';
import { HeroContent } from './hero/HeroContent';
import { HeroNavigation } from './hero/HeroNavigation';
import { HeroLawyer } from './hero/HeroLawyer';

interface HeroProps {
  onOpenConsultation: () => void;
  onNavigateAdmin: () => void;
  onNavigateClient: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenConsultation, onNavigateAdmin, onNavigateClient }) => {
  return (
    <section
      id="hero"
      className="relative z-[2] w-full min-h-[100vh] lg:h-[100dvh] lg:min-h-[760px] overflow-visible flex flex-col justify-start"
    >
      {/* 
        Two Independent Background Layers:
        1. Left Background Image (Desk & Paperwork) + Independent Primary Brown Overlay (#452415)
        2. Right Background Image (Warm Legal & Subtle Justice Scales) + Warm Cream Overlay
      */}
      <HeroBackground />

      {/* Top Header & Navigation: Logo at top-left, Navigation links at top-right */}
      <HeroNavigation 
        onOpenConsultation={onOpenConsultation} 
        onNavigateAdmin={onNavigateAdmin}
        onNavigateClient={onNavigateClient}
      />

      {/* Main Hero Content: Left-aligned writing safely on the left of the statue */}
      <div className="w-full flex-1 flex flex-col justify-center items-center relative my-auto mt-6 sm:mt-8 lg:-mt-6">
        <div className="w-full relative flex flex-col lg:flex-row items-center justify-start my-auto">
          <HeroContent onOpenConsultation={onOpenConsultation} />
        </div>
      </div>

      {/* 
        Foreground Statue of Justice Cutout:
        Aligned at 58% on the border between the left image's right border and the right image's left border.
        The bottom portion of the statue extends down behind the second section (AboutSection, z-[10])
        so it feels inserted in the next section, preserving the second section's round upper border in front.
      */}
      <HeroLawyer />
    </section>
  );
};
