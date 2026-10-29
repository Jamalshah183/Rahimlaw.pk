import React from 'react';
import { motion } from 'framer-motion';
import { heroConfig } from '../../data/heroConfig';
import { HeroCTA } from './HeroCTA';

interface HeroContentProps {
  onOpenConsultation: () => void;
}

export const HeroContent: React.FC<HeroContentProps> = ({ onOpenConsultation }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -90 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.15, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="w-full lg:w-[54%] xl:w-[53%] px-6 sm:px-10 lg:pl-12 xl:pl-16 pr-3 lg:pr-4 z-[10] flex justify-center lg:justify-end pt-0 pb-4 sm:pb-6 shrink-0 self-center my-auto"
    >
      <div className="w-full max-w-[540px] xl:max-w-[580px] flex flex-col justify-center text-left my-auto translate-y-2 sm:translate-y-4 lg:translate-y-6 xl:translate-y-7">
        {/* 
          1. Main Positioning Headline:
          "Local Expertise." in pure radiant white with high contrast against the dark background.
          "Global Counsel." in warm radiant gold (#E5B842).
        */}
        <h1 className="text-[2.3rem] sm:text-[3.1rem] md:text-[3.5rem] lg:text-[3.9rem] xl:text-[4.3rem] font-sans font-bold leading-[1.03] tracking-[-0.02em] mb-3 sm:mb-4 drop-shadow-md">
          <span className="block whitespace-nowrap font-sans !text-white text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
            {heroConfig.headline.line1}
          </span>
          <span className="block whitespace-nowrap text-[#E5B842] italic font-semibold font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {heroConfig.headline.line2}
          </span>
        </h1>

        {/* 
          2. Core Practice Positioning Line:
          Advocates • Litigation • Legal Advisory
        */}
        <div className="flex items-center mb-4 sm:mb-5">
          <p className="font-sans text-[11.5px] sm:text-[13px] lg:text-[13.5px] uppercase tracking-[0.14em] !text-white text-white font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {heroConfig.headline.line3}
          </p>
        </div>

        {/* 
          4. Short Explanatory Sentence:
          Explaining courtroom litigation, advisory, and local-counsel services.
        */}
        <p className="font-sans text-[15px] sm:text-[16.5px] lg:text-[17px] !text-white/95 text-white/95 max-w-[500px] leading-[1.6] sm:leading-[1.65] mb-6 sm:mb-8 font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          {heroConfig.supportingText}
        </p>

        {/* CTA Buttons */}
        <HeroCTA onOpenConsultation={onOpenConsultation} />
      </div>
    </motion.div>
  );
};
