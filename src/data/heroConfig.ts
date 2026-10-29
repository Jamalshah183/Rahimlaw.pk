/**
 * Qadeer Legal Chambers - Hero Section Configuration
 * Centralized, independently replaceable configuration for all hero imagery,
 * branding, navigation, copy, and visual parameters.
 */

import heroLeftBg from '../assets/reference/hero_bg_left.avif';
import heroRightBg from '../assets/reference/hero_bg_scales.avif';
import heroLawyerCutout from '../assets/images/hero_statue_justice_cutout.png';

export interface HeroConfig {
  // 1. Separate Image Layers (Independently controllable & replaceable)
  leftBackground: string;
  rightBackground: string;
  lawyerImage: string;
  logo: string;

  // 2. Color System
  colors: {
    primaryBrown: string;
    deepBrown: string;
    primaryBurgundy?: string;
    deepBurgundy?: string;
    primaryCream: string;
    softCream: string;
    warmGold: string;
    darkText: string;
    mutedText: string;
    leftOverlayOpacity: number; // 0.80 - 0.90
  };

  // 3. Editorial Copy
  eyebrow: {
    text: string;
    icon: string;
  };
  headline: {
    line1: string;
    line2: string;
    line3: string;
  };
  supportingText: string;

  // 4. CTAs
  primaryCTA: {
    label: string;
    href: string;
  };
  secondaryCTA: {
    label: string;
    action: string;
  };

  // 5. Navigation Links (Top-Right on Cream side)
  navigation: Array<{
    label: string;
    href: string;
  }>;
}

export const heroConfig: HeroConfig = {
  // Two completely separate background environments + foreground lawyer cutout
  leftBackground: heroLeftBg,
  rightBackground: heroRightBg,
  lawyerImage: "https://i.ibb.co/Rpr9wxkr/hero-statue-justice-cutout-D5-0yv-P0.png",
  logo: "https://i.ibb.co/xS4KS0LC/Untitled-design-2.png",

  // Brand Palette
  colors: {
    primaryBrown: "#612912",
    deepBrown: "#452415",
    primaryCream: "#FFFFFF",
    softCream: "#F8FAFC",
    warmGold: "#E5B842",
    darkText: "#0F172A",
    mutedText: "#475569",
    leftOverlayOpacity: 0.90, // Rich, warm dark brown overlay
  },

  // Eyebrow badge
  eyebrow: {
    text: "QADEER LEGAL CHAMBERS",
    icon: "Scale",
  },

  // Large editorial headline
  headline: {
    line1: "Local Expertise.",
    line2: "Global Counsel.",
    line3: "Advocates • Litigation • Legal Advisory",
  },

  // Supporting copy
  supportingText:
    "Providing courtroom litigation, Pakistani-law advisory, and dependable local-counsel services in Pakistan for individuals, businesses, overseas Pakistanis, and international law firms.",

  // CTAs
  primaryCTA: {
    label: "OUR PRACTICE AREAS",
    href: "#practice-areas",
  },
  secondaryCTA: {
    label: "INTERNATIONAL COUNSEL",
    action: "#international-counsel",
  },

  // Navigation (top-right)
  navigation: [
    { label: "About", href: "#about" },
    { label: "Principal", href: "#principal-advocate" },
    { label: "Practice Areas", href: "#practice-areas" },
    { label: "Insights", href: "#insights" },
    { label: "Contact", href: "#contact" },
  ],
};
