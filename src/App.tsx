import React, { useState, useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { PrincipalAdvocateSection } from './components/PrincipalAdvocateSection';
import { PracticeAreasSection } from './components/PracticeAreasSection';
import { ExperienceStrategyResults } from './components/ExperienceStrategyResults';
import { Testimonials } from './components/Testimonials';
import { InsightsSection } from './components/InsightsSection';
import { InsightsArchivePage } from './components/InsightsArchivePage';
import { InsightDetailPage } from './components/InsightDetailPage';
import { FAQ } from './components/FAQ';
import { TeamSection } from './components/TeamSection';
import { Footer } from './components/Footer';
import { ConsultationModal } from './components/ConsultationModal';
import { LegalModal } from './components/LegalModals';
import { INSIGHTS_DATA } from './data/insightsData';
import { usePortalStore } from './lib/portalStore';
import { mapInsightsToPosts } from './utils/insightMapper';
import { AdminPortal } from './components/portal/AdminPortal';
import { ClientPortal } from './components/portal/ClientPortal';

type RouteState =
  | { view: 'home' }
  | { view: 'insights-archive' }
  | { view: 'insight-detail'; slug: string }
  | { view: 'admin-portal' }
  | { view: 'client-portal' };

function parseLocationRoute(pathname: string): RouteState {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin') {
    return { view: 'admin-portal' };
  }
  if (clean === '/client') {
    return { view: 'client-portal' };
  }
  if (clean === '/insights') {
    return { view: 'insights-archive' };
  }
  if (clean.startsWith('/insights/')) {
    const slug = decodeURIComponent(clean.slice('/insights/'.length));
    if (slug) {
      return { view: 'insight-detail', slug };
    }
    return { view: 'insights-archive' };
  }
  return { view: 'home' };
}

export default function App() {
  const { insights } = usePortalStore();
  const [route, setRoute] = useState<RouteState>(() =>
    parseLocationRoute(window.location.pathname)
  );
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [preselectedPractice, setPreselectedPractice] = useState<string>('');
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const scrollToTopImmediate = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.resize();
      lenisRef.current.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const scrollToSectionHash = useCallback((hash: string) => {
    const cleanHash = hash.startsWith('/') ? hash.slice(1) : hash;
    if (!cleanHash || !cleanHash.startsWith('#')) return;

    const lenis = lenisRef.current;
    lenis?.resize();

    if (cleanHash === '#hero' || cleanHash === '#home') {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.15 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (cleanHash === '#contact') {
      const scrollToBottom = () => {
        lenisRef.current?.resize();
        const maxScroll = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );
        if (lenisRef.current) {
          lenisRef.current.scrollTo(maxScroll, { duration: 1.15 });
        } else {
          window.scrollTo({ top: maxScroll, behavior: 'smooth' });
        }
      };
      scrollToBottom();
      return;
    }

    const targetEl = document.querySelector(cleanHash) as HTMLElement | null;
    if (!targetEl) return;

    const offset = 0;

    if (lenis) {
      lenis.scrollTo(targetEl, { offset, duration: 1.15 });
    } else {
      const top = targetEl.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const navigateToAllInsights = useCallback(() => {
    window.history.pushState({}, '', '/insights');
    setRoute({ view: 'insights-archive' });
    window.requestAnimationFrame(() => {
      scrollToTopImmediate();
    });
  }, [scrollToTopImmediate]);

  const navigateAdmin = useCallback(() => {
    window.history.pushState({}, '', '/admin');
    setRoute({ view: 'admin-portal' });
    window.requestAnimationFrame(() => {
      scrollToTopImmediate();
    });
  }, [scrollToTopImmediate]);

  const navigateClient = useCallback(() => {
    window.history.pushState({}, '', '/client');
    setRoute({ view: 'client-portal' });
    window.requestAnimationFrame(() => {
      scrollToTopImmediate();
    });
  }, [scrollToTopImmediate]);

  const navigateToPost = useCallback(
    (slug: string) => {
      window.history.pushState({}, '', `/insights/${slug}`);
      setRoute({ view: 'insight-detail', slug });
      window.requestAnimationFrame(() => {
        scrollToTopImmediate();
      });
    },
    [scrollToTopImmediate]
  );

  const navigateHome = useCallback(
    (sectionHash?: string) => {
      const normalizedHash =
        sectionHash && sectionHash !== '#hero' && sectionHash !== '#home'
          ? sectionHash.startsWith('#')
            ? sectionHash
            : `#${sectionHash.replace(/^\/+#?/, '')}`
          : undefined;

      const targetUrl = normalizedHash ? `/${normalizedHash}` : '/';
      window.history.pushState({}, '', targetUrl);
      setRoute({ view: 'home' });
      scrollToTopImmediate();

      if (normalizedHash) {
        window.setTimeout(() => {
          scrollToSectionHash(normalizedHash);
        }, 90);
      }
    },
    [scrollToSectionHash, scrollToTopImmediate]
  );

  // Sync browser Back/Forward navigation
  useEffect(() => {
    const onPopState = () => {
      const nextRoute = parseLocationRoute(window.location.pathname);
      setRoute(nextRoute);
      if (nextRoute.view === 'home' && window.location.hash) {
        window.setTimeout(() => {
          scrollToSectionHash(window.location.hash);
        }, 90);
      } else {
        scrollToTopImmediate();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [scrollToSectionHash, scrollToTopImmediate]);

  const isPortal = route.view === 'admin-portal' || route.view === 'client-portal';

  // Ultra-smooth scrolling engine for website, disabled on portals for a straight static page
  useEffect(() => {
    if (isPortal) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      syncTouch: false,
      infinite: false,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    if (window.location.pathname === '/' && window.location.hash) {
      window.setTimeout(() => {
        scrollToSectionHash(window.location.hash);
      }, 120);
    }

    const onAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || anchor.target === '_blank') {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Handle internal /insights links globally (e.g. from Footer)
      if (href === '/insights') {
        e.preventDefault();
        navigateToAllInsights();
        return;
      }
      if (href.startsWith('/insights/')) {
        e.preventDefault();
        const slug = href.slice('/insights/'.length);
        if (slug) navigateToPost(slug);
        return;
      }

      // Handle #hash or /#hash links
      if (href.startsWith('#') || href.startsWith('/#')) {
        if (href === '#' || href === '/#') return;
        e.preventDefault();
        const hash = href.startsWith('/#') ? href.slice(1) : href;

        // If currently on an Insights subpage, return to Home and scroll to section
        if (window.location.pathname !== '/') {
          navigateHome(hash === '#hero' ? undefined : hash);
          return;
        }

        window.history.replaceState({}, '', hash === '#hero' ? '/' : `/${hash}`);
        scrollToSectionHash(hash);
      }
    };

    document.addEventListener('click', onAnchorClick);

    return () => {
      document.removeEventListener('click', onAnchorClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isPortal, navigateHome, navigateToAllInsights, navigateToPost, scrollToSectionHash]);

  const handleOpenConsultation = (practiceTitle?: string) => {
    if (practiceTitle) {
      setPreselectedPractice(practiceTitle);
    }
    setIsConsultationOpen(true);
  };

  const handlePracticeSelectedForContact = (practiceTitle: string) => {
    setPreselectedPractice(practiceTitle);
    scrollToSectionHash('#contact');
  };

  const insightPosts = mapInsightsToPosts(insights);
  const activePost =
    route.view === 'insight-detail'
      ? insightPosts.find((item) => item.slug === route.slug) || insightPosts[0] || INSIGHTS_DATA[0]
      : null;

  useEffect(() => {
    if (route.view === 'insight-detail' && activePost) {
      document.title = `${activePost.title} | Rahim Law Associates`;
    } else if (route.view === 'insights-archive') {
      document.title = 'Legal Insights & Publications | Rahim Law Associates';
    } else {
      document.title = 'Rahim Law Associates | Advocates • Litigation • Legal Advisory';
    }
  }, [route.view, activePost]);

  // Dedicated straight static page for Admin Portal (no scrolling animation, no footer)
  if (route.view === 'admin-portal') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#461C0C] font-sans">
        <div className="bg-[#452415] text-white py-2.5 px-4 text-xs font-semibold flex items-center justify-between border-b border-[#612912]/50 shadow-xs sticky top-0 z-50">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <button
              onClick={() => navigateHome()}
              className="text-[#E5B842] hover:text-white transition-colors flex items-center gap-1.5 font-sans font-medium cursor-pointer bg-transparent border-0"
            >
              ← Back to Main Law Firm Website
            </button>
            <span className="text-[#E5B842]/90 hidden sm:inline font-medium">
              Admin Portal · Rahim Law Associates
            </span>
          </div>
        </div>
        <AdminPortal />
      </div>
    );
  }

  // Dedicated straight static page for Client Portal (no scrolling animation, no footer)
  if (route.view === 'client-portal') {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#FAF8F5] text-[#461C0C] font-sans">
        <div className="bg-[#452415] text-white py-2.5 px-3 sm:px-4 text-xs font-semibold flex items-center justify-between border-b border-[#612912]/50 shadow-xs sticky top-0 z-50">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 min-w-0">
            <button
              onClick={() => navigateHome()}
              className="text-[#E5B842] hover:text-white transition-colors flex items-center gap-1.5 font-sans font-medium cursor-pointer bg-transparent border-0 whitespace-nowrap shrink-0"
            >
              ← Back to Main Law Firm Website
            </button>
            <span className="text-[#E5B842]/90 hidden sm:inline font-medium truncate">
              Client Portal · Rahim Law Associates
            </span>
          </div>
        </div>
        <ClientPortal selectedClientId="cli-101" setSelectedClientId={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#452415] text-[#452415] selection:bg-[#E5B842] selection:text-[#2C1309] font-sans">
      <main
        id="main-content"
        className="relative z-[10] bg-[#FFFFFF] rounded-b-[50px] sm:rounded-b-[65px] lg:rounded-b-[80px] shadow-[0_30px_60px_-15px_rgba(69, 36, 21,0.35)] overflow-hidden"
      >
        {route.view === 'home' && (
          <>
            {/* 1. Hero Section with Top Navigation in its actual position */}
            <Hero 
              onOpenConsultation={() => handleOpenConsultation()} 
              onNavigateAdmin={navigateAdmin}
              onNavigateClient={navigateClient}
            />

            {/* 2. About & Credibility Section */}
            <AboutSection
              onOpenConsultation={() => handleOpenConsultation()}
              onSelectPracticeForConsultation={handlePracticeSelectedForContact}
            />

            {/* 3. Principal Advocate Section */}
            <PrincipalAdvocateSection />

            {/* 4. Practice Areas Section */}
            <PracticeAreasSection
              onSelectPracticeForConsultation={handlePracticeSelectedForContact}
            />

            {/* 6. Why Choose Us — Experience / Strategy / Results Section */}
            <ExperienceStrategyResults />

            {/* 7. Client Testimonials */}
            <Testimonials />

            {/* 8. Legal Insights & Publications Section */}
            <InsightsSection
              onNavigateToAllInsights={navigateToAllInsights}
              onNavigateToPost={navigateToPost}
            />

            {/* 9. FAQ Accordion */}
            <FAQ />

            {/* 10. Board of Directors Section (Last section of main — scrolls up to reveal Footer) */}
            <TeamSection />
          </>
        )}

        {route.view === 'insights-archive' && (
          <InsightsArchivePage
            onNavigateHome={navigateHome}
            onNavigateToPost={navigateToPost}
          />
        )}

        {route.view === 'insight-detail' && activePost && (
          <InsightDetailPage
            post={activePost}
            onNavigateHome={navigateHome}
            onNavigateToAllInsights={navigateToAllInsights}
            onNavigateToPost={navigateToPost}
          />
        )}
      </main>

      {/* Revealing Footer with Integrated WhatsApp Consultation */}
      <Footer
        onOpenPrivacy={() => setLegalModalType('privacy')}
        onOpenTerms={() => setLegalModalType('terms')}
        onOpenConsultation={() => handleOpenConsultation()}
        selectedPracticeArea={preselectedPractice}
      />

      {/* Global Interactive Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        preselectedPractice={preselectedPractice}
      />

      {/* Legal Policy Modals */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
