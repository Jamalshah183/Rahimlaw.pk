import React, { useState } from 'react';
import {
  Scale,
  Award,
  Landmark,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { FIRM_CONFIG } from '../data/firmData';
import studioPhotoWebp from '../assets/images/principal_advocate_studio_opt.webp';
import studioPhotoPng from '../assets/images/principal_advocate_studio_opt.png';

// Direct fallback to user-provided studio photoshoot link (https://ibb.co/4n2y6d79)
const REMOTE_STUDIO_IMG = 'https://i.ibb.co/ksJnR1xk/Untitled-design-7.png';

export const PrincipalAdvocateSection: React.FC = () => {
  const [imgSrc, setImgSrc] = useState<string>(studioPhotoWebp);

  const whatsappText =
    'Assalam-o-Alaikum, I would like to request a consultation with Senior Counsel Mr. Rahim Nawaz Khan Abbasi.';
  const whatsappHref = `https://wa.me/${FIRM_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    whatsappText
  )}`;

  return (
    <section
      id="principal-advocate"
      className="relative z-[11] -mt-10 sm:-mt-12 lg:-mt-14 pt-16 sm:pt-20 lg:pt-24 pb-10 sm:pb-12 lg:pb-14 bg-[#452415] text-white rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] border-t-2 border-[#94542D]/40 shadow-[0_-25px_50px_-15px_rgba(69,36,21,0.5)] overflow-hidden font-sans"
    >
      {/* 1. Dark Walnut Atmospheric Lighting */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#452415] via-[#612912] to-[#452415] pointer-events-none"
        aria-hidden="true"
      />
      {/* Warm Saddle Brown Studio Spotlight Halo behind the Advocate */}
      <div
        className="absolute top-1/4 right-1/4 lg:right-1/3 w-[36rem] h-[36rem] bg-[#94542D]/15 rounded-full blur-[110px] pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle Studio Vignette */}
      <div
        className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/45 pointer-events-none"
        aria-hidden="true"
      />

      {/* 2. Delicate Fine-Art Poster Boundary Rules */}
      <div
        className="absolute inset-4 sm:inset-6 lg:inset-8 rounded-[36px] sm:rounded-[48px] border border-[#94542D]/30 pointer-events-none z-[1]"
        aria-hidden="true"
      />

      {/* 3. Massive Background Typographic Poster Layer */}
      <div
        className="absolute top-14 sm:top-20 lg:top-24 inset-x-0 flex flex-col items-center justify-center text-center select-none pointer-events-none z-[2] overflow-hidden"
        aria-hidden="true"
      >
        <span className="font-sans font-black text-[13vw] lg:text-[11vw] leading-[0.82] tracking-[-0.04em] text-white/[0.05] uppercase whitespace-nowrap">
          SENIOR COUNSEL
        </span>
        <span className="font-sans font-black text-[6.5vw] lg:text-[5.5vw] leading-[0.85] tracking-[-0.03em] text-[#94542D]/[0.12] uppercase whitespace-nowrap mt-1">
          RAHIM NAWAZ KHAN ABBASI
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Artistic Poster Masthead / Top Register */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 border-b border-[#94542D]/30 pb-3.5 mb-6 sm:mb-10">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94542D]" aria-hidden="true" />
            <span className="font-sans text-[10.5px] sm:text-[12px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#F3F0E7]">
              FOUNDING MEMBER & SENIOR COUNSEL
            </span>
          </div>

          <div className="font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#F3F0E7]/80 font-semibold">
            EXECUTIVE LEADERSHIP DOSSIER
          </div>

          <div className="flex items-center gap-1.5 font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#94542D] font-semibold">
            <span>HIGH COURT & TRIBUNALS</span>
          </div>
        </div>

        {/* Poster Composition */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 items-end">
          {/* Left Column */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-center items-center text-center sm:items-start sm:text-left self-center order-1 pt-28 pb-2 sm:pt-10 sm:pb-4 lg:pt-14 lg:pb-8 z-20">
            {/* Poster Title */}
            <h2 className="font-sans font-bold text-[2.2rem] sm:text-4.5xl md:text-[3rem] lg:text-[3.5rem] xl:text-[4.2rem] text-[#F6F6F6] leading-[1.05] sm:leading-[1.02] tracking-[-0.02em] mb-3.5 sm:mb-4 drop-shadow-sm text-center sm:text-left">
              <span className="block whitespace-nowrap">Mr. Rahim Nawaz</span>
              <span className="block whitespace-nowrap text-[#F3F0E7] italic font-semibold">
                Khan Abbasi
              </span>
            </h2>

            {/* Practice Designation Line */}
            <div className="flex items-center justify-center sm:justify-start mb-4.5 sm:mb-5">
              <p className="font-sans text-[11px] sm:text-[12.5px] md:text-[13px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#F3F0E7] font-bold">
                Advocate High Court · Founding Member
              </p>
            </div>

            {/* High-Impact Editorial Statement */}
            <p className="font-sans text-[14px] sm:text-[15px] lg:text-[16.5px] text-[#F6F6F6]/90 leading-[1.65] sm:leading-[1.65] font-normal mb-6 sm:mb-8 max-w-lg text-center sm:text-left mx-auto sm:mx-0">
              Senior Counsel overseeing Taxation, Corporate and Company Laws, Intellectual Property, Banking, and NBFCs. Vast experience in complex tax and corporate cases with individuals, AOPs, and corporations.
            </p>

            {/* Credentials in vertical stack */}
            <div className="flex flex-col items-center sm:items-start gap-3.5 sm:gap-4 mb-6 sm:mb-8 max-w-lg w-full">
              <div className="flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-white mb-0.5 sm:mb-1">
                  <Award className="w-3.5 h-3.5 text-[#94542D] shrink-0" aria-hidden="true" />
                  <span className="font-sans text-[15px] sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight whitespace-nowrap text-[#F6F6F6]">
                    M.Phil & MBA
                  </span>
                </div>
                <div className="font-sans text-[10.5px] sm:text-[11px] md:text-[11.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-[#F3F0E7]/80 font-semibold whitespace-nowrap">
                  Finance & Corporate Strategy
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-white mb-0.5 sm:mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#94542D] shrink-0" aria-hidden="true" />
                  <span className="font-sans text-[15px] sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight whitespace-nowrap text-[#F6F6F6]">
                    Fellow ICSP & FBR
                  </span>
                </div>
                <div className="font-sans text-[10.5px] sm:text-[11px] md:text-[11.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-[#F3F0E7]/80 font-semibold whitespace-nowrap">
                  Registered Tax Practitioner
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-white mb-0.5 sm:mb-1">
                  <Landmark className="w-3.5 h-3.5 text-[#94542D] shrink-0" aria-hidden="true" />
                  <span className="font-sans text-[15px] sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight whitespace-nowrap text-[#F6F6F6]">
                    Corporate & Banking
                  </span>
                </div>
                <div className="font-sans text-[10.5px] sm:text-[11px] md:text-[11.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-[#F3F0E7]/80 font-semibold whitespace-nowrap">
                  Institute of Bankers Member
                </div>
              </div>
            </div>

            {/* CTA Button matching Website & Hero Style */}
            <div className="flex flex-col items-center sm:items-start mb-2 md:mb-0">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-7 sm:py-4 rounded-full bg-[#94542D] hover:bg-[#a65f33] text-white font-sans text-[11.5px] sm:text-[13px] uppercase tracking-[0.08em] font-bold shadow-xl sm:shadow-2xl transition-all duration-200 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span>Consult Senior Counsel</span>
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Right Column: CEO Studio Cutout Image sticking directly to the start of the next section's upper border */}
          <div className="md:col-span-6 lg:col-span-7 order-2 relative flex items-end justify-center md:justify-end self-end h-[500px] sm:h-[560px] md:h-[700px] lg:h-[920px] xl:h-[1000px] -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full z-10 pointer-events-none select-none mb-0">
            {/* The Cutout Image: Zero white box, transparent PNG, sticking flush to next section upper border with hands & law book in full view */}
            <picture className="w-full h-full flex items-end justify-center md:justify-end">
              <source srcSet={studioPhotoWebp} type="image/webp" />
              <img
                src={imgSrc}
                onError={() => {
                  if (imgSrc !== REMOTE_STUDIO_IMG) {
                    setImgSrc(REMOTE_STUDIO_IMG);
                  } else if (imgSrc !== studioPhotoPng) {
                    setImgSrc(studioPhotoPng);
                  }
                }}
                alt="Mr. Rahim Nawaz Khan Abbasi — Founding Member & Senior Counsel"
                loading="eager"
                decoding="async"
                className="w-auto h-full max-h-[1040px] object-contain object-bottom drop-shadow-[0_25px_45px_rgba(0,0,0,0.7)] scale-125 sm:scale-105 lg:scale-110 xl:scale-115 origin-bottom translate-y-0.5 sm:translate-y-1 lg:translate-y-1.5"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  );
};
