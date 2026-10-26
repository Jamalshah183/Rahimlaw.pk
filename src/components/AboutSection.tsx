import React, { useState, useEffect } from 'react';
import neutralChambersSmWebp from '../assets/images/chambers_architecture_neutral_sm.webp';
import neutralChambersMdWebp from '../assets/images/chambers_architecture_neutral_md.webp';
import neutralChambersLgWebp from '../assets/images/chambers_architecture_neutral_lg.webp';
import neutralChambersSmJpg from '../assets/images/chambers_architecture_neutral_sm.jpg';
import neutralChambersMdJpg from '../assets/images/chambers_architecture_neutral_md.jpg';
import neutralChambersLgJpg from '../assets/images/chambers_architecture_neutral_lg.jpg';

// Instant 0ms Base64 low-quality image placeholder (396 bytes)
const BLUR_PLACEHOLDER =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAANABgDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAUCAwQG/8QAIhAAAgIBAwQDAAAAAAAAAAAAAQIDEQAEEiEFEzFBIlFx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQP/xAAXEQEBAQEAAAAAAAAAAAAAAAAAEQIB/9oADAMBAAIRAxEAPwBlrNLEqyTJL8+bYiiwv36Oc/PrlgnaOHTxkq1BgxPrzm3rjxwQdjshtxDbiTfm8RjWKDueEMt8KDVcfmT3xTCVb2tjZJs88k/eGUCVnBJu784YWGV//9k=';

interface AboutSectionProps {
  onOpenConsultation?: () => void;
  onSelectPracticeForConsultation?: (practiceTitle: string) => void;
}

const STATS_DATA = [
  { value: '18+', label: 'Years Experience' },
  { value: '1,250+', label: 'Cases Handled' },
  { value: '340+', label: 'Corporate Matters' },
  { value: '30+', label: 'Courts & Tribunals' },
  { value: '98%', label: 'Client Satisfaction' },
];

const CREDIBILITY_PILLARS = [
  {
    number: '01',
    tabLabel: 'Who We Are',
    question: 'WHO WE ARE',
    titleMain: 'Established',
    titleAccent: 'Legal Practice',
    bullets: [
      'Dual chambers in Sialkot & Lahore',
      'High Courts & appellate bench counsel',
      'Direct senior partner advocacy',
    ],
  },
  {
    number: '02',
    tabLabel: 'What We Excel At',
    question: 'WHAT WE EXCEL AT',
    titleMain: 'Litigation &',
    titleAccent: 'Legal Advisory',
    bullets: [
      'Constitutional writs & stay orders',
      'Corporate governance & SECP matters',
      'Property title verification & disputes',
    ],
  },
  {
    number: '03',
    tabLabel: 'Who We Represent',
    question: 'WHO WE REPRESENT',
    titleMain: 'Domestic &',
    titleAccent: 'Global Counsel',
    bullets: [
      'Overseas Pakistanis in UK, US & Gulf',
      'Corporate & family business groups',
      'International law firm instructions',
    ],
  },
];

export const AboutSection: React.FC<AboutSectionProps> = () => {
  const [activePillarIndex, setActivePillarIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Automated continuous hands-free card progression (4.5s cycle per pillar - never pauses on hover)
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePillarIndex((prev) => (prev + 1) % CREDIBILITY_PILLARS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Prefetch image into browser memory cache for instantaneous rendering
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const targetSrc = isMobile ? neutralChambersSmWebp : neutralChambersLgWebp;
    const preloadImg = new Image();
    preloadImg.src = targetSrc;
    if (preloadImg.complete) {
      setImageLoaded(true);
    } else {
      preloadImg.onload = () => setImageLoaded(true);
    }
  }, []);

  const activePillar = CREDIBILITY_PILLARS[activePillarIndex];

  return (
    <section
      id="about"
      className="relative z-[10] -mt-16 sm:-mt-20 lg:-mt-24 xl:-mt-28 pt-20 sm:pt-24 md:pt-28 pb-24 sm:pb-28 lg:pb-36 bg-[#F6F6F6] rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] border-t-2 border-[#94542D]/20 shadow-[0_-25px_50px_-15px_rgba(69,36,21,0.12)] overflow-hidden font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ====================================================================
            1. INSPIRATION-ALIGNED CENTERED HEADER
            ==================================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          {/* Centered Headline matching Hero typography */}
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[2.85rem] font-bold text-[#452415] tracking-[-0.02em] leading-[1.12] mb-3.5 sm:mb-4">
            Bringing Disciplined Advocacy &{' '}
            <span className="font-sans italic font-semibold text-[#94542D]">
              Strategic Counsel
            </span>{' '}
            to Every Mandate
          </h2>

          {/* Centered Subtitle in Neue Haas Grotesk Display */}
          <p className="font-sans text-[14.5px] sm:text-[16px] text-[#612912]/80 leading-[1.65] font-normal max-w-2xl mx-auto">
            Established Pakistani legal practice operating from chambers in Sialkot and Lahore—serving domestic clients, commercial enterprises, overseas Pakistanis, and international law firms.
          </p>
        </div>

        {/* ====================================================================
            2. HERO FEATURED IMAGE (Gender-Neutral & Area-Neutral Law Chambers)
            ==================================================================== */}
        <div className="relative mb-6 sm:mb-8">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/8.5] lg:aspect-[21/9] rounded-[24px] sm:rounded-[34px] lg:rounded-[42px] overflow-hidden shadow-xl border border-[#94542D]/20 bg-[#452415] group">
            {/* Instant 0ms Base64 Blur Background (396 bytes) */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 filter blur-md scale-105 pointer-events-none ${
                imageLoaded ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ backgroundImage: `url(${BLUR_PLACEHOLDER})` }}
              aria-hidden="true"
            />

            {/* Responsive Next-Gen Picture */}
            <picture className="w-full h-full block">
              <source
                type="image/webp"
                srcSet={`${neutralChambersSmWebp} 640w, ${neutralChambersMdWebp} 960w, ${neutralChambersLgWebp} 1440w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1200px"
              />
              <source
                type="image/jpeg"
                srcSet={`${neutralChambersSmJpg} 640w, ${neutralChambersMdJpg} 960w, ${neutralChambersLgJpg} 1440w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1200px"
              />
              <img
                src={neutralChambersLgWebp}
                alt="Qadeer Legal Chambers conference room and judicial law library"
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-102 ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-90 scale-[1.01]'
                }`}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onLoad={() => setImageLoaded(true)}
                width="1376"
                height="768"
              />
            </picture>
          </div>
        </div>

        {/* ====================================================================
            3. REFINED STATS BAR (Soft Linen surface with Dark Walnut & Saddle Brown)
            ==================================================================== */}
        <div className="bg-[#F3F0E7] border border-[#94542D]/20 rounded-2xl py-3.5 sm:py-4 px-4 sm:px-6 shadow-[0_2px_8px_-2px_rgba(69,36,21,0.06)] mb-8 sm:mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-3 gap-x-2 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#94542D]/15">
            {STATS_DATA.map((stat, idx) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center justify-center text-center py-1 sm:py-0 ${
                  idx === 4 ? 'col-span-2 sm:col-span-1 pt-2.5 sm:pt-0' : idx > 1 ? 'pt-2.5 sm:pt-0' : ''
                } ${idx > 0 ? 'sm:pl-3 lg:pl-5' : ''}`}
              >
                <div className="font-sans text-xl sm:text-2xl lg:text-[1.65rem] font-bold text-[#452415] tracking-tight leading-none mb-1 [font-variant-numeric:lining-nums]">
                  {stat.value}
                </div>
                <div className="font-sans text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#94542D] leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====================================================================
            4. MOBILE INTERACTIVE PILLAR SWITCHER (Eliminates long scrolling!)
               Designed specifically for mobile devices with high attraction
            ==================================================================== */}
        {/* ====================================================================
            4. MOBILE INTERACTIVE PILLAR SWITCHER (Eliminates long scrolling!)
               Designed specifically for mobile devices with high attraction
            ==================================================================== */}
        {/* ====================================================================
            4. AUTOMATED CREDIBILITY PILLAR PRESENTATION (Mobile)
            ==================================================================== */}
        <div className="block md:hidden">
          {/* Minimalist Automated Presentation Card */}
          <div className="relative rounded-2xl bg-[#F3F0E7] border border-[#94542D]/30 shadow-[0_4px_24px_-4px_rgba(69,36,21,0.08)] p-6 sm:p-7 overflow-hidden text-center transition-all duration-300">
            {/* Top Saddle Brown Hairline Accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#94542D] to-transparent opacity-90"
              aria-hidden="true"
            />

            {/* Animated Pillar Content Block */}
            <div key={activePillarIndex} className="animate-card-fade-in flex flex-col items-center">
              {/* Category Eyebrow Text */}
              <div className="mb-2 text-center">
                <span className="font-sans text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#94542D]">
                  {activePillar.question}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#452415] tracking-[-0.02em] leading-normal text-center whitespace-nowrap truncate w-full mb-3">
                <span className="inline font-sans">{activePillar.titleMain} </span>
                <span className="font-sans italic font-semibold text-[#94542D] inline">
                  {activePillar.titleAccent}
                </span>
              </h3>

              {/* Symmetrical Minimalist Center Divider */}
              <div className="w-8 h-[1px] bg-[#94542D]/25 mx-auto mb-4" aria-hidden="true" />

              {/* Focused Key Points */}
              <ul className="space-y-2.5 w-full text-center mb-0">
                {activePillar.bullets.map((bullet, bIdx) => (
                  <li
                    key={bIdx}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#F6F6F6] border border-[#94542D]/15 text-[#452415] w-full overflow-hidden text-center"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94542D] shrink-0" />
                    <span className="font-sans text-[12.5px] sm:text-[13px] font-medium whitespace-nowrap truncate text-center">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ====================================================================
            5. DESKTOP 3-COLUMN CREDIBILITY GRID (For tablet & desktop screens)
            ==================================================================== */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {CREDIBILITY_PILLARS.map((pillar) => (
            <div
              key={pillar.number}
              className="group relative h-full rounded-2xl bg-gradient-to-b from-[#F3F0E7] via-[#F6F6F6] to-[#F3F0E7] border border-[#94542D]/25 hover:border-[#94542D] shadow-[0_4px_20px_-4px_rgba(69,36,21,0.06)] hover:shadow-[0_20px_45px_-12px_rgba(69,36,21,0.2),0_0_0_1px_rgba(148,84,45,0.35)] transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between"
            >
              {/* Top Accent Filigree */}
              <div className="h-[3px] bg-gradient-to-r from-[#452415] via-[#94542D] to-[#452415] group-hover:h-[4px] transition-all shrink-0" aria-hidden="true" />

              {/* Dark Walnut & Saddle Brown Header Bar */}
              <div className="bg-gradient-to-r from-[#452415] via-[#612912] to-[#452415] px-5 py-3.5 border-b border-[#94542D]/30 flex items-center justify-center text-center relative overflow-hidden shrink-0">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#452415]/60 via-transparent to-[#452415]/30 pointer-events-none"
                  aria-hidden="true"
                />
                
                {/* Eyebrow Label */}
                <span className="relative z-10 font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[#F3F0E7] drop-shadow-xs whitespace-nowrap truncate text-center">
                  {pillar.question}
                </span>
              </div>

              {/* Editorial Card Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col items-center justify-between text-center relative">
                <div className="w-full flex flex-col items-center text-center">
                  {/* Card Title */}
                  <h3 className="font-sans text-lg sm:text-xl lg:text-[1.35rem] font-bold text-[#452415] group-hover:text-[#94542D] tracking-[-0.02em] leading-normal text-center whitespace-nowrap truncate w-full transition-colors mb-0">
                    <span className="inline font-sans">{pillar.titleMain} </span>
                    <span className="font-sans italic font-semibold text-[#94542D] inline">
                      {pillar.titleAccent}
                    </span>
                  </h3>

                  {/* Symmetrical Dual-Tone Divider */}
                  <div className="flex items-center justify-center gap-2 my-4 w-full" aria-hidden="true">
                    <div className="h-[1.5px] w-8 lg:w-10 bg-gradient-to-r from-transparent via-[#94542D] to-[#452415]" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-[#94542D] shrink-0" />
                    <div className="h-[1.5px] w-8 lg:w-10 bg-gradient-to-l from-transparent via-[#94542D] to-[#452415]" />
                  </div>

                  {/* Focused Practice Points */}
                  <ul className="space-y-2.5 w-full text-center">
                    {pillar.bullets.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#F6F6F6] border border-[#94542D]/15 group-hover:bg-[#F3F0E7] group-hover:border-[#94542D]/35 transition-all duration-300 w-full overflow-hidden text-center"
                      >
                        <span className="w-1.5 h-1.5 rotate-45 bg-[#94542D] border border-[#F3F0E7] shrink-0 group-hover:bg-[#612912] transition-colors" />
                        <span className="font-sans text-[12.5px] lg:text-[13px] font-medium text-[#452415] whitespace-nowrap truncate text-center">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
