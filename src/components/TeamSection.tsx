import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, CheckCircle2, ArrowUpRight, Award, MessageSquare } from 'lucide-react';
import { FIRM_CONFIG } from '../data/firmData';
import { usePortalStore } from '../lib/portalStore';
import rahimMemberImg from '../assets/images/rahim_nawaz_khan_abbasi.png';

interface TeamMember {
  id: string;
  name: string;
  fullName: string;
  designation: string;
  credentials: string;
  pillarWatermark: string;
  image: string;
  whatsappNumber?: string;
  maxAspectRatio?: number;
  bioParagraphs: string[];
  specializations: string[];
}

function normalizeWhatsAppNumber(raw?: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits || digits.length < 7) return FIRM_CONFIG.contact.whatsappNumber;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && (digits.length === 10 || digits.length === 11)) {
    return `92${digits.slice(1)}`;
  }
  return digits;
}


/**
 * Removes any outer solid/studio background if present, detects the exact bounding box
 * of the person, and normalizes the subject onto a uniform 360x460 portrait canvas
 * so every card's person image matches in height and scale.
 */
export function useStudioCutout(src: string, maxAspectRatio = 1.22): string {
  const [cutoutUrl, setCutoutUrl] = useState<string>(src);

  useEffect(() => {
    setCutoutUrl(src);
    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (isCancelled) return;
      try {
        const srcW = img.naturalWidth || 460;
        const srcH = img.naturalHeight || 460;

        const maxDim = 520;
        const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
        const width = Math.round(srcW * scale);
        const height = Math.round(srcH * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const totalPixels = width * height;

        // Check if corner pixels are opaque (needs background flood-fill removal)
        const tlAlpha = data[(2 * width + 2) * 4 + 3];
        const trAlpha = data[(2 * width + (width - 3)) * 4 + 3];

        if (tlAlpha > 200 || trAlpha > 200) {
          const visited = new Uint8Array(totalPixels);
          const tlIdx = (2 * width + 2) * 4;
          const trIdx = (2 * width + (width - 3)) * 4;
          const bgR1 = data[tlIdx];
          const bgG1 = data[tlIdx + 1];
          const bgB1 = data[tlIdx + 2];
          const bgR2 = data[trIdx];
          const bgG2 = data[trIdx + 1];
          const bgB2 = data[trIdx + 2];

          const isBackgroundCandidate = (idx: number, parentIdx?: number): boolean => {
            if (data[idx + 3] < 20) return true;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);

            if (r > 210 && g > 210 && b > 210 && maxC - minC < 30) {
              return true;
            }

            const dist1 = Math.abs(r - bgR1) + Math.abs(g - bgG1) + Math.abs(b - bgB1);
            const dist2 = Math.abs(r - bgR2) + Math.abs(g - bgG2) + Math.abs(b - bgB2);
            if (Math.min(dist1, dist2) < 75 && maxC - minC < 38) {
              if (parentIdx === undefined) return true;
              const pr = data[parentIdx];
              const pg = data[parentIdx + 1];
              const pb = data[parentIdx + 2];
              const stepDiff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
              return stepDiff < 28;
            }

            return false;
          };

          const queue = new Int32Array(totalPixels);
          let head = 0;
          let tail = 0;

          const enqueueIfBg = (x: number, y: number, parentIdx?: number) => {
            if (x < 0 || x >= width || y < 0 || y >= height) return;
            const p = y * width + x;
            if (visited[p]) return;
            const idx = p * 4;
            if (isBackgroundCandidate(idx, parentIdx)) {
              visited[p] = 1;
              queue[tail++] = p;
            }
          };

          for (let x = 0; x < width; x++) {
            enqueueIfBg(x, 0);
          }
          for (let y = 0; y < Math.floor(height * 0.9); y++) {
            enqueueIfBg(0, y);
            enqueueIfBg(width - 1, y);
          }

          while (head < tail) {
            const p = queue[head++];
            const idx = p * 4;
            const x = p % width;
            const y = (p - x) / width;

            if (x > 0) enqueueIfBg(x - 1, y, idx);
            if (x + 1 < width) enqueueIfBg(x + 1, y, idx);
            if (y > 0) enqueueIfBg(x, y - 1, idx);
            if (y + 1 < height) enqueueIfBg(x, y + 1, idx);

            data[idx + 3] = 0;
          }

          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const p = y * width + x;
              if (visited[p]) continue;
              const transparentNeighbors =
                visited[p - 1] +
                visited[p + 1] +
                visited[p - width] +
                visited[p + width];
              if (transparentNeighbors > 0) {
                const idx = p * 4;
                data[idx + 3] = Math.round(data[idx + 3] * (1 - transparentNeighbors * 0.18));
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // Find tight bounding box of the person (alpha > 35)
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 35) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX > minX && maxY > minY) {
          const subjW = maxX - minX + 1;
          const rawSubjH = maxY - minY + 1;
          // Cap height-to-width ratio so both portraits match in head/shoulder scale and vertical height
          const subjH = Math.min(rawSubjH, Math.round(subjW * maxAspectRatio));

          const outW = 640;
          const outH = 680;
          const outCanvas = document.createElement('canvas');
          outCanvas.width = outW;
          outCanvas.height = outH;
          const outCtx = outCanvas.getContext('2d');

          if (outCtx) {
            outCtx.imageSmoothingEnabled = true;
            outCtx.imageSmoothingQuality = 'high';
            // Normalize every person to occupy 97% vertical height of the canvas
            const targetH = Math.round(outH * 0.97);
            const drawScale = targetH / subjH;
            const targetW = Math.round(subjW * drawScale);
            const drawX = Math.round((outW - targetW) / 2);
            const drawY = outH - targetH;

            outCtx.drawImage(
              canvas,
              minX,
              minY,
              subjW,
              subjH,
              drawX,
              drawY,
              targetW,
              targetH
            );

            const normalizedUrl = outCanvas.toDataURL('image/png');
            if (!isCancelled) {
              setCutoutUrl(normalizedUrl);
            }
            return;
          }
        }

        const resultUrl = canvas.toDataURL('image/png');
        if (!isCancelled) {
          setCutoutUrl(resultUrl);
        }
      } catch {
        // Fallback to original image if canvas manipulation is restricted
      }
    };

    img.src = src;
    return () => {
      isCancelled = true;
    };
  }, [src, maxAspectRatio]);

  return cutoutUrl;
}

const TeamMemberCard: React.FC<{
  member: TeamMember;
  onSelect: (member: TeamMember, cutoutSrc: string) => void;
}> = ({ member, onSelect }) => {
  const cutoutSrc = useStudioCutout(member.image, member.maxAspectRatio ?? 1.22);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(member, cutoutSrc)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(member, cutoutSrc);
        }
      }}
      aria-label={`View profile of ${member.fullName}`}
      className="group relative w-full max-w-[295px] mx-auto aspect-[3/3.66] select-none overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-tl-[38px] rounded-b-xl transition-transform duration-300 hover:-translate-y-1"
    >
      {/* 
        1. Left Vertical copper Pillar (Matches reference card's red left bar):
           - Covers ~46% of the card width on the left
           - Rounded top-left corner (rounded-tl-[38px])
           - Contains vertical outlined watermark text
      */}
      <div
        className="absolute top-0 left-0 bottom-0 w-[46%] bg-[#612912] rounded-tl-[38px] z-[1] overflow-hidden flex items-start justify-center pt-5"
        aria-hidden="true"
      >
        <span
          className="font-sans font-extrabold text-[44px] sm:text-[48px] tracking-[0.04em] leading-none select-none pointer-events-none whitespace-nowrap"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            WebkitTextStroke: '1.25px rgba(229, 184, 66, 0.35)',
            color: 'transparent',
          }}
        >
          {member.pillarWatermark}
        </span>
      </div>

      {/* 
        2. Foreground Cutout Portrait:
           - Overlaps both the left copper pillar and the right space
      */}
      <div className="absolute inset-x-0 bottom-0 top-2.5 z-[2] flex items-end justify-center pointer-events-none">
        <img
          src={cutoutSrc}
          alt={`${member.fullName} — ${member.designation}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {/* 
        3. Bottom Full-Width copper Gradient Fade & Member Info Lockup:
           - Smoothly fades upward from solid vibrant copper (#452415) at the bottom edge
           - Displays Name, Designation, and subtle View Profile arrow
      */}
      <div
        className="absolute inset-x-0 bottom-0 h-[36%] z-[3] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #452415 0%, rgba(71, 51, 42, 0.92) 38%, rgba(71, 51, 42, 0.45) 72%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <div className="absolute bottom-3.5 left-4 right-3.5 z-[4] flex items-end justify-between gap-2 text-left">
        <div className="min-w-0">
          <h3
            className="font-sans font-bold text-[18px] sm:text-[19px] !text-white leading-tight tracking-[-0.01em]"
            style={{ color: '#FFFFFF' }}
          >
            {member.name}
          </h3>
          <p
            className="font-sans font-semibold text-[12px] sm:text-[12.5px] !text-[#E5B842] tracking-[0.02em] mt-0.5"
            style={{ color: '#E5B842' }}
          >
            {member.designation}
          </p>
        </div>

        <span
          className="w-7 h-7 rounded-full bg-[#E5B842] group-hover:bg-white text-[#452415] flex items-center justify-center transition-all duration-200 shrink-0 shadow-xs"
          aria-hidden="true"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export const TeamSection: React.FC = () => {
  const { teamMembers: storeTeamMembers } = usePortalStore();
  const [selectedProfile, setSelectedProfile] = useState<{
    member: TeamMember;
    cutoutSrc: string;
  } | null>(null);

  const orderedMembers = [...(storeTeamMembers || [])].sort((a, b) => {
    if (a.isCeo && !b.isCeo) return -1;
    if (!a.isCeo && b.isCeo) return 1;
    return (a.order ?? 99) - (b.order ?? 99);
  });

  const displayMembers: TeamMember[] = orderedMembers.map((m) => ({
    id: m.id,
    name: m.name,
    fullName: m.name,
    designation: m.title,
    credentials:
      m.credentials && m.credentials.length > 0
        ? m.credentials.join(' · ')
        : m.title,
    pillarWatermark: m.pillarWatermark || (m.isCeo ? 'FOUNDER' : 'ADVOCATE'),
    image: m.image || rahimMemberImg,
    whatsappNumber: m.whatsappNumber || '',
    maxAspectRatio: 1.08,
    bioParagraphs:
      m.fullBio && m.fullBio.length > 0
        ? m.fullBio
        : [m.bio].filter(Boolean),
    specializations:
      m.specializations && m.specializations.length > 0
        ? m.specializations
        : m.specialty
        ? m.specialty
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
  }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProfile(null);
    };
    if (selectedProfile) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedProfile]);

  return (
    <section
      id="team"
      className="relative z-[18] -mt-10 sm:-mt-12 lg:-mt-14 pt-20 sm:pt-24 md:pt-28 pb-24 md:pb-32 bg-[#FFFFFF] rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] rounded-b-[50px] sm:rounded-b-[65px] lg:rounded-b-[80px] border-t-2 border-b-2 border-[#612912]/20 shadow-[0_-25px_50px_-15px_rgba(148, 84, 45,0.10),0_30px_60px_-15px_rgba(15,23,42,0.12)] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Heading */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-[1px] w-6 bg-[#E5B842]" aria-hidden="true" />
            <span className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[#E5B842]">
              LEADERSHIP & PARTNERS
            </span>
            <span className="h-[1px] w-6 bg-[#E5B842]" aria-hidden="true" />
          </div>

          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[3.15rem] xl:text-[3.4rem] font-bold text-[#2C1309] leading-[1.08] tracking-[-0.02em]">
            Our <span className="font-sans italic font-semibold text-[#E5B842]">Team</span>
          </h2>
        </motion.div>

        {/* Board of Directors / Team Member Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-6 items-end justify-center">
          {displayMembers.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.65, delay: idx * 0.12, ease: 'easeOut' }}
            >
              <TeamMemberCard
                member={member}
                onSelect={(m, src) => setSelectedProfile({ member: m, cutoutSrc: src })}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom Centered Description Text matching the reference layout */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, delay: 0.3 }}
          className="mt-10 sm:mt-12 max-w-4xl mx-auto text-center font-sans text-[15px] sm:text-[16px] text-[#475569] leading-[1.65] font-normal"
        >
          Our chambers are led by seasoned partners and senior advocates bringing decades of courtroom trial experience, corporate governance advisory, and constitutional advocacy to every client mandate.
        </motion.p>
      </div>

      {/* Interactive Executive Advocate Profile Modal */}
      {selectedProfile &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#452415]/80 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedProfile(null)}
              aria-hidden="true"
            />

            {/* Executive Profile Dossier Card */}
            <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[96dvh] flex flex-col border-2 border-[#E5B842]/50 shadow-[0_30px_80px_-15px_rgba(15,23,42,0.6)] overflow-hidden z-10">
              {/* Top Gold Accent Bar */}
              <div
                className="h-1.5 w-full shrink-0 bg-gradient-to-r from-[#612912] via-[#E5B842] to-[#612912]"
                aria-hidden="true"
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-30 w-8 h-8 rounded-full bg-[#612912] text-white hover:bg-[#452415] border border-[#E5B842]/50 flex items-center justify-center transition-colors shadow-md cursor-pointer"
                aria-label="Close profile modal"
              >
                <X className="w-4.5 h-4.5 !text-white" />
              </button>

              <div className="flex flex-col md:grid md:grid-cols-12 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {/* 
                  Left Column (4 Cols): Tailored Executive Portrait Frame & Chamber Seal
                */}
                <div className="md:col-span-5 bg-gradient-to-b from-[#452415] via-[#452415] to-[#452415] pt-8 pb-4 px-4 sm:p-6 flex flex-col items-center justify-between relative shrink-0 border-b md:border-b-0 md:border-r border-[#E5B842]/30 text-white">
                  {/* Subtle radial ambient glow */}
                  <div
                    className="absolute inset-0 bg-radial from-[#E5B842]/15 via-transparent to-black/30 pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Framed Executive Portrait Card */}
                  <div className="relative z-10 w-[215px] h-[276px] sm:w-[235px] sm:h-[302px] rounded-2xl bg-white border-2 border-[#E5B842]/60 shadow-2xl overflow-hidden shrink-0">
                    {/* Left Vertical copper Pillar inside portrait frame */}
                    <div
                      className="absolute top-0 left-0 bottom-0 w-[44%] bg-[#452415] z-[1] flex items-start justify-center pt-6"
                      aria-hidden="true"
                    >
                      <span
                        className="font-sans font-extrabold text-[34px] tracking-[0.04em] leading-none select-none pointer-events-none whitespace-nowrap"
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          WebkitTextStroke: '1px rgba(229, 184, 66, 0.35)',
                          color: 'transparent',
                        }}
                      >
                        {selectedProfile.member.pillarWatermark}
                      </span>
                    </div>

                    {/* Crisp High-Res Portrait */}
                    <div className="absolute inset-x-0 bottom-0 top-3 z-[2] flex items-end justify-center pointer-events-none">
                      <img
                        src={selectedProfile.cutoutSrc || selectedProfile.member.image}
                        alt={selectedProfile.member.fullName}
                        className="w-full h-full object-contain object-bottom"
                      />
                    </div>

                    {/* Smooth Bottom copper Gradient Anchor */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-[32%] z-[3] pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, #452415 0%, rgba(71, 51, 42, 0.88) 40%, transparent 100%)',
                      }}
                      aria-hidden="true"
                    />

                    {/* Framed Portrait Caption */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 z-[4] text-left">
                      <div className="font-sans font-bold text-[16px] text-white leading-tight">
                        {selectedProfile.member.fullName}
                      </div>
                      <div className="font-sans text-[10.5px] uppercase tracking-[0.12em] text-[#E5B842] font-bold mt-0.5">
                        {selectedProfile.member.designation} · {FIRM_CONFIG.firmName}
                      </div>
                    </div>
                  </div>

                  {/* Chamber Credentials & Direct WhatsApp Action */}
                  <div className="relative z-10 w-full mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[#E5B842]/30 text-center">
                    <div className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#E5B842] font-bold mb-1">
                      Chambers Jurisdiction
                    </div>
                    <div className="font-sans text-[14px] sm:text-[15px] font-semibold text-white/95 mb-4">
                      Pakistan Courts & International Advisory
                    </div>

                    <a
                      href={`https://wa.me/${normalizeWhatsAppNumber(selectedProfile.member.whatsappNumber)}?text=${encodeURIComponent(
                        `Assalam-o-Alaikum Rahim Law Associates, I would like to schedule a consultation with ${selectedProfile.member.fullName} (${selectedProfile.member.designation}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-full bg-[#E5B842] hover:bg-[#d4a833] text-[#452415] font-sans text-[12px] uppercase tracking-[0.06em] font-bold shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-[#452415]" />
                      <span>
                        {selectedProfile.member.whatsappNumber?.trim()
                          ? 'Contact Directly on WhatsApp'
                          : 'Consult via WhatsApp'}
                      </span>
                    </a>
                    {selectedProfile.member.whatsappNumber?.trim() && (
                      <div className="mt-2 font-sans text-[11.5px] font-medium text-white/80">
                        Direct WhatsApp: {selectedProfile.member.whatsappNumber.trim()}
                      </div>
                    )}
                  </div>
                </div>

                {/* 
                  Right Column (7 Cols): Executive Legal Dossier & Specializations
                */}
                <div className="md:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-between bg-white text-[#452415]">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#612912]/10 border border-[#612912]/20 text-[#612912] font-sans text-[11px] uppercase tracking-[0.14em] font-bold mb-3.5">
                      <Award className="w-3.5 h-3.5 text-[#E5B842]" aria-hidden="true" />
                      <span>Professional Profile</span>
                    </div>

                    <h3
                      id="profile-modal-title"
                      className="font-sans text-2xl sm:text-4xl font-bold text-[#452415] tracking-[-0.02em] leading-[1.08]"
                    >
                      {selectedProfile.member.fullName}
                    </h3>

                    <p className="font-sans text-[12.5px] sm:text-[14px] uppercase tracking-[0.08em] font-bold text-[#612912] mt-1.5 mb-5 pb-4 border-b border-slate-200">
                      {selectedProfile.member.credentials}
                    </p>

                    {/* Editorial Bio Paragraphs with Gold Left Rule on Lead Paragraph */}
                    <div className="space-y-4 font-sans text-[14.5px] sm:text-[15.5px] text-[#334155] leading-[1.68]">
                      {selectedProfile.member.bioParagraphs.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className={
                            idx === 0
                              ? 'border-l-2 border-[#E5B842] pl-4 font-medium text-[#452415]'
                              : 'text-[#475569]'
                          }
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Specializations */}
                    <div className="mt-6 sm:mt-7">
                      <h4 className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#612912] font-bold mb-3">
                        Areas of Specialization
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedProfile.member.specializations.map((spec) => (
                          <div
                            key={spec}
                            className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#612912] shrink-0" />
                            <span className="font-sans text-[13px] font-semibold text-[#452415] leading-snug">
                              {spec}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Dossier Footer */}
                  <div className="mt-6 sm:mt-7 pt-4 border-t border-slate-200 flex items-center justify-between gap-2 text-[12px] font-sans text-[#64748B]">
                    <span>{FIRM_CONFIG.firmName} · Verified Chamber Profile</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProfile(null)}
                      className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-[#612912] text-[#475569] hover:text-white font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      Close Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
