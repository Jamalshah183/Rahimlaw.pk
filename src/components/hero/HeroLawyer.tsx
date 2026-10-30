import React from 'react';
import { motion } from 'framer-motion';
import { heroConfig } from '../../data/heroConfig';

export const HeroLawyer: React.FC = () => {
  return (
    <div
      className="relative lg:absolute lg:bottom-0 lg:left-[61.5%] xl:left-[62%] lg:-translate-x-1/2 lg:translate-y-[15%] xl:translate-y-[16%] w-full lg:w-auto flex items-end justify-center z-[5] pointer-events-none select-none mt-6 lg:mt-0 -mb-16 sm:-mb-20 lg:mb-0"
    >
      <motion.div
        initial={{ opacity: 0, y: 180 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-end justify-center"
      >
        {/* 
          Foreground Statue of Justice Cutout:
          - Shifted slightly right (61.5% - 62%) so Lady Justice's head aligns directly on the border
            between the left brown background (58%) and the right cream background.
          - Sized with a slight increase (max-h-[815px], 86vh-89vh) for grand presence while preserving
            clear breathing room below the navbar.
          - Vertically center-aligned with the writing on the left.
          - Below side of the statue extends down behind the second section (AboutSection, z-[10]),
            giving the visual sensation of being inserted into the next section.
          - The upper rounded border of the second section stays in front as before.
        */}
        <img
          src={heroConfig.lawyerImage}
          alt="Statue of Lady Justice - Rahim Law Associates"
          referrerPolicy="no-referrer"
          className="h-[62vh] sm:h-[74vh] lg:h-[86vh] xl:h-[89vh] max-h-[815px] min-h-[470px] lg:min-h-[630px] w-auto max-w-[85vw] sm:max-w-[80vw] lg:max-w-none object-contain object-bottom drop-shadow-[-12px_18px_25px_rgba(0,0,0,0.55)] drop-shadow-[0_30px_45px_rgba(0,0,0,0.5)] pointer-events-auto transition-transform duration-300"
          loading="eager"
        />
      </motion.div>
    </div>
  );
};
