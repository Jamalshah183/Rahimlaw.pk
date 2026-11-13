import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePortalStore } from '../lib/portalStore';

export const Testimonials: React.FC = () => {
  const { reviews } = usePortalStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeTestimonials = (reviews || [])
    .filter((r) => r.status !== 'archived')
    .map((r) => ({
      id: r.id,
      quote: r.reviewText,
      clientName: r.clientInitials,
      matterArea: r.caseType || r.clientRole,
      location: r.location,
    }));

  // Automatically step through reviews one by one with zero heavy animation
  useEffect(() => {
    if (activeTestimonials.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) =>
        prev >= activeTestimonials.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeTestimonials.length]);

  if (activeTestimonials.length === 0) return null;

  const safeIndex = currentIndex < activeTestimonials.length ? currentIndex : 0;
  const current = activeTestimonials[safeIndex];

  return (
    <section
      id="testimonials"
      className="relative z-[15] -mt-10 sm:-mt-12 lg:-mt-14 min-h-screen lg:min-h-[105vh] xl:min-h-[112vh] flex flex-col justify-center pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 pb-24 sm:pb-28 md:pb-32 lg:pb-36 xl:pb-40 bg-gradient-to-b from-[#612912] via-[#612912] to-[#452415] text-white rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] border-t-2 border-[#E5B842]/40 shadow-[0_-25px_50px_-15px_rgba(148, 84, 45,0.35)] overflow-hidden"
    >
      {/* Background Atmosphere: Royal Chamber copper Canvas */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Soft Radial Vignette */}
        <div
          className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/40 pointer-events-none"
          aria-hidden="true"
        />

        {/* Warm Gold Ambient Halo */}
        <div
          className="absolute top-1/3 right-1/4 w-[40rem] h-[40rem] bg-[#E5B842]/[0.10] rounded-full blur-[140px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Royal copper Radial Ambient Glow */}
        <div
          className="absolute bottom-1/4 left-1/4 w-[38rem] h-[38rem] bg-[#612912]/40 rounded-full blur-[150px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Top/Bottom Edge Feathers */}
        <div
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#612912]/80 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#452415]/90 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header with Fade & Slide Down */}
        <motion.div
          initial={{ opacity: 0, y: -22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-[1px] w-7 bg-[#F5D061]" aria-hidden="true" />
            <span className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[#F5D061]">
              CLIENT TESTIMONIALS
            </span>
            <span className="h-[1px] w-7 bg-[#F5D061]" aria-hidden="true" />
          </div>

          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[3.25rem] xl:text-[3.6rem] font-bold !text-white text-white leading-[1.08] tracking-[-0.02em] mb-4">
            <span className="!text-white text-white" style={{ color: '#FFFFFF' }}>
              Trusted by Those We
            </span>{' '}
            <span className="font-sans italic font-semibold text-[#F5D061]">Represent</span>
          </h2>

          <p className="font-sans text-[15.5px] sm:text-[17px] text-[#F3F0E7] leading-[1.65] font-normal">
            Reflections from clients regarding our strategic representation, discretion, and courtroom advocacy.
          </p>
        </motion.div>

        {/* Carousel Container with Scale & Floating Elevation Reveal */}
        <div className="max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="relative bg-[#452415]/75 backdrop-blur-xs rounded-2xl p-8 sm:p-12 md:p-16 border border-[#E5B842]/35 shadow-[0_20px_50px_rgba(0,0,0,0.30)]"
          >
            {/* Gold Quotation Mark Icon */}
            <div className="absolute top-6 left-8 sm:top-10 sm:left-12">
              <Quote className="w-12 h-12 sm:w-16 sm:h-16 text-[#F5D061]/25 -scale-x-100" />
            </div>

            <div className="relative z-10 pt-4 sm:pt-6">
              {/* 
                1x1 CSS Grid Stack:
                Locks the quote container height to the tallest review at every responsive breakpoint
                so the card and section never resize or push the next section when reviews change.
              */}
              <div className="grid grid-cols-1 grid-rows-1 items-center mb-8">
                {activeTestimonials.map((item, idx) => {
                  const isActive = idx === safeIndex;
                  return (
                    <blockquote
                      key={item.id}
                      aria-hidden={!isActive}
                      className={`col-start-1 row-start-1 font-sans text-lg sm:text-xl md:text-[1.35rem] lg:text-[1.45rem] font-medium italic text-white leading-[1.5] tracking-[-0.01em] ${
                        isActive ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none select-none'
                      }`}
                    >
                      “{item.quote}”
                    </blockquote>
                  );
                })}
              </div>

              {/* Client Info Lockup */}
              <div className="pt-6 border-t border-[#E5B842]/25">
                <div className="font-sans text-base sm:text-lg font-bold tracking-[-0.01em] text-[#F5D061]">
                  {current.clientName}
                </div>
                <div className="font-sans text-[12px] font-medium text-[#F3F0E7] tracking-[0.03em] mt-0.5">
                  {current.matterArea} {current.location ? `· ${current.location}` : ''}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dots Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center gap-2 mt-6"
          >
            {activeTestimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  safeIndex === i ? 'w-8 bg-[#E5B842]' : 'w-2 bg-[#E5B842]/35 hover:bg-[#E5B842]/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
