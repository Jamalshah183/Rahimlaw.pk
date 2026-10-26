import React, { useState } from 'react';
import { ChevronDown, HelpCircle, PhoneCall } from 'lucide-react';
import { FIRM_CONFIG } from '../data/firmData';

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FIRM_CONFIG.faqs[0].id);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="relative z-[17] -mt-10 sm:-mt-12 lg:-mt-14 pt-20 sm:pt-24 md:pt-28 pb-28 md:pb-36 bg-gradient-to-b from-[#452415] via-[#612912] to-[#452415] text-[#F6F6F6] rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] border-t-2 border-[#94542D]/40 shadow-[0_-25px_50px_-15px_rgba(69,36,21,0.5)] overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-[1px] w-6 bg-[#94542D]" aria-hidden="true" />
            <span className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[#F3F0E7]">
              FAQ
            </span>
            <span className="h-[1px] w-6 bg-[#94542D]" aria-hidden="true" />
          </div>

          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[3.25rem] xl:text-[3.5rem] font-bold text-[#F6F6F6] leading-[1.08] tracking-[-0.02em] mb-4">
            Questions, <span className="font-sans italic font-semibold text-[#F3F0E7]">Answered.</span>
          </h2>

          <p className="font-sans text-[16px] sm:text-[17px] text-[#F6F6F6]/90 leading-[1.65] font-normal">
            Essential information regarding our consultation procedures, case intake, and representation guidelines.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {FIRM_CONFIG.faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-[#452415]/85 rounded-xl border border-[#94542D]/35 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#94542D] cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-[16px] sm:text-[17px] font-semibold tracking-[-0.005em] leading-[1.45] text-[#F6F6F6] hover:text-[#F3F0E7] transition-colors">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'bg-[#94542D] text-white rotate-180'
                        : 'bg-white/10 text-[#F3F0E7]'
                    }`}
                  >
                    <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-[#F3F0E7]'}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 font-sans text-[15px] sm:text-[16px] text-[#F6F6F6]/90 leading-[1.65] font-normal border-t border-[#94542D]/20 animate-in fade-in duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions prompt */}
        <div className="mt-12 p-6 rounded-xl bg-[#452415]/90 border border-[#94542D]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#94542D]/20 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-[#F3F0E7]" />
            </div>
            <div>
              <p className="font-sans text-[15px] font-semibold text-[#F6F6F6]">
                Do you have an unlisted inquiry?
              </p>
              <p className="font-sans text-[13px] font-normal text-[#F6F6F6]/80">
                Our intake coordinator is available directly via WhatsApp.
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${FIRM_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
              FIRM_CONFIG.whatsappMessage
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#94542D] hover:bg-[#a65f33] text-white font-sans text-[13px] uppercase tracking-[0.06em] font-bold rounded-full transition-colors whitespace-nowrap shadow-md"
          >
            <PhoneCall className="w-3.5 h-3.5 text-white" />
            <span>Inquire on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};
