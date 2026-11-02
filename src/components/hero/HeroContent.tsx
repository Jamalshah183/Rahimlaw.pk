import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Briefcase, ShieldCheck } from 'lucide-react';
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
      className="w-full lg:w-[54%] xl:w-[53%] px-4 sm:px-6 lg:pl-[125px] xl:pl-[135px] 2xl:pl-[145px] lg:pr-6 xl:pr-8 z-[10] flex justify-center lg:justify-center pt-0 pb-4 sm:pb-6 shrink-0 self-center my-auto relative"
    >
      <div className="w-full max-w-[490px] xl:max-w-[530px] 2xl:max-w-[560px] flex flex-col justify-center text-left my-auto -mt-2 sm:-mt-3 lg:-mt-8 xl:-mt-10">
        {/* 
          1. Main Positioning Headline:
          "Local Expertise." in crisp deep slate (#0F172A).
          "Global Counsel." in rich, prestigious brand copper (#612912).
        */}
        <h1 className="text-[2.4rem] sm:text-[3.2rem] md:text-[3.5rem] lg:text-[3.5rem] xl:text-[3.9rem] font-sans font-bold leading-[1.03] tracking-[-0.02em] mb-3 sm:mb-4">
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
          <p className="font-sans text-[12.5px] sm:text-[13.5px] lg:text-[14px] uppercase tracking-[0.14em] text-[#612912] font-bold">
            {heroConfig.headline.line3}
          </p>
        </div>

        {/* 
          3. Short Explanatory Sentence:
          Explaining courtroom litigation, advisory, and local-counsel services.
        */}
        <p className="font-sans text-[16px] sm:text-[17.5px] lg:text-[18px] text-[#334155] max-w-[520px] leading-[1.6] sm:leading-[1.65] mb-5 sm:mb-6 font-normal">
          {heroConfig.supportingText}
        </p>

        {/* CTA Buttons */}
        <HeroCTA onOpenConsultation={onOpenConsultation} />

        {/* 
          4. 3 Favicons & Headings:
          - Stuck to the left side of the screen (lg:left-3 xl:left-6)
          - Connecting line removed
          - Icons above headers
          - First icon aligns with upper border of right content (top-0)
          - Last icon sits below bottom border of right content (lg:-bottom-8 xl:-bottom-10)
        */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-[#612912]/15 lg:border-t-0 lg:pt-0 lg:mt-0 lg:absolute lg:left-6 xl:left-8 2xl:left-12 lg:-top-5 xl:-top-6 lg:bottom-6 xl:bottom-6 grid grid-cols-3 gap-2 lg:flex lg:flex-col lg:justify-between items-center z-20">
          {/* Item 1 - Aligns with upper border */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <span className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#612912] text-[#E5B842] flex items-center justify-center shadow-md border-2 border-[#E5B842]/45 group-hover:scale-108 transition-transform duration-200 shrink-0">
              <Scale className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            </span>
            <h3 className="font-sans font-bold text-[11px] sm:text-[11.5px] uppercase tracking-[0.06em] text-[#0F172A] mt-2 text-center max-w-[95px] leading-tight">
              Court Advocates
            </h3>
          </div>

          {/* Item 2 - Centered */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <span className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#612912] text-[#E5B842] flex items-center justify-center shadow-md border-2 border-[#E5B842]/45 group-hover:scale-108 transition-transform duration-200 shrink-0">
              <Briefcase className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            </span>
            <h3 className="font-sans font-bold text-[11px] sm:text-[11.5px] uppercase tracking-[0.06em] text-[#0F172A] mt-2 text-center max-w-[95px] leading-tight">
              Corporate Advisory
            </h3>
          </div>

          {/* Item 3 - Below bottom border */}
          <div className="relative z-10 flex flex-col items-center text-center group">
            <span className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#612912] text-[#E5B842] flex items-center justify-center shadow-md border-2 border-[#E5B842]/45 group-hover:scale-108 transition-transform duration-200 shrink-0">
              <ShieldCheck className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            </span>
            <h3 className="font-sans font-bold text-[11px] sm:text-[11.5px] uppercase tracking-[0.06em] text-[#0F172A] mt-2 text-center max-w-[95px] leading-tight">
              Client Privilege
            </h3>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
