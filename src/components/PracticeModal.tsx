import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { PracticeArea } from '../data/firmData';

interface PracticeModalProps {
  practice: PracticeArea | null;
  onClose: () => void;
  onConsult: (practiceTitle: string) => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  practice,
  onClose,
  onConsult,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (practice) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [practice, onClose]);

  if (!practice || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#452415]/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl max-w-xl w-full overflow-hidden border border-slate-200/90 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Top Image Banner */}
        <div className="relative h-32 sm:h-44 w-full overflow-hidden bg-[#452415]">
          <img
            src={practice.image}
            alt={practice.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#452415] via-[#452415]/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-[#612912] text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5B842] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category Title on image banner */}
          <div className="absolute bottom-3 left-4 right-4">
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#E5B842] font-bold block mb-0.5">
              Practice Area
            </span>
            <h3
              id="practice-modal-title"
              className="font-sans text-xl sm:text-2xl font-bold tracking-[-0.02em] text-white"
            >
              {practice.title}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          <p className="font-sans text-[14px] sm:text-[15px] text-[#334155] leading-[1.55] font-normal">
            {practice.fullDesc}
          </p>

          <div className="pt-1">
            <h4 className="font-sans text-[10.5px] uppercase tracking-[0.14em] font-bold text-[#612912] mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>Core Chambers Services & Representation</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {practice.keyServices.map((service, idx) => (
                <div key={idx} className="flex items-start gap-1.5 font-sans text-[13.5px] font-medium text-[#1E293B] leading-[1.4]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#612912] shrink-0 mt-0.5" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="font-sans text-[11px] text-[#64748B] hidden sm:block">
              Strict attorney-client confidentiality assured.
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onConsult(practice.title);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#612912] hover:bg-[#452415] !text-white text-white font-sans text-[12.5px] uppercase tracking-[0.06em] font-bold rounded-full transition-colors shadow-md cursor-pointer"
              style={{ color: '#FFFFFF' }}
            >
              <span className="!text-white text-white font-bold" style={{ color: '#FFFFFF' }}>Consult on {practice.title}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E5B842]" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
