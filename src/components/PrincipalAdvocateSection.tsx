import React from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Award,
  Landmark,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { FIRM_CONFIG } from '../data/firmData';

// User-provided studio photoshoot link (https://ibb.co/j9cNC5r6)
const REMOTE_STUDIO_IMG = 'https://i.ibb.co/nqHGX0Lg/Untitled-design.png';

export const PrincipalAdvocateSection: React.FC = () => {

  const whatsappText =
    'Assalam-o-Alaikum Rahim Law Associates, I would like to request a consultation with Senior Counsel Mr. Rahim Nawaz Khan Abbasi.';
  const whatsappHref = `https://wa.me/${FIRM_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    whatsappText
  )}`;

  return (
    <section
      id="principal-advocate"
      className="relative z-[11] -mt-10 sm:-mt-12 lg:-mt-14 pt-16 sm:pt-20 lg:pt-24 pb-10 sm:pb-12 lg:pb-14 bg-[#612912] text-white rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] border-t-2 border-[#E5B842]/40 shadow-[0_-25px_50px_-15px_rgba(148, 84, 45,0.35)] overflow-hidden font-sans"
    >
      {/* 1. Atmospheric Lighting */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#612912] via-[#612912] to-[#452415] pointer-events-none"
        aria-hidden="true"
      />
      {/* Warm Golden Studio Spotlight Halo behind the Counsel */}
      <div
        className="absolute top-1/4 right-1/4 lg:right-1/3 w-[36rem] h-[36rem] bg-[#E5B842]/12 rounded-full blur-[110px] pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle Studio Vignette */}
      <div
        className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/35 pointer-events-none"
        aria-hidden="true"
      />

      {/* 2. Delicate Fine-Art Poster Boundary Rules */}
      <div
        className="absolute inset-4 sm:inset-6 lg:inset-8 rounded-[36px] sm:rounded-[48px] border border-[#E5B842]/20 pointer-events-none z-[1]"
        aria-hidden="true"
      />

      {/* 3. Background Typographic Poster Layer */}
      <div
        className="absolute top-14 sm:top-20 lg:top-24 inset-x-0 flex flex-col items-center justify-center text-center select-none pointer-events-none z-[2] overflow-hidden"
        aria-hidden="true"
      >
        <span className="font-sans font-black text-[12vw] lg:text-[10vw] leading-[0.82] tracking-[-0.04em] text-white/[0.06] uppercase whitespace-nowrap">
          FOUNDING MEMBER
        </span>
        <span className="font-sans font-black text-[6vw] lg:text-[5.2vw] leading-[0.85] tracking-[-0.03em] text-[#E5B842]/[0.08] uppercase whitespace-nowrap mt-1">
          RAHIM NAWAZ KHAN ABBASI
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Artistic Poster Masthead / Top Register */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6 }}
          className="hidden sm:flex flex-wrap items-center justify-between gap-3 border-b border-[#E5B842]/25 pb-3 sm:pb-3.5 mb-3 sm:mb-5 lg:mb-6"
        >
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5B842]" aria-hidden="true" />
            <span className="font-sans text-[10.5px] sm:text-[12px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#E5B842]">
              RAHIM LAW ASSOCIATES
            </span>
          </div>

          <div className="font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-white/70 font-semibold">
            EXECUTIVE LEADERSHIP DOSSIER
          </div>

          <div className="flex items-center gap-1.5 font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#E5B842] font-semibold">
            <span>ISLAMABAD · NATIONWIDE & GLOBAL</span>
          </div>
        </motion.div>

        {/* Poster Composition */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 items-end -mt-2 sm:-mt-5 lg:-mt-7">
          {/* Left Column: Typography */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="md:col-span-6 lg:col-span-5 flex flex-col justify-center items-center text-center sm:items-start sm:text-left self-center order-1 pt-24 sm:pt-4 lg:pt-6 pb-2 sm:pb-4 lg:pb-8 z-25 mt-8 sm:mt-0"
          >
            {/* Poster Title */}
            <h2 className="font-sans font-bold text-[2.1rem] sm:text-4xl md:text-[2.9rem] lg:text-[3.3rem] xl:text-[3.8rem] text-white leading-[1.05] sm:leading-[1.02] tracking-[-0.02em] mb-3.5 sm:mb-4 drop-shadow-sm text-center sm:text-left">
              <span className="block whitespace-nowrap !text-white text-white">Mr. Rahim</span>
              <span className="block whitespace-nowrap text-[#E5B842] italic font-semibold">
                Nawaz Khan Abbasi
              </span>
            </h2>

            {/* Practice Designation Line */}
            <div className="flex items-center justify-center sm:justify-start mb-4.5 sm:mb-5">
              <p className="font-sans text-[11px] sm:text-[12.5px] md:text-[13px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-white font-bold">
                Advocate High Court · Founding Member
              </p>
            </div>

            {/* Editorial Statement */}
            <p className="font-sans text-[14px] sm:text-[15px] lg:text-[16px] text-white/90 leading-[1.65] sm:leading-[1.65] font-normal mb-6 sm:mb-8 max-w-lg text-center sm:text-left mx-auto sm:mx-0">
              Senior Counsel overseeing Taxation, Corporate and Company Laws, Intellectual Property, Banking, and NBFCs. Vast experience handling tax and corporate cases for individuals, AOPs, and companies. Law graduate holding M.Phil (Finance) and MBA degrees, Fellow Member of ICSP, Member of IBP, and FBR Registered Tax Practitioner.
            </p>

            {/* Credentials in vertical stack */}
            <div className="flex flex-col items-center sm:items-start gap-3.5 sm:gap-4 mb-6 sm:mb-8 max-w-lg w-full">
              <div className="flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-white mb-0.5 sm:mb-1">
                  <Award className="w-3.5 h-3.5 text-[#E5B842] shrink-0" aria-hidden="true" />
                  <span className="font-sans text-[14px] sm:text-lg md:text-xl lg:text-[1.35rem] font-bold leading-tight text-white">
                    M.Phil (Finance) & MBA
                  </span>
                </div>
                <div className="font-sans text-[10.5px] sm:text-[11px] md:text-[11.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-white/75 font-semibold">
                  Academic Degrees
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-white mb-0.5 sm:mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E5B842] shrink-0" aria-hidden="true" />
                  <span className="font-sans text-[14px] sm:text-lg md:text-xl lg:text-[1.35rem] font-bold leading-tight text-white">
                    ICSP Fellow & IBP Member
                  </span>
                </div>
                <div className="font-sans text-[10.5px] sm:text-[11px] md:text-[11.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-white/75 font-semibold">
                  Professional Memberships
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-white mb-0.5 sm:mb-1">
                  <Landmark className="w-3.5 h-3.5 text-[#E5B842] shrink-0" aria-hidden="true" />
                  <span className="font-sans text-[14px] sm:text-lg md:text-xl lg:text-[1.35rem] font-bold leading-tight text-white">
                    FBR Registered
                  </span>
                </div>
                <div className="font-sans text-[10.5px] sm:text-[11px] md:text-[11.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em] text-white/75 font-semibold">
                  Tax Practitioner
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col items-center sm:items-start mb-2 md:mb-0">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-7 sm:py-4 rounded-full bg-[#E5B842] hover:bg-[#d4a833] text-[#452415] font-sans text-[11.5px] sm:text-[13px] uppercase tracking-[0.08em] font-bold shadow-xl sm:shadow-2xl transition-all duration-200 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#452415]" />
                <span>Consult Senior Counsel</span>
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#452415] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </motion.div>

          {/* Right Column: Image */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="md:col-span-6 lg:col-span-7 order-2 relative flex items-end justify-center md:justify-end self-end h-[560px] sm:h-[640px] md:h-[780px] lg:h-[1020px] xl:h-[1120px] -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full z-10 pointer-events-none select-none mb-0"
          >
            <div className="w-full h-full flex items-end justify-center md:justify-end">
              <img
                src={REMOTE_STUDIO_IMG}
                alt="Mr. Rahim Nawaz Khan Abbasi — Advocate High Court & Founding Member, Rahim Law Associates"
                loading="eager"
                decoding="async"
                className="w-auto h-full max-h-[1180px] object-contain object-bottom drop-shadow-[0_25px_45px_rgba(0,0,0,0.7)] scale-140 sm:scale-125 lg:scale-135 xl:scale-140 origin-bottom translate-y-0.5 sm:translate-y-1 lg:translate-y-1.5"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
