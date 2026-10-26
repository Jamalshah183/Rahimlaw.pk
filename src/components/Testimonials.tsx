import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { FIRM_CONFIG } from '../data/firmData';

export const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Automatically step through reviews one by one with zero heavy animation
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) =>
        prev === FIRM_CONFIG.testimonials.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const current = FIRM_CONFIG.testimonials[currentIndex];

  return (
    <section
      id="testimonials"
      className="relative z-[15] -mt-10 sm:-mt-12 lg:-mt-14 min-h-screen lg:min-h-[105vh] xl:min-h-[112vh] flex flex-col justify-center pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 pb-24 sm:pb-28 md:pb-32 lg:pb-36 xl:pb-40 bg-gradient-to-b from-[#452415] via-[#612912] to-[#452415] text-[#F6F6F6] rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] border-t-2 border-[#94542D]/40 shadow-[0_-25px_50px_-15px_rgba(69,36,21,0.5)] overflow-hidden"
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Soft Radial Vignette */}
        <div
          className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/45 pointer-events-none"
          aria-hidden="true"
        />

        {/* Saddle Brown Ambient Halo */}
        <div
          className="absolute top-1/3 right-1/4 w-[40rem] h-[40rem] bg-[#94542D]/[0.15] rounded-full blur-[140px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Dark Walnut Radial Glow */}
        <div
          className="absolute bottom-1/4 left-1/4 w-[38rem] h-[38rem] bg-[#452415]/60 rounded-full blur-[150px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Top/Bottom Edge Feathers */}
        <div
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#452415]/80 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#452415]/90 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-[1px] w-7 bg-[#94542D]" aria-hidden="true" />
            <span className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[#F3F0E7]">
              CLIENT TESTIMONIALS
            </span>
            <span className="h-[1px] w-7 bg-[#94542D]" aria-hidden="true" />
          </div>

          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[3.25rem] xl:text-[3.6rem] font-bold text-[#F6F6F6] leading-[1.08] tracking-[-0.02em] mb-4">
            Trusted by Those We{' '}
            <span className="font-sans italic font-semibold text-[#F3F0E7]">Represent</span>
          </h2>

          <p className="font-sans text-[15.5px] sm:text-[17px] text-[#F6F6F6]/85 leading-[1.65] font-normal">
            Reflections from clients regarding our strategic representation, discretion, and courtroom advocacy.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="max-w-4xl mx-auto w-full">
          <div className="relative bg-[#452415]/85 backdrop-blur-xs rounded-2xl p-8 sm:p-12 md:p-16 border border-[#94542D]/35 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            {/* Quotation Mark Icon */}
            <div className="absolute top-6 left-8 sm:top-10 sm:left-12">
              <Quote className="w-12 h-12 sm:w-16 sm:h-16 text-[#94542D]/25 -scale-x-100" />
            </div>

            <div className="relative z-10 pt-4 sm:pt-6">
              <div className="grid grid-cols-1 grid-rows-1 items-center mb-8">
                {FIRM_CONFIG.testimonials.map((item, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <blockquote
                      key={item.id}
                      aria-hidden={!isActive}
                      className={`col-start-1 row-start-1 font-sans text-lg sm:text-xl md:text-[1.35rem] lg:text-[1.45rem] font-medium italic text-[#F6F6F6] leading-[1.5] tracking-[-0.01em] ${
                        isActive ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none select-none'
                      }`}
                    >
                      “{item.quote}”
                    </blockquote>
                  );
                })}
              </div>

              {/* Client Info Lockup */}
              <div className="pt-6 border-t border-[#94542D]/30">
                <div className="font-sans text-base sm:text-lg font-bold tracking-[-0.01em] text-[#F3F0E7]">
                  {current.clientName}
                </div>
                <div className="font-sans text-[12px] font-medium text-[#F6F6F6]/80 tracking-[0.03em] mt-0.5">
                  {current.matterArea} {current.location ? `· ${current.location}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {FIRM_CONFIG.testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === i ? 'w-8 bg-[#94542D]' : 'w-2 bg-[#94542D]/35 hover:bg-[#94542D]/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
