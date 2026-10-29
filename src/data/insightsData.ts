import gavelImg from '../assets/images/blog_gavel_copper_1793276830980.jpg';
import crossBorderImg from '../assets/images/blog_property_copper_1793276831812.jpg';
import successionImg from '../assets/images/blog_estate_copper_1793276833099.jpg';
import dossierImg from '../assets/images/blog_corporate_copper_1793276832574.jpg';

export interface InsightAuthor {
  name: string;
  role: string;
  credentials: string;
}

export interface InsightSection {
  heading: string;
  paragraphs: string[];
}

export interface InsightPost {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  image: string;
  imageCaption: string;
  number: string;
  readTime: string;
  publishedDate: string;
  author: InsightAuthor;
  date: string;
  content: string;
  sections: InsightSection[];
  pullQuote: string;
  keyTakeaways: string[];
  statutesReferenced: string[];
}

export const INSIGHTS_DATA: InsightPost[] = [
  {
    id: 1,
    slug: 'high-court-stay-orders-interim-relief-pakistan',
    title: 'Securing Interim Injunctions & Stay Orders in High Courts of Pakistan',
    subtitle: 'Strategic requirements, prima facie balance of convenience, and irreparable injury thresholds in civil & corporate disputes.',
    excerpt: 'An authoritative analysis of procedural benchmarks under Order XXXIX of the Civil Procedure Code and constitutional writ petitions before the High Courts.',
    category: 'Litigation & Dispute Resolution',
    image: gavelImg,
    imageCaption: 'Judicial gavel and procedural briefs in High Court practice.',
    number: '01',
    readTime: '6 min read',
    publishedDate: 'Oct 14, 2026',
    author: {
      name: 'Mr. Rahim Nawaz Khan Abbasi',
      role: 'Senior Counsel',
      credentials: 'Advocate High Court · Founding Member',
    },
    date: '2026-10-14',
    content: 'Interim injunctive relief represents one of the most critical legal remedies available in Pakistani civil and commercial jurisprudence.',
    sections: [
      {
        heading: 'The Three-Pronged Legal Standard',
        paragraphs: [
          'Under established High Court and Supreme Court precedents, an applicant must establish a prima facie case, balance of convenience, and prospective irreparable loss.',
          'Failure to substantiation any of these three pillars often proves fatal to stay applications at the initial hearing stage.',
        ],
      },
    ],
    pullQuote: 'A stay order is not an automatic shield; it requires rigorous pleading of irreparable statutory injury.',
    keyTakeaways: [
      'Prima facie strength must be documented with verified title and contractual deeds.',
      'Irreparable injury cannot be compensated merely by subsequent pecuniary damages.',
      'Urgent motion notices must comply with High Court bench scheduling rules.',
    ],
    statutesReferenced: [
      'Code of Civil Procedure 1908 (Order XXXIX, Rules 1 & 2)',
      'Specific Relief Act 1877 (Sections 52 to 57)',
      'Constitution of the Islamic Republic of Pakistan (Article 199)',
    ],
  },
  {
    id: 2,
    slug: 'overseas-pakistanis-property-verification-disputes',
    title: 'Property Title Verification & Asset Protection for Overseas Pakistanis',
    subtitle: 'Essential due diligence frameworks across land revenue authorities, housing societies, and partition litigation.',
    excerpt: 'Guidance on shielding ancestral real estate, scrutinizing Aks-Shajra and Fard documents, and securing power of attorney verification through embassies.',
    category: 'Property & Real Estate',
    image: crossBorderImg,
    imageCaption: 'Land revenue records, title registries, and cross-border verifications.',
    number: '02',
    readTime: '8 min read',
    publishedDate: 'Oct 19, 2026',
    author: {
      name: 'Mr. Rahim Nawaz Khan Abbasi',
      role: 'Senior Counsel',
      credentials: 'Advocate High Court · Founding Member',
    },
    date: '2026-10-19',
    content: 'Overseas Pakistanis face unique jurisdictional and procedural challenges when managing or defending immovable assets located within Pakistan.',
    sections: [
      {
        heading: 'Crucial Revenue Records & Mutation Verifications',
        paragraphs: [
          'Verifying the Jamabandi, Intiqal (Mutation), and Aks-Shajra directly from the Land Record Centers (Arazi Record Center) is essential before any financial commitment.',
          'Special Power of Attorney executed abroad must strictly satisfy Ministry of Foreign Affairs (MOFA) attestation procedures.',
        ],
      },
    ],
    pullQuote: 'Thorough title scrutiny at the Arazi Record Center preempts years of contentious partition litigation.',
    keyTakeaways: [
      'Always verify physical possession alongside digital land records.',
      'Ensure Special Power of Attorney contains specific property delimitations.',
      'Prompt injunctive suits protect against fraudulent third-party alienation.',
    ],
    statutesReferenced: [
      'West Pakistan Land Revenue Act 1967',
      'Transfer of Property Act 1882',
      'Power of Attorney Act 1882',
    ],
  },
  {
    id: 3,
    slug: 'succession-certificates-nadra-court-partition',
    title: 'Succession Certificates & Legal Heirship Distribution in Punjab',
    subtitle: 'Navigating NADRA succession certifications, civil court letters of administration, and complex estate division.',
    excerpt: 'A practical roadmap clarifying when NADRA administrative certificates suffice and when contentious civil court administration proceedings become necessary.',
    category: 'Family & Private Client',
    image: successionImg,
    imageCaption: 'Official seals and estate distribution legal documents.',
    number: '03',
    readTime: '5 min read',
    publishedDate: 'Oct 22, 2026',
    author: {
      name: 'Arfan Shahzad',
      role: 'Associate Advocate',
      credentials: 'Advocate High Court',
    },
    date: '2026-10-22',
    content: 'Following the enactment of recent succession laws in Punjab and Islamabad, legal heirs have access to expedited procedures for moveable assets.',
    sections: [
      {
        heading: 'NADRA vs. Civil Court Administration',
        paragraphs: [
          'Where all legal heirs give verified unanimous consent, NADRA issues digital succession certificates within weeks for bank accounts, stocks, and national savings.',
          'If any dispute or minor heir is involved, formal succession proceedings before the Senior Civil Judge remain mandatory.',
        ],
      },
    ],
    pullQuote: 'Unanimous family consent streamlines succession via NADRA; disputes require civil court administration decrees.',
    keyTakeaways: [
      'Moveable assets can be expedited through digital succession facilitation.',
      'Immovable ancestral property requires declaration and partition suits.',
      'Overseas heirs can execute consular verifications without traveling.',
    ],
    statutesReferenced: [
      'Succession Act 1925 (Sections 370–390)',
      'National Database and Registration Authority Act 2000',
      'Punjab Letters of Administration and Succession Certificates Act 2021',
    ],
  },
  {
    id: 4,
    slug: 'secp-corporate-structuring-tax-compliance-pakistan',
    title: 'SECP Corporate Structuring, FBR Tax Compliance & Directors’ Duties',
    subtitle: 'Statutory compliance obligations for private limited companies, corporate taxation, and regulatory reporting in Pakistan.',
    excerpt: 'Key strategies for business incorporation, annual statutory filings, FBR active taxpayer status maintenance, and mitigating director liabilities.',
    category: 'Corporate & Commercial',
    image: dossierImg,
    imageCaption: 'Corporate dossiers and statutory governance documentation.',
    number: '04',
    readTime: '7 min read',
    publishedDate: 'Oct 26, 2026',
    author: {
      name: 'Mr. Rahim Nawaz Khan Abbasi',
      role: 'Senior Counsel',
      credentials: 'Advocate High Court · Founding Member',
    },
    date: '2026-10-26',
    content: 'Navigating corporate formation and regulatory compliance under the Companies Act 2017 requires strategic alignment between SECP requirements and FBR fiscal rules.',
    sections: [
      {
        heading: 'Corporate Governance & Annual Filing Benchmarks',
        paragraphs: [
          'Companies registered with the Securities and Exchange Commission of Pakistan must maintain statutory registers and lodge annual audited accounts punctually.',
          'Effective corporate structuring protects directors against piercing of the corporate veil in contentious tax and contractual disputes.',
        ],
      },
    ],
    pullQuote: 'Proactive SECP compliance and tax structuring safeguard corporate directors from personal enforcement actions.',
    keyTakeaways: [
      'Timely Form 29 and annual return submissions avoid heavy SECP penalties.',
      'Withholding tax compliance is critical to preserve FBR Active Taxpayer Status (ATL).',
      'Shareholder agreements should explicitly include dispute resolution arbitration clauses.',
    ],
    statutesReferenced: [
      'Companies Act 2017',
      'Income Tax Ordinance 2001',
      'Securities and Exchange Commission of Pakistan Act 1997',
    ],
  },
];

export const INSIGHT_CATEGORIES = [
  'All Publications',
  'Litigation & Dispute Resolution',
  'Property & Real Estate',
  'Family & Private Client',
  'Corporate & Commercial',
];
