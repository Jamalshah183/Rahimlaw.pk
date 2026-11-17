'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Scale, Search, X } from 'lucide-react';
import { LegalForum } from '../../types/portal';

export const DEFAULT_LEGAL_FORUMS: string[] = [
  'Federal Constitutional Court (FCC)',
  'Supreme Court of Pakistan',
  'Islamabad High Court',
  'Peshawar High Court (Peshawar Bench)',
  'Peshawar High Court (Mingora Bench)',
  'Peshawar High Court (D.I.Khan Bench)',
  'Peshawar High Court (Bannu Bench)',
  'Peshawar High Court (Abbottabad Bench)',
  'Lahore High Court (Principal Seat Lahore)',
  'Lahore High Court (Rawalpindi Bench)',
  'Lahore High Court (Multan Bench)',
  'Lahore High Court (Bahawalpur Bench)',
  'Sindh High Court (Karachi Bench)',
  'Sindh High Court (Hyderabad Bench)',
  'Sindh High Court (Sukkur Bench)',
  'Sindh High Court (Larkana Bench)',
  'Sindh High Court (Mirpur Khas)',
  'Baluchistan High Court (Principal Seat)',
  'Baluchistan High Court (Sibi Bench)',
  'Baluchistan High Court (Khuzdar Bench)',
  'Baluchistan High Court (Loralai Bench)',
  'Baluchistan High Court (Turbat Bench)',
  'Chief Court Gilgit',
  'Supreme Appellate Court of Gilgit Baltistan',
  'AJK High Court',
  'Supreme Court of AJK',
  'Appellate Tribunal Inland Revenue (Islamabad)',
  'Appellate Tribunal Inland Revenue (Lahore)',
  'Appellate Tribunal Inland Revenue (Peshawar)',
  'Appellate Tribunal Inland Revenue (Multan)',
  'Appellate Tribunal Inland Revenue (Karachi)',
  'Appellate Tribunal Inland Revenue (Quetta)',
  'Commissioner Appeals',
  'Commissioner Inland Revenue',
  'Deputy Commissioner Inland Revenue',
  'Assistant Commissioner Inland Revenue',
  'Alternate Dispute Resolution Counsel (ADRC)',
  'Civil Court (Rent)',
  'Civil Court (Family)',
  'Civil Court (Consumer)',
  'Session Courts (Anti Narcotics)',
  'Session Courts (FIA)',
  'Session Courts (Anti Terrorism)',
  'Service Tribunals',
  'Intellectual Property Tribunal',
  'Pakistan Information Commission',
  'Office of Federal Tax Ombudsman (FTO)',
  'Office of Federal Ombudsman'
];

interface SearchableForumSelectProps {
  value: LegalForum;
  onChange: (forum: LegalForum) => void;
  customForums: string[];
  onAddForum: (forumName: string) => string;
}

export const SearchableForumSelect: React.FC<SearchableForumSelectProps> = ({
  value,
  onChange,
  customForums,
  onAddForum
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customForumInput, setCustomForumInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const allForums = useMemo(() => {
    const merged: string[] = [];
    const seen = new Set<string>();
    const addUnique = (item: string) => {
      const clean = item.trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(clean);
      }
    };

    if (value) addUnique(value);
    customForums.forEach(addUnique);
    DEFAULT_LEGAL_FORUMS.forEach(addUnique);

    return merged.sort((a, b) => a.localeCompare(b));
  }, [customForums, value]);

  const customForumSet = useMemo(
    () => new Set(customForums.map((f) => f.trim().toLowerCase())),
    [customForums]
  );

  const filteredForums = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ) return allForums;

    const normalizedQ = rawQ
      .replace(/appellette/g, 'appellate')
      .replace(/\batir\b/g, 'appellate tribunal inland revenue')
      .replace(/\bihc\b/g, 'islamabad high court')
      .replace(/\blhc\b/g, 'lahore high court')
      .replace(/\bphc\b/g, 'peshawar high court')
      .replace(/\bshc\b/g, 'sindh high court')
      .replace(/\bbhc\b/g, 'baluchistan high court');

    const matches = allForums.filter((forum) => {
      const lower = forum.toLowerCase();
      return lower.includes(rawQ) || lower.includes(normalizedQ);
    });

    // Prioritize entries starting with the searched alphabets
    return matches.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = aLower.startsWith(rawQ) || aLower.startsWith(normalizedQ);
      const bStarts = bLower.startsWith(rawQ) || bLower.startsWith(normalizedQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
  }, [allForums, searchQuery]);

  const exactMatchExists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return allForums.some((f) => f.toLowerCase() === q);
  }, [allForums, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 20);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAddingCustom) {
      window.setTimeout(() => {
        customInputRef.current?.focus();
      }, 20);
    }
  }, [isAddingCustom]);

  const handleSelectForum = (forum: string) => {
    onChange(forum);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleCreateCustomForum = (rawName: string) => {
    const clean = rawName.trim();
    if (!clean) return;
    const saved = onAddForum(clean);
    if (saved) {
      onChange(saved);
    } else {
      onChange(clean);
    }
    setCustomForumInput('');
    setSearchQuery('');
    setIsAddingCustom(false);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="font-bold text-gray-700">Legal Forum</label>
        <button
          type="button"
          onClick={() => {
            setIsAddingCustom((prev) => !prev);
            setIsOpen(false);
          }}
          className="text-[11px] font-extrabold text-[#612912] hover:text-[#452415] underline cursor-pointer whitespace-nowrap"
        >
          {isAddingCustom ? '← Select Forum' : '+ Add Forum'}
        </button>
      </div>

      {isAddingCustom ? (
        <div className="bg-[#612912]/5 p-2.5 rounded-xl border border-[#452415]/20 space-y-2">
          <input
            ref={customInputRef}
            type="text"
            value={customForumInput}
            onChange={(e) => setCustomForumInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleCreateCustomForum(customForumInput);
              }
            }}
            placeholder="e.g. Civil Court Islamabad (Rent)"
            className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#612912]"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCreateCustomForum(customForumInput)}
              disabled={!customForumInput.trim()}
              className="flex-1 bg-[#612912] hover:bg-[#452415] disabled:opacity-50 text-white font-bold py-1.5 px-2.5 rounded-lg text-[11px] cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Save Forum</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCustom(false);
                setCustomForumInput('');
              }}
              className="bg-white border border-gray-200 text-gray-600 hover:text-black font-bold py-1.5 px-2 rounded-lg text-[11px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 flex items-center justify-between gap-2 text-left cursor-pointer hover:border-[#612912]/50 focus:outline-none focus:border-[#612912] focus:ring-1 focus:ring-[#612912]"
            title={value || 'Select Legal Forum'}
          >
            <span className="truncate font-bold text-[#1A1A1A] text-xs">
              {value || 'Select Legal Forum'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-50 left-0 mt-1.5 w-full sm:w-[370px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl border border-[#452415]/20 shadow-2xl overflow-hidden font-sans">
              {/* Alphabet Search Input */}
              <div className="p-2.5 bg-[#FAF8F5] border-b border-gray-100 space-y-2">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (filteredForums.length > 0) {
                          handleSelectForum(filteredForums[0]);
                        } else if (searchQuery.trim()) {
                          handleCreateCustomForum(searchQuery);
                        }
                      } else if (e.key === 'Escape') {
                        setIsOpen(false);
                      }
                    }}
                    placeholder="Type alphabets to search forum (e.g. IHC, Lahore, FTO)..."
                    className="w-full bg-white pl-8 pr-7 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#612912]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 px-0.5">
                  <span>Matching Forums ({filteredForums.length})</span>
                  <span className="text-[#612912]">A–Z Alphabetical Search</span>
                </div>
              </div>

              {/* Forums List */}
              <div className="max-h-60 overflow-y-auto p-1 divide-y divide-gray-50">
                {filteredForums.length === 0 ? (
                  <div className="p-3 text-center space-y-2">
                    <p className="text-xs text-gray-500 font-medium">
                      No forum matched &quot;{searchQuery}&quot;
                    </p>
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => handleCreateCustomForum(searchQuery)}
                        className="inline-flex items-center gap-1.5 bg-[#612912] hover:bg-[#452415] text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add &quot;{searchQuery.trim()}&quot;</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredForums.map((forum) => {
                    const isSelected = forum.toLowerCase() === (value || '').toLowerCase();
                    const isCustom = customForumSet.has(forum.toLowerCase());
                    return (
                      <button
                        key={forum}
                        type="button"
                        onClick={() => handleSelectForum(forum)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#612912]/10 text-[#612912] font-extrabold'
                            : 'hover:bg-gray-50 text-gray-800 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Scale className="w-3.5 h-3.5 text-[#612912]/70 shrink-0" />
                          <span className="leading-snug break-words">{forum}</span>
                          {isCustom && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#E5B842]/25 text-[#452415] shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#612912] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer Quick Add Action */}
              <div className="p-2 bg-[#FAF8F5] border-t border-gray-100 flex items-center justify-between gap-2">
                {!exactMatchExists && searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => handleCreateCustomForum(searchQuery)}
                    className="w-full bg-[#612912] hover:bg-[#452415] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="truncate">Add &quot;{searchQuery.trim()}&quot; as New Forum</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsAddingCustom(true);
                    }}
                    className="w-full bg-white hover:bg-[#612912]/5 text-[#612912] border border-[#612912]/25 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Forum (Civil, Session, etc.)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
