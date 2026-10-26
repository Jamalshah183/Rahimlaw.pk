import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  ArrowUpRight,
  Award,
  MessageSquare,
  GraduationCap,
  Scale,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import { FIRM_CONFIG } from '../data/firmData';

// Portrait assets for all team members
import qadeerCeoImg from '../assets/images/principal_advocate_studio_opt.webp';
import hasanImg from '../assets/images/pakistani_advocate_male_2_1791124258819.jpg';
import mehakImg from '../assets/images/pakistani_advocate_female_1_1791124244419.jpg';
import haiderImg from '../assets/images/arfan_shahzad.png';
import khadijaImg from '../assets/images/pakistani_advocate_female_2_1791124273126.jpg';
import ishaqImg from '../assets/images/office_assistant_ishaq_1792941449715.jpg';
import saraaImg from '../assets/images/office_assistant_saraa_1792941462286.jpg';

export type TeamCategory = 'all' | 'founding' | 'advocate' | 'support';

export interface TeamMember {
  id: string;
  name: string;
  fullName: string;
  designation: string;
  category: 'founding' | 'advocate' | 'support';
  categoryLabel: string;
  credentials: string;
  pillarWatermark: string;
  image: string;
  maxAspectRatio?: number;
  education?: string[];
  memberships?: string[];
  bioParagraphs: string[];
  specializations: string[];
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'rahim-nawaz-khan-abbasi',
    name: 'Mr. Rahim Nawaz Khan Abbasi',
    fullName: 'Mr. Rahim Nawaz Khan Abbasi',
    designation: 'Advocate High Court · Founding Member',
    category: 'founding',
    categoryLabel: 'Founding Member',
    credentials:
      'Senior Counsel · M.Phil (Finance) · MBA · Fellow ICSP · Member IBP · Registered Tax Practitioner (FBR)',
    pillarWatermark: 'FOUNDER',
    image: qadeerCeoImg,
    maxAspectRatio: 1.08,
    education: [
      'Law Graduate (LL.B)',
      'M.Phil in Finance',
      'Master of Business Administration (MBA)',
    ],
    memberships: [
      'Fellow Member, Institute of Corporate Secretaries of Pakistan (ICSP)',
      'Member, Institute of Bankers of Pakistan (IBP)',
      'Registered Tax Practitioner with Federal Board of Revenue (FBR)',
      'Advocate of the High Court',
    ],
    bioParagraphs: [
      'Mr. Rahim Nawaz Khan Abbasi is the Senior Counsel and Founding Member overseeing matters pertaining to Taxation, Corporate and Company Laws, Intellectual Property, Banking, and Non-Banking Financial Companies (NBFCs).',
      'Mr. Rahim brings vast and authoritative experience in dealing with complex tax and corporate cases involving individuals, Associations of Persons (AOPs), and corporations across Pakistan.',
      'A distinguished legal practitioner and corporate finance scholar, he is a law graduate and also holds the degree of M.Phil (Finance) and MBA. He is a Fellow Member of the Institute of Corporate Secretaries of Pakistan (ICSP), Member of the Institute of Bankers of Pakistan, and a Registered Tax Practitioner with the FBR.',
    ],
    specializations: [
      'Taxation & Corporate Litigation (Individuals, AOPs, Companies)',
      'Corporate & Company Laws (SECP Governance)',
      'Intellectual Property (Trademarks, Patents & Copyrights)',
      'Banking & NBFC Regulations',
      'FBR Tax Filings, Audits & Appellate Writs',
      'Corporate Structuring & M.Phil-level Financial Analysis',
    ],
  },
  {
    id: 'hasan-rashid-qamar',
    name: 'Mr. Hasan Rashid Qamar',
    fullName: 'Mr. Hasan Rashid Qamar',
    designation: 'Advocate Supreme Court · Founding Member',
    category: 'founding',
    categoryLabel: 'Founding Member',
    credentials:
      'Advocate Supreme Court · Warwick Univ & Univ of London LLB (Hons) · Oxford PG Diploma · CIArb Accredited Mediator',
    pillarWatermark: 'SUPREME',
    image: hasanImg,
    maxAspectRatio: 1.15,
    education: [
      'Post Graduate Diploma in Law & Legal Practice, Oxford University & Oxford Brookes University, UK',
      'LLB (Hons.), University of London, UK',
      'Warwick University, UK',
      'Army Burn Hall College, Abbottabad',
    ],
    memberships: [
      'Advocate of the Supreme Court of Pakistan (Enrolled since 2020)',
      'Certified CIArb Accredited Mediator (Chartered Institute of Arbitrators, UK)',
      'Passed Mediation Training & Assessment from Chartered Institute of Arbitrators (CIArb UK)',
      'Supreme Court Bar Association (SCBA)',
    ],
    bioParagraphs: [
      'Mr. Hasan Rashid Qamar is a Founding Member of the chambers and an Advocate of the Supreme Court of Pakistan, enrolled since 2020 with high-level courtroom standing before appellate and constitutional benches.',
      'Mr. Hasan completed his early education at Army Burn Hall College, Abbottabad, and thereafter proceeded to the United Kingdom to attend Warwick University and completed his LLB (Hons.) from the University of London. He further obtained his Post Graduate Diploma in Law & Legal Practice from Oxford University, UK, as well as Oxford Brookes University, UK.',
      'A qualified international mediator, Mr. Hasan successfully completed and passed rigorous Mediation Training & Assessment from the Chartered Institute of Arbitrators (CIArb, UK) and is certified as a CIArb Accredited Mediator, leading the chambers in commercial arbitration and dispute resolution.',
    ],
    specializations: [
      'Supreme Court & High Court Appellate Practice',
      'CIArb Accredited Mediation & Alternative Dispute Resolution (ADR)',
      'Cross-Border Corporate & Commercial Litigation',
      'Constitutional Petitions & Judicial Review',
      'High-Stakes Contractual & Corporate Disputes',
      'International Legal Practice & Strategic Advisory',
    ],
  },
  {
    id: 'mehak-ali',
    name: 'Ms. Mehak Ali',
    fullName: 'Ms. Mehak Ali',
    designation: 'Advocate High Court',
    category: 'advocate',
    categoryLabel: 'Advocate High Court',
    credentials:
      'LL.M. (Univ of Lahore) · LL.B. (Punjab Univ) · Corporate, Tax & SECP/FBR Specialist',
    pillarWatermark: 'ADVOCATE',
    image: mehakImg,
    maxAspectRatio: 1.15,
    education: [
      'Master of Laws (LL.M.), University of Lahore',
      'Bachelor of Laws (LL.B.), Punjab University',
    ],
    memberships: [
      'Advocate of the High Court',
      'Specialized Legal Counsel before SECP & FBR',
      'High Court Bar Association',
    ],
    bioParagraphs: [
      'Ms. Mehak Ali is an Advocate of the High Court. She obtained her law degree from Punjab University and completed her Master of Laws (LL.M.) from the University of Lahore.',
      'She has been associated with several renowned law firms and has been actively practicing in the areas of corporate and tax law, handling contentious and transactional portfolios with high diligence.',
      'Her core specialization centers on regulatory governance, statutory compliance, and appellate matters before the Securities and Exchange Commission of Pakistan (SECP), Federal Board of Revenue (FBR), and the High Court.',
    ],
    specializations: [
      'Corporate Law & SECP Compliance Proceedings',
      'Federal Board of Revenue (FBR) Tax Audits & Appeals',
      'High Court Commercial Writs & Injunctions',
      'Company Secretarial Governance & Incorporation',
      'Commercial Contract Drafting & Regulatory Reviews',
      'Corporate Tax Planning & Regulatory Advisory',
    ],
  },
  {
    id: 'haider-zaman-niazi',
    name: 'Mr. Haider Zaman Niazi',
    fullName: 'Mr. Haider Zaman Niazi',
    designation: 'Advocate High Court',
    category: 'advocate',
    categoryLabel: 'Advocate High Court',
    credentials:
      'LLB (Hons.) Bahria Univ · BA · Civil, Criminal, Banking & Intellectual Property Counsel',
    pillarWatermark: 'ADVOCATE',
    image: haiderImg,
    maxAspectRatio: 1.06,
    education: [
      'LLB (Hons.), Bahria University, Islamabad',
      'Bachelor of Arts (BA)',
    ],
    memberships: [
      'Advocate of the High Court',
      'High Court Bar Association',
      'Civil & Criminal Defense Panel',
    ],
    bioParagraphs: [
      'Mr. Haider Zaman Niazi is an experienced Advocate at the High Court, holding a Bachelor of Arts (BA) and an LLB (Hons.) from Bahria University, Islamabad.',
      'He specializes in civil, criminal, banking, and intellectual property law, and has built a strong reputation for handling complex and sensitive legal matters across multiple judicial benches.',
      'His expertise includes representing clients in civil disputes, criminal defense, banking regulations, intellectual property issues, and service matters. With a relentless focus on high-quality legal services, Mr. Niazi is known for strategic advice and effective representation in various legal forums, earning the trust of clients across multiple areas of law.',
    ],
    specializations: [
      'Civil Courtroom Litigation & Contract Enforcement',
      'Criminal Defense & Appellate Advocacy',
      'Banking Regulations & Recovery Proceedings',
      'Intellectual Property Protection & Enforcement',
      'Service, Employment & Labor Matters',
      'Strategic Courtroom Advisory Across Diverse Forums',
    ],
  },
  {
    id: 'khadija-sharafat-khan',
    name: 'Barrister Khadija Sharafat Khan',
    fullName: 'Barrister Khadija Sharafat Khan',
    designation: 'Advocate High Court · Barrister-at-Law',
    category: 'advocate',
    categoryLabel: 'Barrister & Advocate',
    credentials:
      'Bar-at-Law (Univ of Law, London) · LL.M. · LL.B. (Brunel Univ London) · ADR Specialist',
    pillarWatermark: 'BARRISTER',
    image: khadijaImg,
    maxAspectRatio: 1.15,
    education: [
      'Bar-at-Law, The University of Law, London, UK',
      'Master of Laws (LL.M.)',
      'LL.B., Brunel University London, UK',
    ],
    memberships: [
      'Called to the Bar (The Honourable Society, England & Wales)',
      'Advocate of the High Court',
      'Specialist in Mediation & Alternative Dispute Resolution (ADR)',
    ],
    bioParagraphs: [
      'Barrister Khadija Sharafat Khan holds an LL.B. from Brunel University London, an LL.M., and a Bar-at-Law qualification from the University of Law, London. She is enrolled and actively practices as an Advocate of the High Court.',
      'Her diverse practice covers litigation, family and property law, intellectual property, cybercrime, banking law, and National Accountability Bureau (NAB) related matters.',
      'She also specializes in mediation and Alternative Dispute Resolution (ADR), adopting an empathetic yet assertive approach to resolving disputes with professionalism, integrity, and absolute discretion.',
    ],
    specializations: [
      'High Court Litigation & Judicial Review',
      'Family, Custody, Succession & Property Law',
      'Intellectual Property & Cybercrime Defense',
      'Banking Law & NAB-Related Inquiries',
      'Commercial Mediation & Alternative Dispute Resolution',
      'Assertive Dispute Management with Discretion',
    ],
  },
  {
    id: 'muhammad-ishaq',
    name: 'Mr. Muhammad Ishaq',
    fullName: 'Mr. Muhammad Ishaq',
    designation: 'Office Assistant',
    category: 'support',
    categoryLabel: 'Chambers Staff',
    credentials:
      'Chambers Administration · Court Registry & Judicial Filings Coordinator',
    pillarWatermark: 'REGISTRY',
    image: ishaqImg,
    maxAspectRatio: 1.18,
    education: [
      'Chambers Management & Judicial Record Administration',
    ],
    memberships: [
      'Chambers Administrative Staff',
    ],
    bioParagraphs: [
      'Mr. Muhammad Ishaq serves as Office Assistant at the chambers, managing daily administrative logistics, judicial filing documentation, and registry coordination.',
      'He ensures that case briefs, court cause-lists, certified copies, and judicial submissions are maintained with disciplined accuracy, providing vital operational backbone to the legal team.',
    ],
    specializations: [
      'Court Registry Filings & Submissions',
      'Case Cause-List Tracking & Hearing Calendars',
      'Judicial Record Archiving & File Management',
      'Chambers Administrative Operations',
    ],
  },
  {
    id: 'muhammad-nadeem-azam-saraa',
    name: 'Mr. Muhammad Nadeem Azam Saraa',
    fullName: 'Mr. Muhammad Nadeem Azam Saraa',
    designation: 'Office Assistant',
    category: 'support',
    categoryLabel: 'Chambers Staff',
    credentials:
      'Chambers Administration · Client Reception & Documentation Dispatch',
    pillarWatermark: 'SERVICES',
    image: saraaImg,
    maxAspectRatio: 1.18,
    education: [
      'Legal Office Workflow & Client Support Management',
    ],
    memberships: [
      'Chambers Administrative Staff',
    ],
    bioParagraphs: [
      'Mr. Muhammad Nadeem Azam Saraa is an Office Assistant responsible for front-office workflow, documentation dispatch, and client communication coordination.',
      'He assists the advocates in case compilation, client reception, institutional correspondence, and departmental deliveries across courts and regulatory agencies with dependable efficiency.',
    ],
    specializations: [
      'Client Reception & Appointment Coordination',
      'Document Dispatch & Regulatory Liaison',
      'Case Dossier Assembly & Verification',
      'Office Logistics & Operational Support',
    ],
  },
];

/**
 * Removes any outer solid/studio background if present, detects the exact bounding box
 * of the person, and normalizes the subject onto a uniform portrait canvas.
 */
export function useStudioCutout(src: string, maxAspectRatio = 1.22): string {
  const [cutoutUrl, setCutoutUrl] = useState<string>(src);

  useEffect(() => {
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
  featured?: boolean;
}> = ({ member, onSelect, featured = false }) => {
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
      className={`group relative w-full select-none overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#94542D] rounded-tl-[38px] rounded-b-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-md hover:shadow-xl ${
        featured
          ? 'aspect-[3/3.75] max-w-[340px] border-2 border-[#94542D]/40'
          : 'aspect-[3/3.7] max-w-[305px] border border-[#452415]/15'
      } mx-auto`}
    >
      {/* 
        1. Left Vertical Dark Walnut Pillar:
           - Covers ~46% of the card width on the left
           - Rounded top-left corner (rounded-tl-[38px])
           - Contains vertical outlined watermark text
      */}
      <div
        className="absolute top-0 left-0 bottom-0 w-[46%] bg-[#452415] rounded-tl-[38px] z-[1] overflow-hidden flex items-start justify-center pt-5"
        aria-hidden="true"
      >
        <span
          className="font-sans font-extrabold text-[40px] sm:text-[46px] tracking-[0.04em] leading-none select-none pointer-events-none whitespace-nowrap"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            WebkitTextStroke: '1.25px rgba(243, 240, 231, 0.4)',
            color: 'transparent',
          }}
        >
          {member.pillarWatermark}
        </span>
      </div>

      {/* Top Category Badge */}
      <div className="absolute top-3 right-3 z-[5] pointer-events-none">
        <span
          className={`px-2.5 py-0.5 rounded-full font-sans text-[10px] sm:text-[10.5px] uppercase font-bold tracking-[0.08em] shadow-xs ${
            member.category === 'founding'
              ? 'bg-[#94542D] text-[#F6F6F6] border border-[#F3F0E7]/30'
              : member.category === 'advocate'
              ? 'bg-[#452415]/80 text-[#F3F0E7] border border-[#94542D]/40 backdrop-blur-xs'
              : 'bg-[#F3F0E7] text-[#452415] border border-[#452415]/20 font-semibold'
          }`}
        >
          {member.categoryLabel}
        </span>
      </div>

      {/* 
        2. Foreground Cutout Portrait:
      */}
      <div className="absolute inset-x-0 bottom-0 top-3 z-[2] flex items-end justify-center pointer-events-none">
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
        3. Bottom Full-Width Dark Walnut Gradient Fade & Member Info Lockup:
      */}
      <div
        className="absolute inset-x-0 bottom-0 h-[44%] z-[3] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #452415 0%, rgba(69, 36, 21, 0.96) 42%, rgba(69, 36, 21, 0.55) 75%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <div className="absolute bottom-3.5 left-4 right-3.5 z-[4] flex items-end justify-between gap-2 text-left">
        <div className="pr-1 overflow-hidden">
          <h3 className="font-sans font-bold text-[17px] sm:text-[18.5px] text-[#F6F6F6] tracking-[-0.01em] leading-tight line-clamp-1">
            {member.name}
          </h3>
          <p className="font-sans font-medium text-[11.5px] sm:text-[12px] text-[#F3F0E7]/90 tracking-[0.01em] mt-0.5 line-clamp-1">
            {member.designation}
          </p>
        </div>

        <span
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#94542D] group-hover:bg-[#F3F0E7] text-[#F6F6F6] group-hover:text-[#452415] flex items-center justify-center transition-all duration-200 shrink-0 shadow-xs"
          aria-hidden="true"
        >
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
      </div>
    </div>
  );
};

export const TeamSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<TeamCategory>('all');
  const [selectedProfile, setSelectedProfile] = useState<{
    member: TeamMember;
    cutoutSrc: string;
  } | null>(null);

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

  const filteredMembers =
    selectedCategory === 'all'
      ? TEAM_MEMBERS
      : TEAM_MEMBERS.filter((m) => m.category === selectedCategory);

  const foundingMembers = TEAM_MEMBERS.filter((m) => m.category === 'founding');
  const advocates = TEAM_MEMBERS.filter((m) => m.category === 'advocate');
  const supportStaff = TEAM_MEMBERS.filter((m) => m.category === 'support');

  return (
    <section
      id="team"
      className="relative z-[18] -mt-10 sm:-mt-12 lg:-mt-14 pt-20 sm:pt-24 md:pt-28 pb-24 md:pb-32 bg-[#F6F6F6] rounded-t-[50px] sm:rounded-t-[65px] lg:rounded-t-[80px] rounded-b-[50px] sm:rounded-b-[65px] lg:rounded-b-[80px] border-t-2 border-b-2 border-[#452415]/15 shadow-[0_-25px_50px_-15px_rgba(69,36,21,0.08),0_30px_60px_-15px_rgba(69,36,21,0.1)] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Heading */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-[1px] w-6 bg-[#94542D]" aria-hidden="true" />
            <span className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[#94542D]">
              LEADERSHIP, COUNSEL & CHAMBERS ROSTER
            </span>
            <span className="h-[1px] w-6 bg-[#94542D]" aria-hidden="true" />
          </div>

          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[3.15rem] xl:text-[3.4rem] font-bold text-[#452415] leading-[1.08] tracking-[-0.02em]">
            Profile of the <span className="font-sans italic font-semibold text-[#94542D]">Team</span>
          </h2>

          <p className="mt-4 max-w-3xl mx-auto text-center font-sans text-[15px] sm:text-[16.5px] text-[#612912]/85 leading-[1.65]">
            Meet the senior advocates, founding partners, courtroom counsel, and chambers staff providing disciplined legal representation across High Courts, Supreme Court, tax tribunals, and corporate regulatory authorities.
          </p>

          {/* Interactive Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 sm:px-5 py-2 rounded-full font-sans text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.06em] transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#452415] text-[#F6F6F6] shadow-md'
                  : 'bg-[#F3F0E7] text-[#452415] hover:bg-[#94542D] hover:text-[#F6F6F6]'
              }`}
            >
              All Members ({TEAM_MEMBERS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('founding')}
              className={`px-4 sm:px-5 py-2 rounded-full font-sans text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.06em] transition-all cursor-pointer ${
                selectedCategory === 'founding'
                  ? 'bg-[#94542D] text-[#F6F6F6] shadow-md'
                  : 'bg-[#F3F0E7] text-[#452415] hover:bg-[#94542D] hover:text-[#F6F6F6]'
              }`}
            >
              Founding Members ({foundingMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('advocate')}
              className={`px-4 sm:px-5 py-2 rounded-full font-sans text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.06em] transition-all cursor-pointer ${
                selectedCategory === 'advocate'
                  ? 'bg-[#94542D] text-[#F6F6F6] shadow-md'
                  : 'bg-[#F3F0E7] text-[#452415] hover:bg-[#94542D] hover:text-[#F6F6F6]'
              }`}
            >
              Advocates & Counsel ({advocates.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('support')}
              className={`px-4 sm:px-5 py-2 rounded-full font-sans text-[12.5px] sm:text-[13px] font-bold uppercase tracking-[0.06em] transition-all cursor-pointer ${
                selectedCategory === 'support'
                  ? 'bg-[#94542D] text-[#F6F6F6] shadow-md'
                  : 'bg-[#F3F0E7] text-[#452415] hover:bg-[#94542D] hover:text-[#F6F6F6]'
              }`}
            >
              Chambers Support ({supportStaff.length})
            </button>
          </div>
        </div>

        {/* Display: When 'all' is selected, display structured tiers for visual prestige */}
        {selectedCategory === 'all' ? (
          <div className="space-y-16 sm:space-y-20">
            {/* TIER 1: Founding Members */}
            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-3 border-b border-[#452415]/15">
                <Building2 className="w-5 h-5 text-[#94542D]" aria-hidden="true" />
                <h3 className="font-sans text-[18px] sm:text-[20px] font-bold text-[#452415] tracking-[-0.01em]">
                  Founding Members & Senior Leadership
                </h3>
                <span className="ml-auto text-[11.5px] uppercase tracking-[0.1em] font-bold text-[#94542D] bg-[#94542D]/10 px-2.5 py-0.5 rounded-full">
                  Executive Bench
                </span>
              </div>
              <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 items-end justify-center">
                {foundingMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    featured={true}
                    onSelect={(m, src) => setSelectedProfile({ member: m, cutoutSrc: src })}
                  />
                ))}
              </div>
            </div>

            {/* TIER 2: Advocates & Legal Associates */}
            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-3 border-b border-[#452415]/15">
                <Scale className="w-5 h-5 text-[#94542D]" aria-hidden="true" />
                <h3 className="font-sans text-[18px] sm:text-[20px] font-bold text-[#452415] tracking-[-0.01em]">
                  Advocates & Legal Associates
                </h3>
                <span className="ml-auto text-[11.5px] uppercase tracking-[0.1em] font-bold text-[#94542D] bg-[#94542D]/10 px-2.5 py-0.5 rounded-full">
                  High Court & Barristers
                </span>
              </div>
              <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-end justify-center">
                {advocates.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onSelect={(m, src) => setSelectedProfile({ member: m, cutoutSrc: src })}
                  />
                ))}
              </div>
            </div>

            {/* TIER 3: Chambers Administration & Office Support */}
            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-3 border-b border-[#452415]/15">
                <Users className="w-5 h-5 text-[#94542D]" aria-hidden="true" />
                <h3 className="font-sans text-[18px] sm:text-[20px] font-bold text-[#452415] tracking-[-0.01em]">
                  Chambers Administration & Registry Support
                </h3>
                <span className="ml-auto text-[11.5px] uppercase tracking-[0.1em] font-bold text-[#94542D] bg-[#94542D]/10 px-2.5 py-0.5 rounded-full">
                  Office Operations
                </span>
              </div>
              <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-end justify-center">
                {supportStaff.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onSelect={(m, src) => setSelectedProfile({ member: m, cutoutSrc: src })}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Filtered Grid */
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-end justify-center">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                featured={member.category === 'founding'}
                onSelect={(m, src) => setSelectedProfile({ member: m, cutoutSrc: src })}
              />
            ))}
          </div>
        )}

        {/* Bottom Centered Description Text */}
        <p className="mt-14 sm:mt-16 max-w-4xl mx-auto text-center font-sans text-[15px] sm:text-[16px] text-[#612912]/80 leading-[1.65] font-normal">
          Every member of our team is dedicated to uncompromising professional ethics, thorough evidentiary preparation, and responsive communication, safeguarding your interests before judicial, regulatory, and corporate forums across Pakistan.
        </p>
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
            <div className="relative bg-[#F6F6F6] rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] flex flex-col border-2 border-[#94542D]/40 shadow-[0_30px_80px_-15px_rgba(69,36,21,0.5)] overflow-hidden z-10">
              {/* Top Saddle Brown Accent Bar */}
              <div
                className="h-1.5 w-full shrink-0 bg-gradient-to-r from-[#452415] via-[#94542D] to-[#612912]"
                aria-hidden="true"
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-30 w-9 h-9 rounded-full bg-[#452415] text-[#F6F6F6] hover:bg-[#612912] border border-[#94542D]/40 flex items-center justify-center transition-colors shadow-md cursor-pointer"
                aria-label="Close profile modal"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex flex-col md:grid md:grid-cols-12 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {/* 
                  Left Column (5 Cols): Tailored Executive Portrait Frame & Chamber Seal
                */}
                <div className="md:col-span-5 bg-gradient-to-b from-[#452415] via-[#612912] to-[#452415] pt-10 pb-6 px-5 sm:p-8 flex flex-col items-center justify-between relative shrink-0 border-b md:border-b-0 md:border-r border-[#94542D]/30 text-[#F6F6F6]">
                  {/* Subtle radial ambient glow */}
                  <div
                    className="absolute inset-0 bg-radial from-[#94542D]/20 via-transparent to-black/30 pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Framed Executive Portrait Card */}
                  <div className="relative z-10 w-[215px] h-[276px] sm:w-[235px] sm:h-[302px] rounded-2xl bg-[#F3F0E7] border-2 border-[#94542D]/60 shadow-2xl overflow-hidden shrink-0">
                    {/* Left Vertical Dark Walnut Pillar inside portrait frame */}
                    <div
                      className="absolute top-0 left-0 bottom-0 w-[44%] bg-[#452415] z-[1] flex items-start justify-center pt-6"
                      aria-hidden="true"
                    >
                      <span
                        className="font-sans font-extrabold text-[34px] tracking-[0.04em] leading-none select-none pointer-events-none whitespace-nowrap"
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          WebkitTextStroke: '1px rgba(243, 240, 231, 0.4)',
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

                    {/* Smooth Bottom Dark Walnut Gradient Anchor */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-[34%] z-[3] pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, #452415 0%, rgba(69, 36, 21, 0.94) 40%, transparent 100%)',
                      }}
                      aria-hidden="true"
                    />

                    {/* Framed Portrait Caption */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 z-[4] text-left">
                      <div className="font-sans font-bold text-[15.5px] text-[#F6F6F6] leading-tight line-clamp-1">
                        {selectedProfile.member.name}
                      </div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-[#F3F0E7] font-bold mt-0.5 line-clamp-1">
                        {selectedProfile.member.designation}
                      </div>
                    </div>
                  </div>

                  {/* Chamber Credentials & Direct WhatsApp Action */}
                  <div className="relative z-10 w-full mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[#94542D]/30 text-center">
                    <div className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#F3F0E7] font-bold mb-1">
                      Chambers Jurisdiction & Engagement
                    </div>
                    <div className="font-sans text-[13.5px] sm:text-[14.5px] font-semibold text-[#F6F6F6]/95 mb-4">
                      Pakistan Legal Forums & Advisory
                    </div>

                    <a
                      href={`https://wa.me/${FIRM_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
                        `Assalam-o-Alaikum Rahim Law Associates, I would like to schedule a consultation with ${selectedProfile.member.fullName} (${selectedProfile.member.designation}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-full bg-[#94542D] hover:bg-[#612912] text-[#F6F6F6] font-sans text-[12px] uppercase tracking-[0.06em] font-bold shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-[#F6F6F6]" />
                      <span>Consult via WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* 
                  Right Column (7 Cols): Executive Legal Dossier & Specializations
                */}
                <div className="md:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-between bg-[#F6F6F6] text-[#452415]">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#94542D]/10 border border-[#94542D]/25 text-[#94542D] font-sans text-[11px] uppercase tracking-[0.14em] font-bold mb-3.5">
                      <Award className="w-3.5 h-3.5 text-[#94542D]" aria-hidden="true" />
                      <span>{selectedProfile.member.categoryLabel} Profile</span>
                    </div>

                    <h3
                      id="profile-modal-title"
                      className="font-sans text-2xl sm:text-3.5xl font-bold text-[#452415] tracking-[-0.02em] leading-[1.08]"
                    >
                      {selectedProfile.member.fullName}
                    </h3>

                    <p className="font-sans text-[12px] sm:text-[13.5px] uppercase tracking-[0.08em] font-bold text-[#94542D] mt-1.5 mb-5 pb-4 border-b border-[#452415]/10">
                      {selectedProfile.member.credentials}
                    </p>

                    {/* Editorial Bio Paragraphs */}
                    <div className="space-y-3.5 font-sans text-[14px] sm:text-[15px] text-[#612912]/85 leading-[1.68]">
                      {selectedProfile.member.bioParagraphs.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className={
                            idx === 0
                              ? 'border-l-2 border-[#94542D] pl-4 font-medium text-[#452415]'
                              : 'text-[#612912]/80'
                          }
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Academic Education & Accreditations (if available) */}
                    {selectedProfile.member.education && selectedProfile.member.education.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-[#452415]/10">
                        <h4 className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#94542D] font-bold mb-2.5 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-[#94542D]" />
                          <span>Education & Academic Credentials</span>
                        </h4>
                        <div className="space-y-1.5">
                          {selectedProfile.member.education.map((edu, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[13px] text-[#452415]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#94542D] mt-2 shrink-0" />
                              <span className="font-medium">{edu}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Professional Memberships (if available) */}
                    {selectedProfile.member.memberships && selectedProfile.member.memberships.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#452415]/10">
                        <h4 className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#94542D] font-bold mb-2.5 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#94542D]" />
                          <span>Professional Memberships & Enrolments</span>
                        </h4>
                        <div className="space-y-1.5">
                          {selectedProfile.member.memberships.map((mem, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[13px] text-[#452415]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#94542D] mt-2 shrink-0" />
                              <span>{mem}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specializations */}
                    <div className="mt-6">
                      <h4 className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#94542D] font-bold mb-3">
                        Key Areas of Practice & Expertise
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProfile.member.specializations.map((spec) => (
                          <div
                            key={spec}
                            className="flex items-center gap-2 bg-[#F3F0E7] px-3 py-2 rounded-lg border border-[#452415]/10 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#94542D] shrink-0" />
                            <span className="font-sans text-[12.5px] font-semibold text-[#452415] leading-snug">
                              {spec}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Dossier Footer */}
                  <div className="mt-6 pt-4 border-t border-[#452415]/10 flex items-center justify-between gap-2 text-[12px] font-sans text-[#612912]/70">
                    <span>Verified Chambers Profile · Pakistan</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProfile(null)}
                      className="px-4 py-1.5 rounded-full bg-[#F3F0E7] hover:bg-[#452415] text-[#452415] hover:text-[#F6F6F6] font-semibold transition-colors cursor-pointer shrink-0"
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
