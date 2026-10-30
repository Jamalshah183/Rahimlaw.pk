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
      <div className="w-full max-w-[540px] xl:max-w-[580px] flex flex-col justify-center text-left my-auto">
        {/* 
          1. Main Positioning Headline:
          "Local Expertise." in crisp deep slate (#0F172A).
          "Global Counsel." in rich, prestigious brand copper (#612912).
        */}
        <h1 className="text-[2.3rem] sm:text-[3.1rem] md:text-[3.5rem] lg:text-[3.9rem] xl:text-[4.3rem] font-sans font-bold leading-[1.03] tracking-[-0.02em] mb-3 sm:mb-4">
          <span className="block whitespace-nowrap font-sans text-black">
            {heroConfig.headline.line1}
          </span>
          <span className="block whitespace-nowrap text-[#612912] italic font-semibold font-sans">
            {heroConfig.headline.line2}
          </span>
        </h1>

        {/* 
          2. Core Practice Positioning Line:
          Advocates • Litigation • Legal Advisory
        */}
        <div className="flex items-center mb-4 sm:mb-5">
          <p className="font-sans text-[11.5px] sm:text-[13px] lg:text-[13.5px] uppercase tracking-[0.14em] text-[#612912] font-bold">
            {heroConfig.headline.line3}
          </p>
        </div>

        {/* 
          3. Short Explanatory Sentence:
          Explaining courtroom litigation, advisory, and local-counsel services.
        */}
        <p className="font-sans text-[15px] sm:text-[16.5px] lg:text-[17px] text-[#334155] max-w-[500px] leading-[1.6] sm:leading-[1.65] mb-6 sm:mb-8 font-normal">
          {heroConfig.supportingText}
        </p>

        {/* CTA Buttons */}
        <HeroCTA onOpenConsultation={onOpenConsultation} />
      </div>
    </motion.div>
  );
};
