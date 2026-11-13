'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  FolderOpen,
  Gavel,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  PhoneCall,
  Scale,
  Search,
  ShieldCheck,
  Upload,
  User,
  X
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { usePortalStore } from '../../lib/portalStore';
import { buildGoogleCalendarUrl } from '../../lib/googleCalendar';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { checkRateLimit, recordAttempt, resetRateLimit } from '../../lib/rateLimiter';
import { useInactivityTimeout } from '../../lib/useInactivityTimeout';
import {
  CaseFile,
  Client,
  DocumentItem,
  FBRNotice,
  HearingEvent,
  Invoice
} from '../../types/portal';
import { InvoicePdfModal } from './InvoicePdfModal';

interface ClientPortalProps {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
}

type ClientTab =
  | 'overview'
  | 'cases'
  | 'notices'
  | 'hearings'
  | 'documents'
  | 'billing'
  | 'profile';

const CLIENT_SESSION_KEY = 'rla_client_session_id';

const AUDIT_STAGE_LABELS = [
  'Registered',
  'Notice / Reply',
  'Audit / Assessment',
  'Appeal / Stay Filed',
  'Court Proceedings',
  'Order / Resolved'
];

const DOCUMENT_CATEGORIES: DocumentItem['category'][] = [
  'Bank Statement',
  'Tax Return & Wealth Statement',
  'FBR Notice',
  'Reply & Rebuttal',
  'Wakalatnama / Power of Attorney',
  'Court Order / Stay Order',
  'Fee Challan'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatPkr = (amount?: number) => {
  if (!amount || Number.isNaN(amount)) return 'Rs. 0';
  return `Rs. ${amount.toLocaleString('en-PK')}`;
};

const to24HourTime = (timeStr?: string): string => {
  if (!timeStr) return '10:00';
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '10:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const getCaseStatusStyle = (status: CaseFile['status']) => {
  switch (status) {
    case 'Stay Granted':
    case 'Favorable Order Passed':
    case 'Closed & Settled':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'High Court Writ Active':
    case 'ATIR Tribunal Pending':
    case 'CIR Appeal Pending':
      return 'bg-[#E5B842]/20 text-[#461C0C] border-[#E5B842]/50';
    case 'Under Audit':
    case 'Notice Received':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    default:
      return 'bg-[#612912]/10 text-[#612912] border-[#612912]/20';
  }
};

const getRiskStyle = (risk: CaseFile['riskLevel']) => {
  switch (risk) {
    case 'Critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'High':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
};

const getNoticeStatusStyle = (status: FBRNotice['status']) => {
  switch (status) {
    case 'Pending Reply':
    case 'Show Cause Issued':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Challenged in Appeal':
    case 'Extension Granted':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Reply Submitted':
    case 'Order Passed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getInvoiceStatusStyle = (status: Invoice['status']) => {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Partially Paid':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Overdue':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-[#E5B842]/20 text-[#461C0C] border-[#E5B842]/50';
  }
};

export const ClientPortal: React.FC<ClientPortalProps> = ({
  selectedClientId,
  setSelectedClientId
}) => {
  const {
    clients,
    cases,
    notices,
    documents,
    invoices,
    hearings,
    notifications,
    clientCredentials,
    addDocument,
    markInvoicePaid
  } = usePortalStore();

  // Authentication state
  const [authenticatedClientId, setAuthenticatedClientId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CLIENT_SESSION_KEY) || null;
    }
    return null;
  });
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Filters & search
  const [caseSearch, setCaseSearch] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('All');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState('All');
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('All');

  // Interactive modals / drawers
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CaseFile | null>(null);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload document form state
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentItem['category']>('Bank Statement');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadFileMeta, setUploadFileMeta] = useState<{
    fileSize: string;
    fileType: DocumentItem['fileType'];
    fileName?: string;
    dataUrl?: string;
  }>({
    fileSize: '1.2 MB',
    fileType: 'pdf'
  });

  // Hearing calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const calendarHearingsListRef = useRef<HTMLDivElement | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setActionToast({ type, message });
    setTimeout(() => {
      setActionToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Lock background scroll whenever any overlay drawer or modal is open (prevents double scrollbars)
  useEffect(() => {
    const hasOpenOverlay =
      isMobileMenuOpen ||
      !!selectedCaseDetail ||
      !!selectedInvoiceForPdf ||
      showUploadModal;

    if (hasOpenOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, selectedCaseDetail, selectedInvoiceForPdf, showUploadModal]);

  const completeClientSignIn = (clientId: string) => {
    resetRateLimit('client_login');
    setAuthenticatedClientId(clientId);
    setSelectedClientId(clientId);
    setAuthError(null);
    setActiveTab('overview');
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLIENT_SESSION_KEY, clientId);
    }
  };

  const handleClientSignOut = () => {
    setAuthenticatedClientId(null);
    setIsMobileMenuOpen(false);
    setSelectedCaseDetail(null);
    setSelectedInvoiceForPdf(null);
    setShowUploadModal(false);
    setClientPassword('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CLIENT_SESSION_KEY);
    }
  };

  // Auto-logout after 2 minutes of inactivity
  useInactivityTimeout(
    !!authenticatedClientId,
    () => {
      handleClientSignOut();
      setAuthError('Session closed after 2 minutes of inactivity for your security. Please sign in again.');
    },
    120000
  );

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const rateCheck = checkRateLimit('client_login');
    if (!rateCheck.allowed) {
      setAuthError(rateCheck.message || 'Too many failed sign-in attempts. Please wait a moment and try again.');
      return;
    }
    recordAttempt('client_login');

    const cleanEmail = clientEmail.trim().toLowerCase();
    const rawPassword = clientPassword;

    if (!cleanEmail || !rawPassword) {
      setAuthError('Please enter both your registered email address and password.');
      return;
    }

    // 1. Verify against Client Credentials synced from Admin Portal
    const matchedCred = clientCredentials.find(
      (cred) => cred.email.trim().toLowerCase() === cleanEmail && cred.password === rawPassword
    );
    if (matchedCred) {
      completeClientSignIn(matchedCred.clientId);
      return;
    }

    // 2. Verify against Case-level portal credentials set inside Add/Edit Case modal
    const matchedCase = cases.find(
      (c) =>
        c.clientLoginEmail &&
        c.clientLoginEmail.trim().toLowerCase() === cleanEmail &&
        c.clientLoginPassword === rawPassword
    );
    if (matchedCase) {
      completeClientSignIn(matchedCase.clientId);
      return;
    }

    setAuthError(
      'Invalid email or password. Please verify the Client Portal credentials issued by Rahim Law Associates.'
    );
  };

  const handleClientGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleAuthLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email?.trim().toLowerCase();
      if (!email) throw new Error('No email address was returned by Google.');

      const matchedClient = clients.find((c) => c.email.trim().toLowerCase() === email);
      const matchedCred = clientCredentials.find((c) => c.email.trim().toLowerCase() === email);
      const matchedCase = cases.find(
        (c) => c.clientLoginEmail && c.clientLoginEmail.trim().toLowerCase() === email
      );

      const resolvedId = matchedClient?.id || matchedCred?.clientId || matchedCase?.clientId;
      if (!resolvedId) {
        setAuthError(
          `No active client file is registered under "${res.user.email}". Please sign in with your portal email & password or contact our chambers.`
        );
        return;
      }

      completeClientSignIn(resolvedId);
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In could not be completed. Please use your email and password.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  // Resolve active client profile safely without leaking another client's record
  const currentClient: Client | null = useMemo(() => {
    if (!authenticatedClientId) return null;
    const directClient = clients.find((c) => c.id === authenticatedClientId);
    if (directClient) return directClient;

    // Fallback: synthesize client identity if a case/credential references an inline client not yet hydrated
    const linkedCase = cases.find((c) => c.clientId === authenticatedClientId);
    const linkedCred = clientCredentials.find((c) => c.clientId === authenticatedClientId);
    if (linkedCase || linkedCred) {
      return {
        id: authenticatedClientId,
        name: linkedCase?.clientName || linkedCred?.clientName || 'Registered Client',
        businessName: linkedCase?.clientName || linkedCred?.clientName,
        cnic: 'On Chamber File',
        ntn: linkedCase?.clientNtn || 'N/A',
        category: 'Corporate',
        phone: 'On Chamber File',
        email: linkedCred?.email || linkedCase?.clientLoginEmail || '',
        city: 'Islamabad',
        registeredAddress: 'Registered with Rahim Law Associates',
        activeCasesCount: cases.filter((c) => c.clientId === authenticatedClientId).length,
        totalTaxSaved: 'Rs. 0',
        status: 'Active',
        createdAt: linkedCase?.createdAt || linkedCred?.createdAt || ''
      };
    }
    return null;
  }, [authenticatedClientId, clients, cases, clientCredentials]);

  // Filter all Admin Portal data belonging exclusively to the authenticated client
  const clientCases = useMemo(() => {
    if (!currentClient) return [];
    return cases.filter(
      (c) =>
        c.clientId === currentClient.id ||
        (selectedClientId && c.clientId === authenticatedClientId)
    );
  }, [cases, currentClient, selectedClientId, authenticatedClientId]);

  const clientCaseIds = useMemo(() => new Set(clientCases.map((c) => c.id)), [clientCases]);

  const clientNotices = useMemo(() => {
    if (!currentClient) return [];
    return notices.filter(
      (n) => n.clientId === currentClient.id || clientCaseIds.has(n.caseId)
    );
  }, [notices, currentClient, clientCaseIds]);

  const clientDocs = useMemo(() => {
    if (!currentClient) return [];
    return documents.filter(
      (d) =>
        (d.clientId === currentClient.id || clientCaseIds.has(d.caseId)) &&
        d.isClientVisible !== false
    );
  }, [documents, currentClient, clientCaseIds]);

  const clientInvoices = useMemo(() => {
    if (!currentClient) return [];
    return invoices.filter(
      (inv) => inv.clientId === currentClient.id || clientCaseIds.has(inv.caseId)
    );
  }, [invoices, currentClient, clientCaseIds]);

  const clientNotifications = useMemo(() => {
    if (!currentClient) return [];
    return notifications.filter(
      (n) => n.clientId === currentClient.id || (n.caseId && clientCaseIds.has(n.caseId))
    );
  }, [notifications, currentClient, clientCaseIds]);

  // Merge explicit HearingEvents + any Case nextHearingDate not yet present in hearings
  const clientHearings: HearingEvent[] = useMemo(() => {
    if (!currentClient) return [];
    const directHearings = hearings.filter(
      (h) =>
        clientCaseIds.has(h.caseId) ||
        h.clientName.trim().toLowerCase() === currentClient.name.trim().toLowerCase()
    );

    const existingKeys = new Set(directHearings.map((h) => `${h.caseId}__${h.date}`));
    const derivedFromCases: HearingEvent[] = [];

    clientCases.forEach((c) => {
      if (c.nextHearingDate && !existingKeys.has(`${c.id}__${c.nextHearingDate}`)) {
        derivedFromCases.push({
          id: `derived-${c.id}-${c.nextHearingDate}`,
          caseId: c.id,
          caseTitle: c.caseTitle,
          clientName: c.clientName,
          date: c.nextHearingDate,
          time: '10:00 AM',
          forum: c.forum,
          bench: 'Honourable Bench / Appellate Authority',
          counselAssigned: c.assignedCounsel,
          purpose: c.nextHearingPurpose || 'Court Hearing Proceedings',
          priority: c.riskLevel === 'Critical' ? 'High' : 'Medium'
        });
      }
    });

    return [...directHearings, ...derivedFromCases].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [hearings, clientCases, clientCaseIds, currentClient]);

  // Sync default upload case when modal opens or cases load
  useEffect(() => {
    if (clientCases.length > 0 && !clientCases.some((c) => c.id === uploadCaseId)) {
      setUploadCaseId(clientCases[0].id);
    }
  }, [clientCases, uploadCaseId]);

  // Aggregated client statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingHearings = clientHearings.filter((h) => h.date >= todayStr);
    const pendingNotices = clientNotices.filter(
      (n) => n.status === 'Pending Reply' || n.status === 'Show Cause Issued'
    );
    const totalBilledPkr = clientInvoices.reduce(
      (sum, inv) => sum + (inv.retainerFeePkr + inv.hearingFeePkr),
      0
    );
    const totalPaidPkr = clientInvoices.reduce(
      (sum, inv) => sum + Math.min(inv.paidAmountPkr, inv.retainerFeePkr + inv.hearingFeePkr),
      0
    );
    const outstandingPkr = Math.max(0, totalBilledPkr - totalPaidPkr);
    const totalSavedPkr = clientCases.reduce((sum, c) => sum + (c.savedAmountPkr || 0), 0);
    const totalDemandPkr = clientCases.reduce((sum, c) => sum + (c.demandAmountPkr || 0), 0);

    return {
      upcomingHearings,
      nextHearing: upcomingHearings[0] || clientHearings[0] || null,
      pendingNotices,
      totalBilledPkr,
      totalPaidPkr,
      outstandingPkr,
      totalSavedPkr,
      totalDemandPkr
    };
  }, [clientHearings, clientNotices, clientInvoices, clientCases]);

  // Filtered lists
  const filteredCases = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    return clientCases.filter((c) => {
      const matchesQuery =
        !q ||
        c.caseTitle.toLowerCase().includes(q) ||
        c.caseRef.toLowerCase().includes(q) ||
        c.forum.toLowerCase().includes(q) ||
        c.taxYear.toLowerCase().includes(q) ||
        c.assignedCounsel.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q);
      const matchesStatus = caseStatusFilter === 'All' || c.status === caseStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [clientCases, caseSearch, caseStatusFilter]);

  const filteredNotices = useMemo(() => {
    const q = noticeSearch.trim().toLowerCase();
    return clientNotices.filter((n) => {
      const matchesQuery =
        !q ||
        n.cnoNumber.toLowerCase().includes(q) ||
        n.sectionCode.toLowerCase().includes(q) ||
        n.noticeTitle.toLowerCase().includes(q) ||
        n.issuingOfficer.toLowerCase().includes(q) ||
        n.taxYear.toLowerCase().includes(q);
      const matchesStatus = noticeStatusFilter === 'All' || n.status === noticeStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [clientNotices, noticeSearch, noticeStatusFilter]);

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return clientDocs.filter((d) => {
      const matchesQuery =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.uploadedBy.toLowerCase().includes(q);
      const matchesCategory = docCategoryFilter === 'All' || d.category === docCategoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [clientDocs, docSearch, docCategoryFilter]);

  // Calendar grid days for selected month
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ day: d, dateStr: `${year}-${mStr}-${dStr}` });
    }
    return cells;
  }, [calendarMonth]);

  const hearingsByDate = useMemo(() => {
    const map: Record<string, HearingEvent[]> = {};
    clientHearings.forEach((h) => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    });
    return map;
  }, [clientHearings]);

  const displayedHearings = useMemo(() => {
    if (!selectedCalendarDate) return clientHearings;
    return clientHearings.filter((h) => h.date === selectedCalendarDate);
  }, [clientHearings, selectedCalendarDate]);

  const handleSelectCalendarDate = (dateStr: string) => {
    setSelectedCalendarDate((prev) => (prev === dateStr ? null : dateStr));
    setTimeout(() => {
      calendarHearingsListRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 60);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    let mappedType: DocumentItem['fileType'] = 'pdf';
    if (ext === 'doc' || ext === 'docx') mappedType = 'doc';
    else if (ext === 'png') mappedType = 'png';
    else if (ext === 'jpg' || ext === 'jpeg') mappedType = 'jpg';

    const sizeMb = file.size / (1024 * 1024);
    const sizeLabel =
      sizeMb >= 1
        ? `${sizeMb.toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    if (!uploadDocTitle.trim()) {
      setUploadDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    setUploadFileMeta({
      fileSize: sizeLabel,
      fileType: mappedType,
      fileName: file.name
    });
  };

  const handleUploadClientDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    const targetCaseId = uploadCaseId || clientCases[0]?.id || 'general-client-file';
    const docTitle = uploadDocTitle.trim() || uploadFileMeta.fileName || 'Client Supporting Document';

    addDocument({
      caseId: targetCaseId,
      clientId: currentClient.id,
      title: docTitle,
      category: uploadCategory,
      fileSize: uploadFileMeta.fileSize,
      uploadedBy: currentClient.name,
      fileType: uploadFileMeta.fileType,
      downloadUrl: '#',
      isClientVisible: true
    });

    setShowUploadModal(false);
    setUploadDocTitle('');
    setUploadFileMeta({ fileSize: '1.2 MB', fileType: 'pdf' });
    showToast(`"${docTitle}" uploaded to your case document vault.`);
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
    if (doc.downloadUrl && doc.downloadUrl !== '#') {
      const link = document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = `${doc.title}.${doc.fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Generate a clean certified text summary receipt download if no external file URL is attached
    const linkedCase = clientCases.find((c) => c.id === doc.caseId);
    const content = [
      'RAHIM LAW ASSOCIATES — CERTIFIED CASE DOCUMENT RECORD',
      '======================================================',
      `Document Title : ${doc.title}`,
      `Category       : ${doc.category}`,
      `Client         : ${currentClient?.name || 'Registered Client'} (NTN: ${currentClient?.ntn || 'N/A'})`,
      `Case Reference : ${linkedCase ? `${linkedCase.caseRef} — ${linkedCase.caseTitle}` : doc.caseId}`,
      `Uploaded By    : ${doc.uploadedBy}`,
      `Uploaded Date  : ${doc.uploadedAt}`,
      `File Size      : ${doc.fileSize} (${doc.fileType.toUpperCase()})`,
      '',
      'For the original court-stamped scan, please contact Rahim Law Associates Chambers (+92 345 5061906).'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Record.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded certified record for "${doc.title}".`, 'info');
  };

  // =====================================================================
  // UNAUTHENTICATED VIEW: CLIENT LOGIN SCREEN (EMAIL & PASSWORD REQUIRED)
  // =====================================================================
  if (!authenticatedClientId || !currentClient) {
    return (
      <div className="admin-portal-root font-nexa min-h-[calc(100vh-40px)] w-full max-w-full overflow-x-clip bg-[#FAF8F5] text-[#461C0C] flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-[#E5B842] selection:text-[#2A160E]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#452415]/15 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Firm Branding */}
          <div className="text-center space-y-3">
            <div className="relative w-52 sm:w-60 h-16 sm:h-20 mx-auto">
              <img
                src="https://i.ibb.co/xS4KS0LC/Untitled-design-2.png"
                alt="Rahim Law Associates Logo"
                className="w-full h-full object-contain object-center mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-[#612912]/10 text-[#612912] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#612912]" />
              <span>Rahim Law Associates Client Portal</span>
            </div>

            <h1 className="text-2xl sm:text-[26px] font-heading font-extrabold text-[#1A1A1A] leading-tight">
              Client Case &amp; Vault Sign In
            </h1>
            <p className="text-xs text-[#5A6275] leading-relaxed">
              Sign in with the email address and password assigned to your legal file to view live case progress, FBR notices, hearing dates, documents &amp; invoices.
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl font-medium space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Sign-In Notice</span>
              </div>
              <p className="leading-relaxed">{authError}</p>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleClientLogin} className="space-y-4">
            <div>
              <label
                htmlFor="client-login-email"
                className="block text-[11px] font-bold text-[#461C0C] mb-1.5"
              >
                Client Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#612912]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="client-login-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="name@company.com.pk"
                  required
                  autoComplete="email"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm sm:text-xs bg-[#FAF8F5] border border-[#612912]/20 rounded-xl text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="client-login-password"
                className="block text-[11px] font-bold text-[#461C0C] mb-1.5"
              >
                Portal Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#612912]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="client-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={clientPassword}
                  onChange={(e) => setClientPassword(e.target.value)}
                  placeholder="Enter your assigned password"
                  required
                  autoComplete="current-password"
                  className="w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm sm:text-xs bg-[#FAF8F5] border border-[#612912]/20 rounded-xl text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#612912]/60 hover:text-[#612912] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] bg-[#612912] hover:bg-[#452415] active:scale-[0.99] text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer border border-[#E5B842]/30"
            >
              <KeyRound className="w-4 h-4 text-[#E5B842] shrink-0" />
              <span>Access My Legal Portal</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              or continue with
            </span>
          </div>

          {/* Google Sign-In for Registered Client Email */}
          <button
            type="button"
            onClick={handleClientGoogleSignIn}
            disabled={googleAuthLoading}
            className="w-full min-h-[44px] bg-white hover:bg-[#FAF8F5] text-[#461C0C] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs border border-[#612912]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.28 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.72 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{googleAuthLoading ? 'Verifying Google Account...' : 'Sign in with Registered Google Email'}</span>
          </button>

          {/* Chamber Support Strip */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <p className="text-[11px] text-center text-[#5A6275]">
              Need your portal credentials or urgent court assistance?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={buildWhatsAppUrl({
                  customMessage:
                    'Assalamu Alaikum Rahim Law Associates, I would like to request my Client Portal login credentials.'
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#15803d] font-bold text-xs px-3 py-2 rounded-xl border border-[#25D366]/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp Desk</span>
              </a>
              <a
                href="tel:+923455061906"
                className="min-h-[44px] bg-[#FAF8F5] hover:bg-[#612912]/5 text-[#612912] font-bold text-xs px-3 py-2 rounded-xl border border-[#612912]/15 flex items-center justify-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-4 h-4 shrink-0" />
                <span>+92 345 5061906</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // AUTHENTICATED VIEW: RESPONSIVE CLIENT PORTAL WORKSPACE
  // =====================================================================
  const navItems: Array<{
    id: ClientTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'cases', label: 'My Cases', icon: Briefcase, badge: clientCases.length },
    { id: 'notices', label: 'FBR Notices', icon: FileText, badge: clientNotices.length },
    { id: 'hearings', label: 'Hearings', icon: CalendarIcon, badge: clientHearings.length },
    { id: 'documents', label: 'Documents', icon: FolderOpen, badge: clientDocs.length },
    { id: 'billing', label: 'Billing', icon: CreditCard, badge: clientInvoices.length },
    { id: 'profile', label: 'Alerts & Profile', icon: Bell, badge: clientNotifications.length }
  ];

  const activeNavObj = navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleTabSwitch = (tab: ClientTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="admin-portal-root font-nexa min-h-screen w-full max-w-full overflow-x-clip bg-[#FAF8F5] text-[#1A1A1A] flex flex-col md:flex-row selection:bg-[#E5B842] selection:text-[#2A160E]">
      {/* --- MOBILE APP STICKY TOP HEADER --- */}
      <header className="md:hidden sticky top-[37px] z-40 bg-[#612912] text-white px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-[#452415] shadow-md">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2 text-xs font-extrabold cursor-pointer border border-white/15 shrink-0"
          aria-label="Open Client Navigation"
        >
          <Menu className="w-5 h-5 text-[#E5B842]" />
          <span className="whitespace-nowrap">Menu</span>
        </button>

        <div className="text-center min-w-0 flex-1 px-1">
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#E5B842] block truncate">
            {currentClient.businessName || currentClient.name}
          </span>
          <h2 className="text-xs font-heading font-extrabold text-white truncate">
            {activeNavObj.label}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-[#E5B842] hover:bg-[#D4A533] text-[#1A1A1A] font-extrabold text-xs flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5 shrink-0" />
          <span>Upload</span>
        </button>
      </header>

      {/* --- ANIMATED MOBILE SLIDE-IN / SLIDE-OUT DRAWER --- */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-[60] transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-[#612912] text-white z-[60] p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto space-y-5 pr-1">
          <div className="flex items-center justify-between border-b border-[#452415] pb-4 gap-2">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#E5B842] block">
                Client Legal Portal
              </span>
              <h2 className="text-sm font-heading font-extrabold text-white truncate">
                {currentClient.name}
              </h2>
              <span className="text-[10px] font-mono text-amber-100/80 block truncate">
                NTN: {currentClient.ntn}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
              aria-label="Close Navigation Drawer"
            >
              <X className="w-5 h-5 text-[#E5B842]" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabSwitch(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    isActive
                      ? 'bg-[#E5B842] text-[#1A1A1A] shadow-md font-extrabold'
                      : 'text-amber-100/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 tabular-nums ${
                        isActive ? 'bg-[#612912] text-white' : 'bg-white/20 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#452415]/60 text-xs text-[#E5B842] space-y-3 shrink-0">
          <div className="min-w-0">
            <div className="font-bold text-white text-xs truncate">{currentClient.category}</div>
            <div className="text-[10px] text-[#E5B842] font-mono truncate">{currentClient.email}</div>
          </div>
          <button
            type="button"
            onClick={handleClientSignOut}
            className="w-full min-h-[44px] bg-red-600/90 hover:bg-red-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Portal</span>
          </button>
        </div>
      </aside>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-64 bg-[#612912] text-white shrink-0 border-r border-[#452415] p-5 flex-col justify-between min-h-[calc(100vh-40px)] sticky top-[40px] self-start">
        <div>
          <div className="mb-6 px-1 pt-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#E5B842] block">
              Client Case Workspace
            </span>
            <h2 className="text-base font-heading font-extrabold text-white leading-snug mt-0.5 break-words">
              {currentClient.businessName || currentClient.name}
            </h2>
            <span className="text-[11px] font-mono text-amber-100/80 block mt-1">
              NTN: {currentClient.ntn}
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabSwitch(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E5B842] text-[#1A1A1A] shadow-md font-extrabold'
                      : 'text-amber-100/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                        isActive ? 'bg-[#612912] text-white' : 'bg-white/15 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#452415]/60 text-[11px] text-[#E5B842] space-y-3">
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{currentClient.name}</div>
            <div className="text-[10px] text-[#E5B842] font-mono truncate">{currentClient.email}</div>
          </div>
          <button
            type="button"
            onClick={handleClientSignOut}
            className="w-full bg-red-600/85 hover:bg-red-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CLIENT WORKSPACE CONTENT --- */}
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-clip p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
        {/* Inline Action Toast */}
        {actionToast && (
          <div
            role="status"
            className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between gap-3 text-xs font-bold ${
              actionToast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-[#E5B842]/15 border-[#E5B842]/40 text-[#461C0C]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span className="break-words">{actionToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="text-current/70 hover:text-current p-1 cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Client Profile Summary Bar */}
        <section className="bg-white p-4 sm:p-6 rounded-3xl border border-[#452415]/15 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#612912] text-[#E5B842] flex items-center justify-center font-heading font-extrabold text-xl shadow-md shrink-0">
              {currentClient.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#612912]/10 text-[#612912] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {currentClient.category}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#475569]">
                  NTN: {currentClient.ntn}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    currentClient.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {currentClient.status}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-heading font-extrabold text-[#1A1A1A] mt-1 break-words">
                {currentClient.name}
              </h1>
              <p className="text-xs text-[#5A6275] break-words">
                {currentClient.registeredAddress} • {currentClient.city} •{' '}
                <span className="font-mono text-[#612912] font-semibold">{currentClient.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="flex-1 sm:flex-initial min-h-[44px] bg-[#612912] hover:bg-[#452415] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4 text-[#E5B842] shrink-0" />
              <span className="whitespace-nowrap">Upload Document</span>
            </button>
            <a
              href={buildWhatsAppUrl({
                customMessage: `Assalamu Alaikum Rahim Law Associates, this is ${currentClient.name} (NTN: ${currentClient.ntn}) inquiring regarding my active legal portfolio.`
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial min-h-[44px] bg-[#25D366] hover:bg-[#1fb858] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Chat Counsel</span>
            </a>
          </div>
        </section>

        {/* =============================================================
            TAB 1: OVERVIEW
            ============================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => handleTabSwitch('cases')}
                className="text-left bg-white p-5 rounded-2xl border border-[#452415]/15 shadow-sm hover:border-[#612912]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#612912] mb-2">
                  <span className="text-xs font-bold text-[#5A6275]">Active Case Files</span>
                  <Briefcase className="w-5 h-5 text-[#612912] shrink-0" />
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#1A1A1A] tabular-nums">
                  {clientCases.length} Files
                </div>
                <div className="text-[11px] font-semibold text-[#612912] mt-1">
                  Disputed Claims: {formatPkr(stats.totalDemandPkr)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('notices')}
                className="text-left bg-white p-5 rounded-2xl border border-[#452415]/15 shadow-sm hover:border-[#612912]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#612912] mb-2">
                  <span className="text-xs font-bold text-[#5A6275]">FBR Statutory Notices</span>
                  <AlertCircle className="w-5 h-5 text-[#E5B842] shrink-0" />
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#1A1A1A] tabular-nums">
                  {clientNotices.length} Notices
                </div>
                <div className="text-[11px] font-semibold text-[#612912] mt-1">
                  {stats.pendingNotices.length > 0
                    ? `${stats.pendingNotices.length} requiring active reply`
                    : 'All replies tracked cleanly'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('hearings')}
                className="text-left bg-white p-5 rounded-2xl border border-[#452415]/15 shadow-sm hover:border-[#612912]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#612912] mb-2">
                  <span className="text-xs font-bold text-[#5A6275]">Scheduled Hearings</span>
                  <CalendarIcon className="w-5 h-5 text-[#612912] shrink-0" />
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#1A1A1A] tabular-nums">
                  {stats.upcomingHearings.length} Upcoming
                </div>
                <div className="text-[11px] font-semibold text-[#612912] mt-1 truncate">
                  {stats.nextHearing
                    ? `Next: ${stats.nextHearing.date} (${stats.nextHearing.time})`
                    : 'No upcoming dates listed'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('billing')}
                className="text-left bg-white p-5 rounded-2xl border border-[#452415]/15 shadow-sm hover:border-[#612912]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#612912] mb-2">
                  <span className="text-xs font-bold text-[#5A6275]">Tax Relief &amp; Balance</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#612912] tabular-nums">
                  {stats.totalSavedPkr > 0
                    ? formatPkr(stats.totalSavedPkr)
                    : currentClient.totalTaxSaved || 'Rs. 0'}
                </div>
                <div className="text-[11px] font-semibold text-[#5A6275] mt-1 tabular-nums">
                  Fee Balance Due: <span className="text-[#612912] font-bold">{formatPkr(stats.outstandingPkr)}</span>
                </div>
              </button>
            </div>

            {/* Next Scheduled Hearing Highlight */}
            {stats.nextHearing && (
              <div className="bg-[#612912] text-white p-5 sm:p-6 rounded-3xl shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-[#E5B842] text-[#1A1A1A] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Gavel className="w-3.5 h-3.5 shrink-0" />
                    <span>Next Court Appearance on Cause List</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-extrabold text-white break-words">
                    {stats.nextHearing.caseTitle}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-100">
                    <span className="flex items-center gap-1.5 font-bold text-[#E5B842]">
                      <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                      {stats.nextHearing.date} at {stats.nextHearing.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 shrink-0" />
                      {stats.nextHearing.forum}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 shrink-0" />
                      {stats.nextHearing.bench}
                    </span>
                  </div>
                  <p className="text-xs text-amber-50/90 break-words">
                    <strong className="text-[#E5B842]">Purpose:</strong> {stats.nextHearing.purpose} •{' '}
                    <strong className="text-[#E5B842]">Counsel:</strong> {stats.nextHearing.counselAssigned}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <a
                    href={buildGoogleCalendarUrl({
                      title: `Court Hearing: ${stats.nextHearing.caseTitle}`,
                      startDate: stats.nextHearing.date,
                      startTime: to24HourTime(stats.nextHearing.time),
                      location: `${stats.nextHearing.forum} — ${stats.nextHearing.bench}`,
                      details: `Purpose: ${stats.nextHearing.purpose} | Counsel: ${stats.nextHearing.counselAssigned}`
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] bg-[#E5B842] hover:bg-[#d9ab38] text-[#1A1A1A] text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CalendarCheck className="w-4 h-4 shrink-0" />
                    <span>Add to Calendar</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('hearings')}
                    className="min-h-[44px] bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Full Cause List</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Two Column Preview: Active Cases & Pending Notices / Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Cases Snapshot */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-heading font-extrabold text-[#1A1A1A] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#612912] shrink-0" />
                    <span>Your Active Cases</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('cases')}
                    className="text-xs font-bold text-[#612912] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {clientCases.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-slate-200 text-center text-xs text-[#5A6275]">
                    No active case files have been linked to your profile yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientCases.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-extrabold text-[#612912]">
                            {c.caseRef}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCaseStatusStyle(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-heading font-bold text-[#1A1A1A] leading-snug break-words">
                          {c.caseTitle}
                        </h3>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5A6275]">
                          <span>{c.forum}</span>
                          <span className="font-bold text-[#612912] tabular-nums">
                            Demand: {formatPkr(c.demandAmountPkr)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCaseDetail(c)}
                          className="w-full min-h-[40px] bg-white hover:bg-[#612912] hover:text-white text-[#612912] border border-[#612912]/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Inspect Case File &amp; Order Sheets
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notices & Chamber Messages Snapshot */}
              <div className="space-y-6 min-w-0">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-heading font-extrabold text-[#1A1A1A] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#612912] shrink-0" />
                      <span>FBR Notices &amp; Deadlines</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('notices')}
                      className="text-xs font-bold text-[#612912] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {clientNotices.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-slate-200 text-center text-xs text-[#5A6275]">
                      No FBR statutory notices are currently logged against your account.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientNotices.slice(0, 2).map((n) => (
                        <div
                          key={n.id}
                          className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200 space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#612912]">
                              {n.cnoNumber} • u/s {n.sectionCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getNoticeStatusStyle(
                                n.status
                              )}`}
                            >
                              {n.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-[#1A1A1A] break-words">
                            {n.noticeTitle}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5A6275]">
                            <span>Due: <strong className="text-[#461C0C]">{n.dueDate}</strong></span>
                            <span className="font-bold text-[#612912] tabular-nums">
                              {formatPkr(n.disputedAmountPkr)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Invoices / Chamber Notifications Quick Box */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-heading font-extrabold text-[#1A1A1A] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#612912] shrink-0" />
                      <span>Fee Retainers &amp; Alerts</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('billing')}
                      className="text-xs font-bold text-[#612912] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Billing Ledger</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {clientInvoices.length === 0 && clientNotifications.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-slate-200 text-center text-xs text-[#5A6275]">
                      No pending invoices or chamber alerts at this time.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {clientInvoices.slice(0, 2).map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] font-bold text-[#612912]">
                              {inv.invoiceNumber}
                            </div>
                            <div className="text-xs font-bold text-[#1A1A1A] truncate">
                              {inv.serviceDescription}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            <span className="font-bold text-xs text-[#612912] tabular-nums">
                              {formatPkr(inv.retainerFeePkr + inv.hearingFeePkr)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getInvoiceStatusStyle(
                                inv.status
                              )}`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}

                      {clientNotifications.slice(0, 1).map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3.5 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/40 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold text-[#612912] uppercase">
                            <span>{notif.type} Chamber Alert</span>
                            <span>{notif.sentAt}</span>
                          </div>
                          <div className="text-xs font-bold text-[#1A1A1A]">{notif.title}</div>
                          <p className="text-[11px] text-[#461C0C]/85 break-words">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            TAB 2: MY CASES
            ============================================================= */}
        {activeTab === 'cases' && (
          <div className="space-y-5">
            {/* Search & Status Filter */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                    Active Litigation &amp; Tax Defense Files
                  </h2>
                  <p className="text-xs text-[#5A6275]">
                    Complete case summaries, demand values, stages, next hearing schedules &amp; court order sheets.
                  </p>
                </div>
                <span className="self-start sm:self-auto bg-[#612912]/10 text-[#612912] text-xs font-extrabold px-3 py-1 rounded-full tabular-nums">
                  {filteredCases.length} of {clientCases.length} Files
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-[#612912]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    placeholder="Search by case title, ref no, forum, tax year, or counsel..."
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-xs bg-[#FAF8F5] border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912]"
                  />
                </div>
                <select
                  value={caseStatusFilter}
                  onChange={(e) => setCaseStatusFilter(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-bold bg-[#FAF8F5] border border-slate-200 rounded-xl text-[#461C0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912]"
                >
                  <option value="All">All Case Statuses</option>
                  {Array.from(new Set(clientCases.map((c) => c.status))).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Case Cards List */}
            {filteredCases.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-[#452415]/15 text-center space-y-2">
                <Briefcase className="w-8 h-8 text-[#612912]/40 mx-auto" />
                <div className="font-heading font-bold text-sm text-[#1A1A1A]">No Matching Case Files Found</div>
                <p className="text-xs text-[#5A6275]">
                  Try clearing your search filter or contact Rahim Law Associates chambers for assistance.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredCases.map((c) => {
                  const stagePct = Math.min(100, Math.max(10, Math.round((c.auditStage / 6) * 100)));
                  const linkedNoticeCount = clientNotices.filter((n) => n.caseId === c.id).length;
                  const linkedDocCount = clientDocs.filter((d) => d.caseId === c.id).length;

                  return (
                    <article
                      key={c.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-[#452415]/15 shadow-sm space-y-5"
                    >
                      {/* Header */}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-[#612912] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                              {c.forum}
                            </span>
                            <span className="font-mono text-xs font-extrabold text-[#612912]">
                              Ref: {c.caseRef}
                            </span>
                            <span className="text-[11px] font-bold text-[#5A6275] bg-slate-100 px-2 py-0.5 rounded-md">
                              {c.taxYear}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRiskStyle(
                                c.riskLevel
                              )}`}
                            >
                              {c.riskLevel} Priority
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#1A1A1A] leading-snug break-words">
                            {c.caseTitle}
                          </h3>
                          <div className="text-xs text-[#5A6275]">
                            Lead Counsel:{' '}
                            <strong className="text-[#612912]">{c.assignedCounsel}</strong>{' '}
                            <span className="hidden sm:inline text-[#5A6275]">({c.assignedCounselTitle})</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-full border ${getCaseStatusStyle(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                          <a
                            href={buildWhatsAppUrl({
                              customMessage: `Assalamu Alaikum, I am contacting regarding Case Ref ${c.caseRef} (${c.caseTitle}).`
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[40px] bg-[#25D366] hover:bg-[#1fb858] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Counsel WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* Financial & Stage Progress Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                            Disputed Tax Demand
                          </span>
                          <span className="text-sm font-heading font-extrabold text-[#1A1A1A] tabular-nums">
                            {formatPkr(c.demandAmountPkr)}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                            Relief / Protected
                          </span>
                          <span className="text-sm font-heading font-extrabold text-emerald-700 tabular-nums">
                            {formatPkr(c.savedAmountPkr)}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                            Litigation Stage ({c.auditStage}/6)
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#612912] rounded-full transition-all"
                                style={{ width: `${stagePct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-extrabold text-[#612912] whitespace-nowrap">
                              {AUDIT_STAGE_LABELS[(c.auditStage || 1) - 1] || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Case Summary & Next Hearing */}
                      <div className="space-y-3">
                        <p className="text-xs text-[#461C0C]/90 leading-relaxed break-words">
                          {c.summary}
                        </p>

                        {c.nextHearingDate && (
                          <div className="p-3.5 rounded-2xl bg-[#E5B842]/15 border border-[#E5B842]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <span className="font-extrabold text-[#612912] block">
                                Next Hearing Date: {c.nextHearingDate}
                              </span>
                              {c.nextHearingPurpose && (
                                <span className="text-[#461C0C] break-words">
                                  Purpose: {c.nextHearingPurpose}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCalendarDate(c.nextHearingDate || null);
                                handleTabSwitch('hearings');
                              }}
                              className="self-start sm:self-auto text-xs font-extrabold text-[#612912] bg-white px-3 py-1.5 rounded-xl border border-[#612912]/20 cursor-pointer whitespace-nowrap"
                            >
                              View on Calendar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Latest Order Sheet Preview + Full Detail Button */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#5A6275]">
                          <span>{c.timeline.length} Order Sheet Entries</span>
                          <span>•</span>
                          <span>{linkedNoticeCount} Linked Notices</span>
                          <span>•</span>
                          <span>{linkedDocCount} Vault Documents</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCaseDetail(c)}
                          className="min-h-[44px] bg-[#612912] hover:bg-[#452415] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                        >
                          <Eye className="w-4 h-4 text-[#E5B842] shrink-0" />
                          <span>Full Order Sheets &amp; Case File</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================
            TAB 3: FBR NOTICES
            ============================================================= */}
        {activeTab === 'notices' && (
          <div className="space-y-5">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                    FBR Statutory Notices &amp; Compliance Deadlines
                  </h2>
                  <p className="text-xs text-[#5A6275]">
                    All statutory show-cause notices, audit call-ups, and compliance dates logged by our chambers.
                  </p>
                </div>
                <span className="self-start sm:self-auto bg-[#612912]/10 text-[#612912] text-xs font-extrabold px-3 py-1 rounded-full tabular-nums">
                  {filteredNotices.length} Notices
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-[#612912]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                    placeholder="Search by CNO #, section code (e.g. 7E, 122), officer, or tax year..."
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-xs bg-[#FAF8F5] border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912]"
                  />
                </div>
                <select
                  value={noticeStatusFilter}
                  onChange={(e) => setNoticeStatusFilter(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-bold bg-[#FAF8F5] border border-slate-200 rounded-xl text-[#461C0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912]"
                >
                  <option value="All">All Notice Statuses</option>
                  {Array.from(new Set(clientNotices.map((n) => n.status))).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredNotices.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-[#452415]/15 text-center space-y-2">
                <FileText className="w-8 h-8 text-[#612912]/40 mx-auto" />
                <div className="font-heading font-bold text-sm text-[#1A1A1A]">No FBR Notices Matched</div>
                <p className="text-xs text-[#5A6275]">
                  No statutory notices match your current filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredNotices.map((n) => {
                  const linkedCase = clientCases.find((c) => c.id === n.caseId);
                  return (
                    <div
                      key={n.id}
                      className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-[#612912] bg-[#612912]/10 px-2.5 py-1 rounded-lg">
                              {n.cnoNumber}
                            </span>
                            <span className="text-[11px] font-bold bg-[#E5B842]/20 text-[#461C0C] px-2.5 py-0.5 rounded-lg">
                              Section {n.sectionCode}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getNoticeStatusStyle(
                              n.status
                            )}`}
                          >
                            {n.status}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-heading font-extrabold text-[#1A1A1A] leading-snug break-words">
                          {n.noticeTitle}
                        </h3>

                        <p className="text-xs text-[#461C0C]/85 leading-relaxed break-words">
                          {n.summary}
                        </p>

                        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-slate-200 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                              Tax Year
                            </span>
                            <span className="font-bold text-[#1A1A1A]">{n.taxYear}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                              Disputed Amount
                            </span>
                            <span className="font-bold text-[#612912] tabular-nums">
                              {formatPkr(n.disputedAmountPkr)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                              Date Received
                            </span>
                            <span className="font-semibold text-[#1A1A1A] tabular-nums">{n.dateReceived}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                              Compliance Due
                            </span>
                            <span className="font-extrabold text-red-700 tabular-nums">{n.dueDate}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#5A6275] break-words">
                          <strong className="text-[#461C0C]">Issuing Authority:</strong> {n.issuingOfficer}
                        </div>
                        {linkedCase && (
                          <div className="text-[11px] text-[#612912] font-bold break-words">
                            Linked Case: {linkedCase.caseRef} — {linkedCase.caseTitle}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        <a
                          href={buildWhatsAppUrl({
                            customMessage: `Assalamu Alaikum Rahim Law Associates, I have a query regarding FBR Notice ${n.cnoNumber} (u/s ${n.sectionCode}, Tax Year ${n.taxYear}).`
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-h-[42px] bg-[#612912] hover:bg-[#452415] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
                          <span>Discuss with Counsel</span>
                        </a>
                        {linkedCase && (
                          <button
                            type="button"
                            onClick={() => setSelectedCaseDetail(linkedCase)}
                            className="min-h-[42px] bg-[#FAF8F5] hover:bg-slate-100 text-[#612912] border border-[#612912]/20 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer"
                          >
                            Open Case
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================
            TAB 4: HEARING CALENDAR & CAUSE LIST
            ============================================================= */}
        {activeTab === 'hearings' && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                    Court Hearing Calendar &amp; Cause List
                  </h2>
                  <p className="text-xs text-[#5A6275]">
                    Tap any highlighted date on the calendar to filter hearings for that day.
                  </p>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-[#FAF8F5] border border-slate-200 hover:border-[#612912] flex items-center justify-center text-[#612912] cursor-pointer"
                    aria-label="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-[130px] text-center text-xs sm:text-sm font-heading font-extrabold text-[#1A1A1A]">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-[#FAF8F5] border border-slate-200 hover:border-[#612912] flex items-center justify-center text-[#612912] cursor-pointer"
                    aria-label="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid (Fits 375px with zero horizontal scroll) */}
              <div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[10px] sm:text-xs font-extrabold uppercase text-[#5A6275] py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarDays.map((cell, idx) => {
                    if (!cell.day || !cell.dateStr) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="h-12 sm:h-16 rounded-xl bg-slate-50/60"
                        />
                      );
                    }
                    const dayHearings = hearingsByDate[cell.dateStr] || [];
                    const isSelected = selectedCalendarDate === cell.dateStr;
                    const hasHearings = dayHearings.length > 0;

                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => handleSelectCalendarDate(cell.dateStr!)}
                        className={`h-12 sm:h-16 p-1 sm:p-2 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#612912] text-white border-[#612912] shadow-md'
                            : hasHearings
                            ? 'bg-[#E5B842]/20 border-[#E5B842] text-[#461C0C] hover:bg-[#E5B842]/35'
                            : 'bg-[#FAF8F5] border-slate-200/80 text-[#461C0C] hover:border-[#612912]/40'
                        }`}
                      >
                        <span className="text-xs font-extrabold tabular-nums">{cell.day}</span>
                        {hasHearings && (
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full tabular-nums ${
                              isSelected
                                ? 'bg-[#E5B842] text-[#1A1A1A]'
                                : 'bg-[#612912] text-white'
                            }`}
                          >
                            {dayHearings.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cause List Entries */}
            <div ref={calendarHearingsListRef} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-heading font-extrabold text-[#1A1A1A]">
                  {selectedCalendarDate
                    ? `Hearings Scheduled for ${selectedCalendarDate}`
                    : `All Scheduled & Recorded Hearings (${displayedHearings.length})`}
                </h3>
                {selectedCalendarDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDate(null)}
                    className="text-xs font-bold text-[#612912] bg-white px-3 py-1.5 rounded-xl border border-[#612912]/20 cursor-pointer"
                  >
                    Show All Dates
                  </button>
                )}
              </div>

              {displayedHearings.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-[#452415]/15 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-[#612912]/40 mx-auto" />
                  <div className="font-heading font-bold text-sm text-[#1A1A1A]">
                    No Hearings on This Date
                  </div>
                  <p className="text-xs text-[#5A6275]">
                    {selectedCalendarDate
                      ? 'Select another highlighted date or click "Show All Dates" to view your complete cause list.'
                      : 'No hearing dates have been scheduled on your case files yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedHearings.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-[#612912] text-[#E5B842] text-xs font-extrabold px-3 py-1 rounded-xl tabular-nums">
                            {h.date} • {h.time}
                          </span>
                          <span className="text-[11px] font-bold bg-[#FAF8F5] border border-slate-200 text-[#461C0C] px-2.5 py-0.5 rounded-lg">
                            {h.forum}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              h.priority === 'High'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {h.priority} Priority
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-heading font-extrabold text-[#1A1A1A] break-words">
                          {h.caseTitle}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#5A6275]">
                          <div className="break-words">
                            <strong className="text-[#461C0C]">Bench:</strong> {h.bench}
                          </div>
                          <div className="break-words">
                            <strong className="text-[#461C0C]">Lead Counsel:</strong> {h.counselAssigned}
                          </div>
                          <div className="sm:col-span-2 break-words">
                            <strong className="text-[#461C0C]">Purpose:</strong> {h.purpose}
                          </div>
                        </div>

                        {h.previousHearingOutcome && (
                          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-slate-200 text-xs text-[#461C0C]">
                            <span className="font-extrabold text-[#612912]">
                              Previous Order ({h.previousHearingDate || 'Prior Date'}):
                            </span>{' '}
                            {h.previousHearingOutcome}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a
                          href={buildGoogleCalendarUrl({
                            title: `Court Hearing: ${h.caseTitle}`,
                            startDate: h.date,
                            startTime: to24HourTime(h.time),
                            location: `${h.forum} — ${h.bench}`,
                            details: `Purpose: ${h.purpose} | Counsel: ${h.counselAssigned}`
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[42px] bg-[#E5B842] hover:bg-[#d9ab38] text-[#1A1A1A] text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CalendarCheck className="w-4 h-4 shrink-0" />
                          <span>Google Calendar</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================
            TAB 5: DOCUMENT VAULT
            ============================================================= */}
        {activeTab === 'documents' && (
          <div className="space-y-5">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                    Certified Case Document Vault
                  </h2>
                  <p className="text-xs text-[#5A6275]">
                    Access court stay orders, filed rebuttals, tax returns &amp; upload supporting evidence directly to your counsel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="min-h-[44px] bg-[#612912] hover:bg-[#452415] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4 text-[#E5B842] shrink-0" />
                  <span>Upload Bill / Evidence</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-[#612912]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search documents by title, category, or advocate..."
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-xs bg-[#FAF8F5] border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912]"
                  />
                </div>
                <select
                  value={docCategoryFilter}
                  onChange={(e) => setDocCategoryFilter(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-bold bg-[#FAF8F5] border border-slate-200 rounded-xl text-[#461C0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912]"
                >
                  <option value="All">All Categories</option>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-[#452415]/15 text-center space-y-2">
                <FolderOpen className="w-8 h-8 text-[#612912]/40 mx-auto" />
                <div className="font-heading font-bold text-sm text-[#1A1A1A]">
                  No Documents in Vault
                </div>
                <p className="text-xs text-[#5A6275]">
                  Use the Upload button above to submit bank statements, PRCs, or FBR letters to your legal team.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => {
                  const linkedCase = clientCases.find((c) => c.id === doc.caseId);
                  return (
                    <div
                      key={doc.id}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-[#452415]/15 shadow-sm flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold bg-[#612912]/10 text-[#612912] px-2.5 py-0.5 rounded-md">
                            {doc.category}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {doc.fileType}
                          </span>
                        </div>
                        <h3 className="text-sm font-heading font-bold text-[#1A1A1A] break-words">
                          {doc.title}
                        </h3>
                        {linkedCase && (
                          <div className="text-[11px] font-semibold text-[#612912] truncate">
                            Case: {linkedCase.caseRef}
                          </div>
                        )}
                        <div className="text-[11px] text-[#5A6275] break-words">
                          {doc.fileSize} • Uploaded {doc.uploadedAt} by {doc.uploadedBy}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(doc)}
                        className="min-h-[44px] min-w-[44px] bg-[#612912] hover:bg-[#452415] text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                        title="Download Document Record"
                        aria-label={`Download ${doc.title}`}
                      >
                        <Download className="w-4 h-4 text-[#E5B842]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================
            TAB 6: BILLING & INVOICES
            ============================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-5">
            {/* Financial Overview Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#452415]/15 shadow-sm">
                <span className="text-xs font-bold text-[#5A6275] block">Total Retainers Billed</span>
                <div className="text-xl font-heading font-extrabold text-[#1A1A1A] mt-1 tabular-nums">
                  {formatPkr(stats.totalBilledPkr)}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#452415]/15 shadow-sm">
                <span className="text-xs font-bold text-[#5A6275] block">Total Settled</span>
                <div className="text-xl font-heading font-extrabold text-emerald-700 mt-1 tabular-nums">
                  {formatPkr(stats.totalPaidPkr)}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#452415]/15 shadow-sm">
                <span className="text-xs font-bold text-[#5A6275] block">Outstanding Balance</span>
                <div className="text-xl font-heading font-extrabold text-[#612912] mt-1 tabular-nums">
                  {formatPkr(stats.outstandingPkr)}
                </div>
              </div>
            </div>

            {clientInvoices.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-[#452415]/15 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-[#612912]/40 mx-auto" />
                <div className="font-heading font-bold text-sm text-[#1A1A1A]">No Fee Invoices Issued</div>
                <p className="text-xs text-[#5A6275]">
                  Official retainer invoices generated by Rahim Law Associates will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientInvoices.map((inv) => {
                  const netInvoiceTotal = inv.retainerFeePkr + inv.hearingFeePkr;
                  const netPaidAmount = Math.min(inv.paidAmountPkr, netInvoiceTotal);
                  const balanceRemaining = Math.max(0, netInvoiceTotal - netPaidAmount);
                  return (
                    <div
                      key={inv.id}
                      className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-[#612912]">
                              {inv.invoiceNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getInvoiceStatusStyle(
                                inv.status
                              )}`}
                            >
                              {inv.status}
                            </span>
                            {inv.paymentMethod && (
                              <span className="text-[10px] font-bold bg-slate-100 text-[#475569] px-2 py-0.5 rounded-md">
                                {inv.paymentMethod}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-heading font-extrabold text-[#1A1A1A] break-words">
                            {inv.serviceDescription}
                          </h3>
                          <div className="text-xs text-[#5A6275]">
                            Issued: <strong className="tabular-nums">{inv.issueDate}</strong> • Due:{' '}
                            <strong className="text-[#461C0C] tabular-nums">{inv.dueDate}</strong>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                            Total Invoice Amount
                          </span>
                          <div className="text-lg font-heading font-extrabold text-[#612912] tabular-nums">
                            {formatPkr(netInvoiceTotal)}
                          </div>
                          {balanceRemaining > 0 && (
                            <span className="text-[11px] font-bold text-red-700 tabular-nums">
                              Balance Due: {formatPkr(balanceRemaining)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Itemized Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                            Retainer Fee
                          </span>
                          <span className="font-bold text-[#1A1A1A] tabular-nums">
                            {formatPkr(inv.retainerFeePkr)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                            Hearing Fee
                          </span>
                          <span className="font-bold text-[#1A1A1A] tabular-nums">
                            {formatPkr(inv.hearingFeePkr)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#5A6275] block">
                            Amount Paid
                          </span>
                          <span className="font-bold text-emerald-700 tabular-nums">
                            {formatPkr(netPaidAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForPdf(inv)}
                          className="min-h-[42px] bg-[#612912] hover:bg-[#452415] text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4 text-[#E5B842] shrink-0" />
                          <span>View / Download PDF</span>
                        </button>

                        {inv.status !== 'Paid' && (
                          <button
                            type="button"
                            onClick={() => {
                              markInvoicePaid(inv.id, 'Online PKR');
                              showToast(
                                `Payment recorded for ${inv.invoiceNumber}. Official receipt is ready in Printable PDF.`
                              );
                            }}
                            className="min-h-[42px] bg-[#E5B842] hover:bg-[#d9ab38] text-[#1A1A1A] text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-colors"
                          >
                            Pay Online Now ({formatPkr(balanceRemaining || netInvoiceTotal)})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================
            TAB 7: ALERTS & PROFILE
            ============================================================= */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chamber Alerts & Messages */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-heading font-extrabold text-[#1A1A1A] flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#612912] shrink-0" />
                    <span>Chamber Alerts &amp; Notifications</span>
                  </h2>
                  <p className="text-xs text-[#5A6275]">
                    WhatsApp, Email &amp; system alerts dispatched by Rahim Law Associates.
                  </p>
                </div>
                <span className="bg-[#612912]/10 text-[#612912] text-xs font-extrabold px-2.5 py-0.5 rounded-full tabular-nums">
                  {clientNotifications.length}
                </span>
              </div>

              {clientNotifications.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-slate-200 text-center text-xs text-[#5A6275]">
                  No alert dispatches have been logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {clientNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#612912] text-white">
                          {notif.type}
                        </span>
                        <span className="text-[11px] font-semibold text-[#5A6275] tabular-nums">
                          {notif.sentAt} • {notif.status}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-heading font-bold text-[#1A1A1A]">
                        {notif.title}
                      </h3>
                      <p className="text-xs text-[#461C0C]/90 leading-relaxed break-words">
                        {notif.message}
                      </p>
                      <div className="text-[10px] font-mono text-[#5A6275]">
                        Sent to: {notif.recipientPhoneOrEmail}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client Profile Details */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-heading font-extrabold text-[#1A1A1A] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#612912] shrink-0" />
                    <span>Registered Client Profile</span>
                  </h2>
                  <p className="text-xs text-[#5A6275]">
                    Official details recorded in Rahim Law Associates Chambers Management System.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Client / Entity Name</span>
                  <span className="font-bold text-[#1A1A1A] break-words">{currentClient.name}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Business / Trade Title</span>
                  <span className="font-bold text-[#1A1A1A] break-words">
                    {currentClient.businessName || currentClient.name}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">FBR NTN</span>
                  <span className="font-mono font-bold text-[#612912]">{currentClient.ntn}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">CNIC / Reg No</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">{currentClient.cnic}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Primary Email</span>
                  <span className="font-mono font-bold text-[#1A1A1A] break-all">{currentClient.email}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Contact Number</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">{currentClient.phone}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Taxpayer Category</span>
                  <span className="font-bold text-[#1A1A1A]">{currentClient.category}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Jurisdiction / City</span>
                  <span className="font-bold text-[#1A1A1A]">{currentClient.city}</span>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Registered Address</span>
                  <span className="font-bold text-[#1A1A1A] break-words">
                    {currentClient.registeredAddress}
                  </span>
                </div>
              </div>

              {/* Direct Chamber Contact */}
              <div className="p-4 rounded-2xl bg-[#612912]/5 border border-[#612912]/20 space-y-2 text-xs">
                <div className="font-heading font-extrabold text-[#612912]">
                  Rahim Law Associates — Chambers Desk
                </div>
                <p className="text-[#461C0C]/85 leading-relaxed">
                  Office No 13-14, 1st Floor, Shahnawaz Plaza G-11 Markaz Islamabad
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="tel:+923455061906"
                    className="min-h-[40px] bg-white border border-[#612912]/20 text-[#612912] font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>+92 345 5061906</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl({ topic: 'general' })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] bg-[#25D366] text-white font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>WhatsApp Support</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MOBILE APP STICKY BOTTOM THUMB NAV BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#612912] border-t border-[#452415] px-1.5 py-1 flex items-center justify-around text-[10px] font-bold text-amber-100 shadow-2xl">
        <button
          type="button"
          onClick={() => handleTabSwitch('overview')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            activeTab === 'overview' ? 'text-[#E5B842] font-extrabold scale-105' : 'hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('cases')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center relative ${
            activeTab === 'cases' ? 'text-[#E5B842] font-extrabold scale-105' : 'hover:text-white'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>Cases</span>
          {clientCases.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#E5B842]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('hearings')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center relative ${
            activeTab === 'hearings' ? 'text-[#E5B842] font-extrabold scale-105' : 'hover:text-white'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>Hearings</span>
          {stats.upcomingHearings.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#E5B842]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('billing')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            activeTab === 'billing' ? 'text-[#E5B842] font-extrabold scale-105' : 'hover:text-white'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Billing</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl text-amber-100 hover:text-white transition-all cursor-pointer min-h-[44px] justify-center"
        >
          <Menu className="w-5 h-5 text-[#E5B842]" />
          <span>More</span>
        </button>
      </nav>

      {/* =================================================================
          MODAL: CASE DETAILS & ORDER SHEETS (SINGLE SCROLLBAR)
          ================================================================= */}
      {selectedCaseDetail && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedCaseDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#612912]/20 shadow-2xl"
          >
            {/* Header */}
            <div className="bg-[#612912] text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-[#E5B842]">
                    {selectedCaseDetail.caseRef}
                  </span>
                  <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded font-bold">
                    {selectedCaseDetail.forum}
                  </span>
                  <span className="text-[10px] bg-[#E5B842] text-[#1A1A1A] px-2 py-0.5 rounded font-extrabold">
                    {selectedCaseDetail.status}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-heading font-extrabold text-white break-words">
                  {selectedCaseDetail.caseTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseDetail(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Close Case Details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body (Only this container scrolls) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Tax Year</span>
                  <span className="font-bold text-[#1A1A1A]">{selectedCaseDetail.taxYear}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Disputed Demand</span>
                  <span className="font-extrabold text-[#612912] tabular-nums">
                    {formatPkr(selectedCaseDetail.demandAmountPkr)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-[#5A6275] block">Tax Saved / Stayed</span>
                  <span className="font-extrabold text-emerald-700 tabular-nums">
                    {formatPkr(selectedCaseDetail.savedAmountPkr)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200 space-y-1.5">
                <div className="font-heading font-extrabold text-[#612912]">Case Briefing</div>
                <p className="text-[#461C0C]/90 leading-relaxed break-words">
                  {selectedCaseDetail.summary}
                </p>
                <div className="pt-1 text-[#5A6275]">
                  Lead Counsel: <strong className="text-[#1A1A1A]">{selectedCaseDetail.assignedCounsel}</strong> ({selectedCaseDetail.assignedCounselTitle})
                </div>
              </div>

              {selectedCaseDetail.nextHearingDate && (
                <div className="p-4 rounded-2xl bg-[#E5B842]/15 border border-[#E5B842]/50 space-y-1">
                  <div className="font-extrabold text-[#612912]">
                    Next Hearing: {selectedCaseDetail.nextHearingDate}
                  </div>
                  <div className="text-[#461C0C]">
                    {selectedCaseDetail.nextHearingPurpose || 'Court Proceedings'}
                  </div>
                </div>
              )}

              {/* Chronological Order Sheets */}
              <div className="space-y-3">
                <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                  Chronological Case History &amp; Order Sheets
                </h4>
                <div className="space-y-3 pl-3.5 border-l-2 border-[#612912]/25">
                  {selectedCaseDetail.timeline.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-[#1A1A1A]">{item.title}</span>
                        <span className="font-mono font-bold text-[#612912] tabular-nums">{item.date}</span>
                      </div>
                      <div className="text-[11px] font-bold text-[#5A6275]">
                        {item.forum} • Counsel: {item.advocateName}
                      </div>
                      <p className="text-[#461C0C]/90 leading-relaxed break-words">{item.description}</p>
                      {item.outcome && (
                        <div className="p-2.5 rounded-xl bg-[#612912]/10 text-[#612912] font-bold">
                          Official Order: {item.outcome}
                        </div>
                      )}
                      {item.nextAction && (
                        <div className="text-[11px] font-semibold text-amber-800">
                          Next Action: {item.nextAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#FAF8F5] border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <a
                href={buildWhatsAppUrl({
                  customMessage: `Assalamu Alaikum, I am inquiring regarding Case ${selectedCaseDetail.caseRef} (${selectedCaseDetail.caseTitle}).`
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] bg-[#25D366] hover:bg-[#1fb858] text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Message Counsel</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedCaseDetail(null)}
                className="min-h-[42px] bg-[#612912] hover:bg-[#452415] text-white text-xs font-extrabold px-5 py-2 rounded-xl cursor-pointer"
              >
                Close Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL: UPLOAD CLIENT DOCUMENT
          ================================================================= */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 border border-[#612912]/20 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#1A1A1A]">
                Upload Document to Chambers Vault
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-black flex items-center justify-center cursor-pointer"
                aria-label="Close Upload Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadClientDoc} className="space-y-3.5 text-xs">
              {clientCases.length > 0 && (
                <div>
                  <label className="font-bold text-[#461C0C] block mb-1">Linked Case File</label>
                  <select
                    value={uploadCaseId}
                    onChange={(e) => setUploadCaseId(e.target.value)}
                    className="w-full min-h-[44px] bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#612912] font-semibold text-[#1A1A1A]"
                  >
                    {clientCases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.caseRef} — {c.caseTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-[#461C0C] block mb-1">Document Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentItem['category'])}
                  className="w-full min-h-[44px] bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#612912] font-semibold text-[#1A1A1A]"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#461C0C] block mb-1">Document Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Bank Statement FY 2025 / SBP PRC"
                  value={uploadDocTitle}
                  onChange={(e) => setUploadDocTitle(e.target.value)}
                  className="w-full min-h-[44px] bg-[#FAF8F5] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912]"
                />
              </div>

              <label className="block border-2 border-dashed border-[#612912]/30 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 p-5 rounded-2xl text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Upload className="w-7 h-7 text-[#612912] mx-auto mb-2" />
                <div className="font-bold text-[#1A1A1A]">
                  {uploadFileMeta.fileName || 'Tap to attach scanned PDF or image'}
                </div>
                <div className="text-[10px] text-[#5A6275] mt-1">
                  {uploadFileMeta.fileName
                    ? `${uploadFileMeta.fileType.toUpperCase()} • ${uploadFileMeta.fileSize}`
                    : 'Supports PDF, DOC/DOCX, PNG, JPG'}
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 text-[#475569] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#612912] hover:bg-[#452415] text-white font-extrabold shadow-sm cursor-pointer"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Legal PDF Invoice Modal */}
      {selectedInvoiceForPdf && (
        <InvoicePdfModal
          invoice={selectedInvoiceForPdf}
          client={currentClient}
          caseFile={
            clientCases.find((c) => c.id === selectedInvoiceForPdf.caseId) || clientCases[0] || null
          }
          onClose={() => setSelectedInvoiceForPdf(null)}
          onMarkPaid={(invId, method) => {
            markInvoicePaid(invId, method || 'Online PKR');
            showToast(`Payment recorded for ${selectedInvoiceForPdf.invoiceNumber}.`);
          }}
        />
      )}
    </div>
  );
};
