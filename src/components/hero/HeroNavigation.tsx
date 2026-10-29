import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { heroConfig } from '../../data/heroConfig';
import { useTransparentLogo } from '../../utils/useTransparentLogo';

interface HeroNavigationProps {
  onOpenConsultation: () => void;
}

export const HeroNavigation: React.FC<HeroNavigationProps> = ({ onOpenConsultation }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logoSrc, isProcessed } = useTransparentLogo(heroConfig.logo);

  return (
    <>
      <nav
        className="w-full z-[25] relative pt-6 sm:pt-8 pb-4"
        aria-label="Hero navigation"
      >
        <div className="w-full flex items-center">
          {/* 
            ====================================================================
            LEFT CONTAINER SECTION (Aligned directly with where HeroContent writing starts)
            Revealing logo from its actual position
            ====================================================================
          */}
          <div className="w-full lg:w-[54%] xl:w-[53%] px-6 sm:px-10 lg:pl-12 xl:pl-16 pr-3 lg:pr-4 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.0, delay: 0.35, ease: 'easeOut' }}
              className="w-full max-w-[540px] xl:max-w-[580px] flex items-center justify-between"
            >
              {/* Rahim Law Associates Logo aligned with HeroContent start */}
              <a
                href="#hero"
                className="inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5B842] rounded-lg transition-transform duration-200 hover:scale-[1.02]"
                aria-label="Rahim Law Associates - Home"
              >
                <img
                  src={logoSrc}
                  alt="Rahim Law Associates Logo"
                  className="h-20 sm:h-24 lg:h-28 w-auto object-contain object-left drop-shadow-md shrink-0"
                />
              </a>

              {/* Mobile Hamburger Button */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-[#E5B842] transition-colors cursor-pointer"
                  aria-label="Open mobile menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* 
            ====================================================================
            RIGHT SECTION: Starts where the left side container ends (at 58%)
            Revealing navbar links from their actual position
            ====================================================================
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.45, ease: 'easeOut' }}
            className="hidden lg:flex items-center lg:ml-[5%] xl:ml-[6%] pl-8 xl:pl-12"
          >
            <div className="flex items-center gap-7 xl:gap-9 font-sans text-[14.5px] font-semibold tracking-[0.03em] text-[#0F172A]">
              {heroConfig.navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="hover:text-[#612912] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#612912] hover:after:w-full after:transition-all whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 px-3 rounded-lg bg-[#452415] border border-[#E5B842]/30 flex items-center shrink-0">
                    <img
                      src={logoSrc}
                      alt="Qadeer Legal Chambers"
                      className="h-16 w-auto object-contain shrink-0"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-[#0F172A] hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col space-y-3">
                {heroConfig.navigation.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-sans text-[15px] font-semibold tracking-[0.03em] text-[#0F172A] hover:text-[#612912] py-2 transition-colors border-b border-slate-100 flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#E5B842]" />
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsultation();
                }}
                className="w-full py-3 bg-[#612912] hover:bg-[#452415] text-white font-sans text-[13px] uppercase tracking-[0.06em] font-bold rounded-full text-center block shadow-md transition-colors cursor-pointer"
              >
                Free Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
