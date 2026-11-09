/**
 * Rahim Law Associates Pakistan - Direct WhatsApp Link Helper
 * Official Law Firm WhatsApp Line
 */

export const LAWFIRM_WHATSAPP_NUMBER = "923455061906"; // Country code 92 for Pakistan
export const DISPLAY_PHONE = "+92 345 5061906";
export const LAWFIRM_EMAIL = "contact@rahimlawassociates.com";
export const LAWFIRM_ADDRESS = "Executive Suite 402, Judicial Heights, Sector F-7/2, Islamabad";
export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/RahimLawAssociates/",
  linkedin: "https://www.linkedin.com/company/rahim-law-associates",
};

export type WhatsAppTopic =
  | 'general'
  | 'fbr_audit'
  | 'tax_calculator'
  | 'practice_area'
  | 'blog_inquiry'
  | 'urgent_notice'
  | 'business_tax'
  | 'criminal_fir'
  | 'civil_case';

interface BuildWhatsAppUrlOptions {
  topic?: WhatsAppTopic;
  customMessage?: string;
  practiceArea?: string;
  articleTitle?: string;
  calcDetails?: {
    income?: string;
    filingStatus?: string;
    estimatedTax?: string;
    estimatedSavings?: string;
    calcType?: string;
  };
}

export function buildWhatsAppUrl(options: BuildWhatsAppUrlOptions = {}): string {
  const { topic = 'general', customMessage, practiceArea, articleTitle, calcDetails } = options;

  let text = '';

  if (customMessage) {
    text = customMessage;
  } else {
    switch (topic) {
      case 'fbr_audit':
        text = `Assalamu Alaikum Rahim Law Associates, I received a court notice / summons and need legal advocate counsel.`;
        break;
      case 'urgent_notice':
        text = `URGENT: I require emergency High Court advocate intervention and stay order advisory.`;
        break;
      case 'tax_calculator':
        if (calcDetails) {
          text = `Assalamu Alaikum Rahim Law Associates, I would like to consult on my tax matter:\n• Category: ${calcDetails.filingStatus || 'Not specified'}\n• Annual Income: ${calcDetails.income || 'Rs. 0'}\n\nI would like an advocate to review my case.`;
        } else {
          text = `Assalamu Alaikum Rahim Law Associates, I would like to consult an advocate for legal advisory.`;
        }
        break;
      case 'practice_area':
        text = `Assalamu Alaikum Rahim Law Associates, I am interested in legal assistance regarding "${practiceArea || 'Litigation & Advisory'}". Please connect me with a Senior Advocate.`;
        break;
      case 'blog_inquiry':
        text = `Assalamu Alaikum Rahim Law Associates, I was reading your legal insight "${articleTitle || 'Legal Insight'}" and have a question regarding my matter.`;
        break;
      case 'business_tax':
        text = `Assalamu Alaikum Rahim Law Associates, I need legal guidance regarding SECP Private Limited incorporation, commercial agreements, or corporate advisory.`;
        break;
      case 'general':
      default:
        text = `Assalamu Alaikum Rahim Law Associates, I would like to consult directly with a Senior Advocate regarding my legal matter.`;
        break;
    }
  }

  const encoded = encodeURIComponent(text);
  return `https://wa.me/${LAWFIRM_WHATSAPP_NUMBER}?text=${encoded}`;
}
