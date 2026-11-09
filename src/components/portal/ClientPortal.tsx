'use client';

import React, { useState } from 'react';

import {
  Building2,
  ShieldCheck,
  FileText,
  Calendar,
  FolderOpen,
  CreditCard,
  MessageCircle,
  PhoneCall,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Search,
  Lock,
  ArrowRight,
  ExternalLink,
  Info,
  LogOut,
  Mail,
  KeyRound,
  Construction,
  Clock,
  Sparkles,
  Scale,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { usePortalStore } from '../../lib/portalStore';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Client, CaseFile, Invoice } from '../../types/portal';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { InvoicePdfModal } from './InvoicePdfModal';
import { checkRateLimit, recordAttempt, resetRateLimit } from '../../lib/rateLimiter';
import { useInactivityTimeout } from '../../lib/useInactivityTimeout';

interface ClientPortalProps {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
}

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
    clientCredentials,
    addDocument,
    markInvoicePaid
  } = usePortalStore();

  const [inputNtnOrCnic, setInputNtnOrCnic] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);
  const [newClientDocTitle, setNewClientDocTitle] = useState('');
  const [showLayoutPreview, setShowLayoutPreview] = useState(false);

  // Client authentication state
  const [authenticatedClientId, setAuthenticatedClientId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rla_client_session_id') || null;
    }
    return null;
  });
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  const handleClientGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleAuthLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email?.toLowerCase();
      if (!email) throw new Error('No email found in Google account');

      const matchedClient = clients.find(
        (c) => c.email.toLowerCase() === email
      );
      if (matchedClient) {
        setAuthenticatedClientId(matchedClient.id);
        setSelectedClientId(matchedClient.id);
        setShowLayoutPreview(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rla_client_session_id', matchedClient.id);
        }
      } else {
        // Admin or registered partner access preview
        const targetId = clients[0]?.id || 'cli-101';
        setAuthenticatedClientId(targetId);
        setSelectedClientId(targetId);
        setShowLayoutPreview(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rla_client_session_id', targetId);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In failed');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Rate limit check
    const rateCheck = checkRateLimit('client_login');
    if (!rateCheck.allowed) {
      setAuthError(rateCheck.message || 'Too many attempts. Please try again later.');
      return;
    }
    recordAttempt('client_login');

    const cleanEmail = clientEmail.trim().toLowerCase();

    // 1. Check in clientCredentials
    const matchedCred = clientCredentials.find(
      (c) => c.email.toLowerCase() === cleanEmail && c.password === clientPassword
    );

    if (matchedCred) {
      resetRateLimit('client_login');
      setAuthenticatedClientId(matchedCred.clientId);
      setSelectedClientId(matchedCred.clientId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('rla_client_session_id', matchedCred.clientId);
      }
      return;
    }

    // 2. Check in clients list by email
    const matchedClient = clients.find(
      (c) => c.email.toLowerCase() === cleanEmail || c.ntn.replaceAll('-', '').includes(cleanEmail.replaceAll('-', ''))
    );

    if (matchedClient) {
      resetRateLimit('client_login');
      setAuthenticatedClientId(matchedClient.id);
      setSelectedClientId(matchedClient.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('rla_client_session_id', matchedClient.id);
      }
      return;
    }

    setAuthError('Invalid credentials. Please enter your email and password created in the Admin Portal.');
  };

  const handleClientSignOut = () => {
    setAuthenticatedClientId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rla_client_session_id');
    }
  };

  // Auto-logout after 2 minutes (120,000 ms) of inactivity
  useInactivityTimeout(
    !!authenticatedClientId,
    () => {
      handleClientSignOut();
      setAuthError('You have been automatically logged out due to 2 minutes of inactivity.');
    },
    120000
  );

  // Get active selected client or fallback
  const currentClient =
    clients.find((c) => c.id === (authenticatedClientId || selectedClientId)) || clients[0] || null;

  // Filter client specific data
  const clientCases = cases.filter((c) => c.clientId === currentClient?.id);
  const clientNotices = notices.filter((n) => n.clientId === currentClient?.id);
  const clientDocs = documents.filter((d) => d.clientId === currentClient?.id);
  const clientInvoices = invoices.filter((i) => i.clientId === currentClient?.id);

  const handleUploadClientDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient || clientCases.length === 0) return;
    const activeCase = clientCases[0];

    addDocument({
      caseId: activeCase.id,
      clientId: currentClient.id,
      title: newClientDocTitle || 'Client Provided Bank Statement',
      category: 'Bank Statement',
      fileSize: '2.1 MB',
      uploadedBy: currentClient.name,
      fileType: 'pdf',
      downloadUrl: '#',
      isClientVisible: true
    });

    setShowUploadModal(false);
    setNewClientDocTitle('');
    alert('Document uploaded successfully to your legal case vault!');
  };

  // DEDICATED APPEALING CLIENT "UNDER CONSTRUCTION" VIEW (NO LOGIN BOX, CLEAN & MINIMAL)
  if (!showLayoutPreview) {
    return (
      <div className="min-h-[80vh] bg-[#FAF8F5] text-[#461C0C] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative selection:bg-[#E5B842] selection:text-[#2A160E] font-sans">
        <div className="max-w-2xl w-full mx-auto text-center space-y-8 my-auto py-8">
          {/* Logo with High Visibility */}
          <div className="inline-flex items-center justify-center bg-white px-8 sm:px-10 py-4 sm:py-5 rounded-3xl shadow-md border border-[#612912]/15 mx-auto">
            <img
              src="https://i.ibb.co/xS4KS0LC/Untitled-design-2.png"
              alt="Rahim Law Associates Logo"
              className="h-20 sm:h-24 w-auto object-contain object-center drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Under Construction Notice & Big Headline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#E5B842]/20 text-[#612912] border border-[#E5B842]/50 px-4 py-1.5 rounded-full text-xs font-heading font-extrabold uppercase tracking-widest shadow-xs">
              <Construction className="w-4 h-4 text-[#612912]" />
              <span>Client Portal</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-[#612912] uppercase leading-none">
              Under <span className="text-[#E5B842]">Construction</span>
            </h1>

            <p className="max-w-lg mx-auto text-base sm:text-lg text-[#2A160E]/80 font-medium leading-relaxed font-sans">
              Our online client workspace is currently undergoing scheduled upgrades. For real-time case updates or urgent court proceedings, please contact your advocate directly.
            </p>
          </div>

          {/* Action Hub for Clients */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={buildWhatsAppUrl({
                customMessage: 'Assalamu Alaikum Rahim Law Associates, I am a client requesting an urgent status briefing on my ongoing case/court matter.'
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#612912] hover:bg-[#452415] text-white font-sans font-bold text-sm sm:text-base px-7 py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-[#E5B842]/30"
            >
              <MessageCircle className="w-5 h-5 text-[#E5B842]" />
              <span>Chat on WhatsApp</span>
            </a>

            <a
              href="tel:+923455061906"
              className="w-full sm:w-auto bg-white hover:bg-[#FAF8F5] border-2 border-[#612912]/20 text-[#612912] font-sans font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-[#612912]" />
              <span>Call: +92 345 5061906</span>
            </a>
          </div>

          {/* Client Google Sign-In */}
          <div className="pt-2 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
            <button
              type="button"
              onClick={handleClientGoogleSignIn}
              disabled={googleAuthLoading}
              className="w-full bg-white hover:bg-gray-50 text-[#461C0C] font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-sm border border-[#612912]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
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
              <span>{googleAuthLoading ? 'Signing in...' : 'Sign In with Google Account'}</span>
            </button>
            {authError && (
              <p className="text-xs text-red-600 mt-2 font-medium">{authError}</p>
            )}
          </div>

          {/* Discreet Internal Layout Preview */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                const demoId = clients[0]?.id || 'cli-101';
                setSelectedClientId(demoId);
                setAuthenticatedClientId(demoId);
                setShowLayoutPreview(true);
              }}
              className="text-xs text-[#2A160E]/60 hover:text-[#612912] transition-colors underline underline-offset-4 cursor-pointer font-sans"
            >
              Internal: Preview Client Dashboard Layout &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#461C0C] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Return to Under Construction Screen Banner */}
      <div className="bg-[#E5B842]/15 border-2 border-dashed border-[#E5B842]/60 p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[#461C0C] shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#E5B842] text-[#461C0C] shrink-0 shadow-sm">
            <Construction className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-sm sm:text-base text-[#461C0C]">
                Client Portal Layout &amp; Code Architecture (Active Preview)
              </h2>
              <span className="text-[10px] bg-[#612912] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Exclusively For Clients
              </span>
            </div>
            <p className="text-xs text-[#2A160E]/80 mt-1 max-w-3xl leading-relaxed">
              All client management modules, documents, hearing lists, and invoices are 100% preserved in the codebase.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowLayoutPreview(false)}
          className="bg-[#612912] hover:bg-[#452415] text-white text-xs font-sans font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-end md:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Under Construction View</span>
        </button>
      </div>

      {/* Top Client Bar & Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-[#612912]/15 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#612912] text-[#E5B842] flex items-center justify-center font-bold text-xl shadow-md shrink-0 font-heading">
            {currentClient?.name.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#612912]/10 text-[#612912] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {currentClient?.category || 'Corporate Client'}
              </span>
              <span className="text-xs font-mono font-bold text-[#475569]">NTN: {currentClient?.ntn}</span>
            </div>
            <h1 className="text-xl font-heading font-bold text-[#461C0C] mt-1">
              {currentClient?.name}
            </h1>
            <p className="text-xs text-[#475569]">
              {currentClient?.registeredAddress} • {currentClient?.city} • Email: <span className="font-mono">{currentClient?.email}</span>
            </p>
          </div>
        </div>

        {/* Client Account Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClientSignOut}
            className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-4 py-2 rounded-2xl border border-red-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#612912]/15 shadow-sm">
          <div className="flex items-center justify-between text-[#612912] mb-2">
            <span className="text-xs font-bold text-[#475569]">Active Legal Proceedings</span>
            <ShieldCheck className="w-5 h-5 text-[#612912]" />
          </div>
          <div className="text-2xl font-heading font-bold text-[#461C0C]">
            {clientCases.length} Active Files
          </div>
          <div className="text-[11px] text-[#612912] font-semibold mt-1">High Court & Tribunal Representation</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#612912]/15 shadow-sm">
          <div className="flex items-center justify-between text-[#612912] mb-2">
            <span className="text-xs font-bold text-[#475569]">Pending Legal / Notice Matters</span>
            <AlertCircle className="w-5 h-5 text-[#E5B842]" />
          </div>
          <div className="text-2xl font-heading font-bold text-[#461C0C]">
            {clientNotices.length} Notices
          </div>
          <div className="text-[11px] text-[#612912] font-semibold mt-1">Legal Counsel Drafting Replies</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#612912]/15 shadow-sm">
          <div className="flex items-center justify-between text-[#612912] mb-2">
            <span className="text-xs font-bold text-[#475569]">Total Tax / Claims Protected</span>
            <CheckCircle2 className="w-5 h-5 text-[#612912]" />
          </div>
          <div className="text-2xl font-heading font-bold text-[#612912]">
            {currentClient?.totalTaxSaved || 'Rs. 0'}
          </div>
          <div className="text-[11px] text-[#612912] font-semibold mt-1">Via High Court Stay Orders</div>
        </div>
      </div>

      {/* Main Section: Active Case & Live Stage Tracker */}
      <div className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-[#461C0C]">
          Your Active Cases & Court Stage Progress
        </h2>

        {clientCases.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl p-6 border border-[#612912]/15 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#612912] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                    {c.forum}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#612912]">Ref: {c.caseRef}</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-[#461C0C]">{c.caseTitle}</h3>
                <div className="text-xs text-[#475569]">
                  Lead Counsel: <span className="font-bold text-[#612912]">{c.assignedCounsel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#612912] bg-[#612912]/10 px-3 py-1.5 rounded-full">
                  Status: {c.status}
                </span>
                <a
                  href={buildWhatsAppUrl({ topic: 'general' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-[#20ba59] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat Counsel</span>
                </a>
              </div>
            </div>

            {/* Hearing Timeline History */}
            <div>
              <h4 className="font-heading font-bold text-sm text-[#461C0C] mb-3">Case History & Order Sheets</h4>
              <div className="space-y-3 pl-4 border-l-2 border-[#612912]/20">
                {c.timeline.map((t) => (
                  <div key={t.id} className="bg-[#FAF8F5] p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[#461C0C]">
                      <span>{t.title}</span>
                      <span className="text-[#612912]">{t.date}</span>
                    </div>
                    <p className="text-[#475569]">{t.description}</p>
                    {t.outcome && (
                      <div className="text-[11px] font-bold text-[#612912] bg-[#612912]/10 p-2 rounded-xl mt-2">
                        Official Order: {t.outcome}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Document Vault & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Vault */}
        <div className="bg-white p-6 rounded-3xl border border-[#612912]/15 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#612912]" />
              <h3 className="font-heading font-bold text-base text-[#461C0C]">Case Document Vault</h3>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-[#612912] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#452415] flex items-center gap-1 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>Upload Bill/Doc</span>
            </button>
          </div>

          <div className="space-y-3">
            {clientDocs.map((doc) => (
              <div key={doc.id} className="bg-[#FAF8F5] p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold bg-[#612912]/10 text-[#612912] px-2 py-0.5 rounded-md">
                    {doc.category}
                  </span>
                  <div className="font-bold text-[#461C0C] mt-1">{doc.title}</div>
                  <div className="text-[10px] text-[#475569]">{doc.fileSize} • Uploaded {doc.uploadedAt}</div>
                </div>
                <button
                  onClick={() => alert(`Simulated Download: Downloading "${doc.title}" certified copy.`)}
                  className="bg-[#612912] text-white p-2 rounded-xl hover:bg-[#452415]"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-[#E5B842]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Invoices & Retainers */}
        <div className="bg-white p-6 rounded-3xl border border-[#612912]/15 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#612912]" />
              <h3 className="font-heading font-bold text-base text-[#461C0C]">Retainer Fee Invoices</h3>
            </div>
          </div>

          <div className="space-y-3">
            {clientInvoices.map((inv) => (
              <div key={inv.id} className="bg-[#FAF8F5] p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-mono font-bold text-[#612912]">{inv.invoiceNumber}</div>
                  <div className="font-bold text-[#461C0C] mt-0.5">{inv.serviceDescription}</div>
                  <div className="text-[10px] text-[#475569]">Issued: {inv.issueDate}</div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        inv.status === 'Paid' ? 'bg-[#612912]/15 text-[#612912]' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <div className="font-bold text-[#612912] text-sm">
                      Rs. {inv.totalAmountPkr.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceForPdf(inv)}
                      className="bg-[#612912] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl hover:bg-[#452415] flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#E5B842]" />
                      <span>Printable PDF</span>
                    </button>

                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => {
                          markInvoicePaid(inv.id, 'Online PKR');
                          alert('Simulated Payment Successful! Bank payment receipt generated.');
                        }}
                        className="text-[11px] font-bold bg-[#E5B842] text-[#2A160E] px-3 py-1.5 rounded-xl shadow-sm hover:bg-[#d9ab38]"
                      >
                        Pay Online Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: UPLOAD CLIENT DOCUMENT */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#612912]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-bold text-[#461C0C]">Upload Document to Advocates</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleUploadClientDoc} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#461C0C] block mb-1">Document Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank Statement 2024 / Electricity Bill"
                  value={newClientDocTitle}
                  onChange={(e) => setNewClientDocTitle(e.target.value)}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#612912]"
                />
              </div>

              <div className="border-2 border-dashed border-[#612912]/30 bg-[#FAF8F5] p-6 rounded-2xl text-center">
                <Upload className="w-8 h-8 text-[#612912] mx-auto mb-2" />
                <div className="font-bold text-[#461C0C]">Drop your file here</div>
                <div className="text-[10px] text-[#475569] mt-1">Scanned PDF or images</div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-[#475569] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#612912] hover:bg-[#452415] text-white font-bold shadow-sm"
                >
                  Upload File
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
          caseFile={clientCases.find((c) => c.id === selectedInvoiceForPdf.caseId) || clientCases[0]}
          onClose={() => setSelectedInvoiceForPdf(null)}
          onMarkPaid={markInvoicePaid}
        />
      )}
    </div>
  );
};
