import React, { useState } from 'react';
import { ArrowUpRight, Scale } from 'lucide-react';
import { FIRM_CONFIG, PracticeArea } from '../data/firmData';
import { PracticeModal } from './PracticeModal';

interface PracticeAreasSectionProps {
  onSelectPracticeForConsultation: (practiceTitle: string) => void;
}

export const PracticeAreasSection: React.FC<PracticeAreasSectionProps> = ({
  onSelectPracticeForConsultation,
}) => {
  const [selectedPractice, setSelectedPractice] = useState<PracticeArea | null>(null);

  return (
    <section
      id="practice-areas"
      className="relative z-[12] -mt-10 sm:-mt-12 lg:-mt-14 pt-20 sm:pt-24 md:pt-28 pb-28 md:pb-36 bg-[#F6F6F6] text-[#452415] rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] border-t-2 border-[#94542D]/20 shadow-[0_-25px_50px_-15px_rgba(69,36,21,0.10)] overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-[1px] w-7 bg-[#94542D]" aria-hidden="true" />
            <Scale className="w-3.5 h-3.5 text-[#94542D]" aria-hidden="true" />
            <span className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[#94542D]">
              CORE LEGAL CAPABILITIES
            </span>
            <span className="h-[1px] w-7 bg-[#94542D]" aria-hidden="true" />
          </div>

          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[3.15rem] xl:text-[3.4rem] font-bold text-[#452415] tracking-[-0.02em] leading-[1.08] mb-3.5 sm:mb-4">
            Our Practice <span className="font-sans italic font-semibold text-[#94542D]">Areas</span>
          </h2>

          <p className="font-sans text-[15px] sm:text-[16.5px] text-[#612912]/80 leading-[1.65] font-normal">
            Comprehensive litigation, transactional counsel, and Pakistani-law advisory tailored for domestic clients, commercial enterprises, overseas Pakistanis, and instructing foreign firms.
          </p>
        </div>

        {/* Editorial Numbered Practice List */}
        <div className="divide-y divide-[#94542D]/15 border-t border-b border-[#94542D]/15">
          {FIRM_CONFIG.practiceAreas.map((practice, index) => (
            <div
              key={practice.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPractice(practice)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPractice(practice);
                }
              }}
              className="group py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-10 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#94542D] rounded-lg"
            >
              {/* Left Column: Editorial Number + Sans Practice Area Title matching upper section */}
              <div className="md:w-[38%] lg:w-[36%] shrink-0 flex items-baseline gap-3.5">
                <span className="font-sans text-lg sm:text-xl font-bold text-[#94542D] tabular-nums shrink-0 [font-variant-numeric:lining-nums]">
                  0{index + 1}.
                </span>
                <h3 className="font-sans text-2xl sm:text-[1.75rem] lg:text-[1.85rem] font-bold tracking-[-0.02em] leading-[1.15] text-[#452415] group-hover:text-[#94542D] transition-colors">
                  {practice.title}
                </h3>
              </div>

              {/* Middle Column: Concise 2-Line Description */}
              <p className="flex-1 max-w-xl font-sans text-[15px] sm:text-[16px] text-[#612912]/80 leading-[1.65] font-normal">
                {practice.shortDesc}
              </p>

              {/* Right Column: Minimalist Up-Right Arrow */}
              <div className="shrink-0 self-end md:self-center pl-2">
                <span className="w-9 h-9 rounded-full bg-[#F3F0E7] group-hover:bg-[#94542D] text-[#452415] group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs">
                  <ArrowUpRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Area Detail Modal */}
      <PracticeModal
        practice={selectedPractice}
        onClose={() => setSelectedPractice(null)}
        onConsult={(title) => {
          setSelectedPractice(null);
          onSelectPracticeForConsultation(title);
        }}
      />
    </section>
  );
};
