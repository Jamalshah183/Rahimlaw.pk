/**
 * Rahim Law Associates - Hero Section Configuration
 * Centralized, independently replaceable configuration for all hero imagery,
 * branding, navigation, copy, and visual parameters.
 */

import heroLeftBg from '../assets/images/hero_bg_left_1793233852825.jpg';
import heroRightBg from '../assets/images/classical_marble_column_1792242281393.jpg';
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
    deepBrown: "#612912",
    primaryCream: "#FFFFFF",
    softCream: "#F8FAFC",
    warmGold: "#E5B842",
    darkText: "#0F172A",
    mutedText: "#475569",
    leftOverlayOpacity: 0.88, // Rich, warm copper matching the CEO section
  },

  // Eyebrow badge
  eyebrow: {
    text: "RAHIM LAW ASSOCIATES",
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
    label: "CONTACT US",
    href: "#contact",
  },
  secondaryCTA: {
    label: "OUR PRACTICE AREAS",
    action: "#practice-areas",
  },

  // Navigation (top-right)
  navigation: [
    { label: "About", href: "#about" },
    { label: "Principal", href: "#principal-advocate" },
    { label: "Our Team", href: "#team" },
    { label: "Practice Areas", href: "#practice-areas" },
    { label: "Insights", href: "#insights" },
    { label: "Contact", href: "#contact" },
  ],
};
