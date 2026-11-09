'use client';

import React from 'react';
import {
  ArrowLeft,
  Search
} from 'lucide-react';

interface PortalHeaderProps {
  mode: 'admin' | 'client';
  setMode: (mode: 'admin' | 'client') => void;
  onExitPortal: () => void;
  selectedClientName?: string;
  onClientSelectClick?: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  unreadCount?: number;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  mode,
  setMode,
  onExitPortal,
  selectedClientName,
  onClientSelectClick,
  searchTerm = '',
  setSearchTerm,
  unreadCount = 2
}) => {
  return (
    <header className="bg-[#612912] text-white sticky top-0 z-50 shadow-md border-b border-[#452415]">
      {/* Top Bar Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExitPortal}
            className="flex items-center gap-1.5 text-xs font-bold text-[#E5B842] hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors shrink-0 border border-[#E5B842]/20"
            title="Back to Public Law Firm Website"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Main Website</span>
          </button>
          <span className="hidden md:inline-block text-xs font-medium text-white/80 border-l border-white/20 pl-3">
            Rahim Law Associates <span className="text-[#E5B842]">·</span> Practice & Client Chambers
          </span>
        </div>

        {/* Search Bar (if search setter provided) */}
        {setSearchTerm && (
          <div className="hidden md:flex items-center relative flex-1 max-w-md mx-4">
            <Search className="w-4 h-4 text-[#E5B842]/80 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cases, court filings, client records..."
              className="w-full bg-[#452415]/80 text-white placeholder-white/50 text-xs rounded-xl pl-9 pr-4 py-2 border border-[#E5B842]/30 focus:outline-none focus:border-[#E5B842] transition-all"
            />
          </div>
        )}
      </div>
    </header>
  );
};

