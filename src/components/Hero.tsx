import React from 'react';
import { HeroBackground } from './hero/HeroBackground';
import { HeroContent } from './hero/HeroContent';
import { HeroNavigation } from './hero/HeroNavigation';

interface HeroProps {
  onOpenConsultation: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenConsultation }) => {
  return (
    <section id="hero" className="relative w-full h-screen overflow-hidden flex flex-col">
      <HeroNavigation onOpenConsultation={onOpenConsultation} />
      <HeroBackground />
      <HeroContent onOpenConsultation={onOpenConsultation} />
    </section>
  );
};
