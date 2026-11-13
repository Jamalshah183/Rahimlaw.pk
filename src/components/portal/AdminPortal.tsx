'use client';

import React, { useState, useEffect, useRef } from 'react';

import { auth, googleProvider } from '../../lib/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { checkRateLimit, recordAttempt, resetRateLimit } from '../../lib/rateLimiter';
import { useInactivityTimeout } from '../../lib/useInactivityTimeout';
import {
  Mail,
  KeyRound,
  EyeOff,
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Calendar as CalendarIcon,
  FolderOpen,
  CheckSquare,
  CreditCard,
  Send,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  UserCheck,
  ChevronRight,
  Download,
  Eye,
  FileCode,
  FilePlus,
  CheckCircle2,
  XCircle,
  MessageSquare,
  PhoneCall,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Info,
  CalendarCheck,
  ExternalLink,
  PlusCircle,
  X,
  Share2,
  Upload,
  Printer,
  Edit3,
  Copy,
  MessageCircle,
  Lock,
  LogOut,
  Scale,
  Trash2,
  Home as HomeIcon,
  Landmark,
  RefreshCw,
  Check,
  Layers,
  Gavel,
  Scroll,
  Shield,
  Building2,
  Award,
  Star,
  Quote,
  MessageSquareQuote,
  BookOpen,
  Newspaper,
  Pin,
  Menu
} from 'lucide-react';
import { usePortalStore } from '../../lib/portalStore';
import { InvoicePdfModal } from './InvoicePdfModal';
import { SearchableCaseSelect } from './SearchableCaseSelect';
import {
  CaseFile,
  Client,
  FBRNotice,
  DocumentItem,
  InternalTask,
  InternalNote,
  Invoice,
  HearingEvent,
  LegalForum,
  CaseStatus,
  RiskLevel,
  PracticeArea,
  TeamMember,
  ReviewItem,
  LegalInsightItem
} from '../../types/portal';
import { FIRM_CONFIG } from '../../data/firmData';
import rahimMemberImg from '../../assets/images/rahim_nawaz_khan_abbasi.png';
import hasanImg from '../../assets/images/hasan_rashid_qamar.png';
import mehakImg from '../../assets/images/mehak_ali.png';
import khadijaImg from '../../assets/images/khadija_sharafat_khan.png';
import gavelImg from '../../assets/images/blog_gavel_copper_1793276830980.jpg';
import crossBorderImg from '../../assets/images/blog_property_copper_1793276831812.jpg';
import successionImg from '../../assets/images/blog_estate_copper_1793276833099.jpg';
import dossierImg from '../../assets/images/blog_corporate_copper_1793276832574.jpg';
import { buildGoogleCalendarUrl } from '../../lib/googleCalendar';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

const ADVOCATES = [
  'Mr. Rahim Nawaz Khan Abbasi',
  'Mirza Ahmed Raza',
  'Chaudhry Shahbaz Hussain'
];

const ALLOWED_ADMIN_EMAILS = [
  'virtualassistant183@gmail.com',
  'contact@rahimlawassociates.com',
  'info@rahimlawassociates.com',
  'rahim.nawaz@i-con.pk',
  'kamranroshanshaikh@gmail.com',
];

const AUTHORIZED_ADMIN_CREDENTIALS: Record<string, string> = {
  'rahim.nawaz@i-con.pk': 'admin123',
  'contact@rahimlawassociates.com': 'admin123',
  'virtualassistant183@gmail.com': 'admin123',
  'kamranroshanshaikh@gmail.com': 'asd123',
};

const AUTHORIZED_ADMIN_DISPLAY_NAMES: Record<string, string> = {
  'rahim.nawaz@i-con.pk': 'Rahim Nawaz (Admin Partner)',
  'contact@rahimlawassociates.com': 'Rahim Law Associates (Admin)',
  'virtualassistant183@gmail.com': 'Virtual Assistant (Admin)',
  'kamranroshanshaikh@gmail.com': 'Kamran Roshan Shaikh (Admin)',
};

const getInitialAdminPortalSession = (): FirebaseUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('rla_admin_auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.email && ALLOWED_ADMIN_EMAILS.includes(parsed.email.toLowerCase())) {
        return {
          email: parsed.email.toLowerCase(),
          displayName: parsed.displayName || 'Authorized Admin',
          uid: 'admin-partner-' + parsed.email.replace(/[^a-zA-Z0-9]/g, '_'),
        } as unknown as FirebaseUser;
      }
    }
  } catch (e) {
    console.warn('Session check note:', e);
  }
  return null;
};

export const AdminPortal: React.FC = () => {
  // Admin authentication state
  const [adminUser, setAdminUser] = useState<FirebaseUser | null>(getInitialAdminPortalSession);
  const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminAuthSuccessMessage, setAdminAuthSuccessMessage] = useState<string | null>(null);

  // Email & Password states
  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminShowPassword, setAdminShowPassword] = useState<boolean>(false);
  const [adminIsRegisterMode, setAdminIsRegisterMode] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const email = user?.email?.toLowerCase();
      if (user && email && ALLOWED_ADMIN_EMAILS.includes(email)) {
        setAdminUser(user);
        try {
          localStorage.setItem(
            'rla_admin_auth_user',
            JSON.stringify({
              email: email,
              displayName: user.displayName || AUTHORIZED_ADMIN_DISPLAY_NAMES[email] || email.split('@')[0],
              loggedInAt: Date.now(),
            })
          );
        } catch (e) {}
      } else {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('rla_admin_auth_user') : null;
        if (!saved) {
          setAdminUser(null);
        }
      }
      setAdminAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdminGoogleSignIn = async () => {
    setAdminAuthError(null);
    setAdminAuthSuccessMessage(null);

    // Rate limit check
    const rateCheck = checkRateLimit('admin_login');
    if (!rateCheck.allowed) {
      setAdminAuthError(rateCheck.message || 'Rate limit exceeded. Please try again later.');
      return;
    }
    recordAttempt('admin_login');

    setAdminAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email?.toLowerCase();
      if (email && ALLOWED_ADMIN_EMAILS.includes(email)) {
        resetRateLimit('admin_login');
        try {
          localStorage.setItem(
            'rla_admin_auth_user',
            JSON.stringify({
              email: email,
              displayName: result.user.displayName || AUTHORIZED_ADMIN_DISPLAY_NAMES[email] || email.split('@')[0],
              loggedInAt: Date.now(),
            })
          );
        } catch (e) {}
        setAdminUser(result.user);
      } else {
        await signOut(auth);
        try {
          localStorage.removeItem('rla_admin_auth_user');
        } catch (e) {}
        setAdminUser(null);
        setAdminAuthError(
          `Access Denied: You do not have partner admin privileges with this account (${result.user.email || 'unknown'}).`
        );
      }
    } catch (err: any) {
      setAdminAuthError(err.message || 'Google Sign-In failed. Please try again.');
      setAdminUser(null);
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthSuccessMessage(null);

    const cleanEmail = adminEmailInput.trim().toLowerCase();
    if (!cleanEmail || !adminPasswordInput) {
      setAdminAuthError('Please enter both your authorized admin email and password.');
      return;
    }

    if (!ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
      setAdminAuthError(
        `Access Denied: ${cleanEmail} is not in the list of authorized admin emails.`
      );
      return;
    }

    const rateCheck = checkRateLimit('admin_login');
    if (!rateCheck.allowed) {
      setAdminAuthError(rateCheck.message || 'Too many attempts. Please try again in a few minutes.');
      return;
    }
    recordAttempt('admin_login');

    setAdminAuthLoading(true);

    // Direct authorization check for pre-configured credentials
    if (AUTHORIZED_ADMIN_CREDENTIALS[cleanEmail] && AUTHORIZED_ADMIN_CREDENTIALS[cleanEmail] === adminPasswordInput) {
      resetRateLimit('admin_login');
      const resolvedDisplayName =
        AUTHORIZED_ADMIN_DISPLAY_NAMES[cleanEmail] || `${cleanEmail.split('@')[0]} (Admin)`;
      const sessionUser = {
        email: cleanEmail,
        displayName: resolvedDisplayName,
        uid: 'admin-partner-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      } as unknown as FirebaseUser;

      try {
        localStorage.setItem(
          'rla_admin_auth_user',
          JSON.stringify({
            email: cleanEmail,
            displayName: resolvedDisplayName,
            loggedInAt: Date.now(),
          })
        );
      } catch (e) {
        console.warn('Storage save error:', e);
      }

      setAdminUser(sessionUser);
      setAdminAuthSuccessMessage(`Authorized successfully as ${resolvedDisplayName}. Access granted!`);
      setAdminAuthLoading(false);

      // Attempt background Firebase Auth sync/creation
      signInWithEmailAndPassword(auth, cleanEmail, adminPasswordInput).catch(() => {
        createUserWithEmailAndPassword(auth, cleanEmail, adminPasswordInput).catch(() => {});
      });
      return;
    }

    // If entered incorrect password for pre-configured credentials
    if (AUTHORIZED_ADMIN_CREDENTIALS[cleanEmail] && AUTHORIZED_ADMIN_CREDENTIALS[cleanEmail] !== adminPasswordInput) {
      setAdminAuthError('Invalid password for this authorized administrator account.');
      setAdminAuthLoading(false);
      return;
    }

    try {
      if (adminIsRegisterMode) {
        if (adminPasswordInput.length < 6) {
          setAdminAuthError('Password must be at least 6 characters long.');
          setAdminAuthLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, cleanEmail, adminPasswordInput);
        resetRateLimit('admin_login');
        try {
          localStorage.setItem(
            'rla_admin_auth_user',
            JSON.stringify({
              email: cleanEmail,
              displayName: result.user.displayName || cleanEmail.split('@')[0],
              loggedInAt: Date.now(),
            })
          );
        } catch (e) {}
        setAdminUser(result.user);
        setAdminAuthSuccessMessage('Admin credentials verified. Welcome!');
      } else {
        const result = await signInWithEmailAndPassword(auth, cleanEmail, adminPasswordInput);
        resetRateLimit('admin_login');
        try {
          localStorage.setItem(
            'rla_admin_auth_user',
            JSON.stringify({
              email: cleanEmail,
              displayName: result.user.displayName || cleanEmail.split('@')[0],
              loggedInAt: Date.now(),
            })
          );
        } catch (e) {}
        setAdminUser(result.user);
      }
    } catch (err: any) {
      console.warn('Email/Password auth error:', err);
      let msg = err.message || 'Authentication failed. Please verify your credentials.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg =
          'Invalid email or password. If you have not created a password yet for this authorized account, click "Forgot / Set Password" below or switch to "Create password".';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account already exists for this email. Please sign in with your password or use "Forgot / Set Password".';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.';
      }
      setAdminAuthError(msg);
      setAdminUser(null);
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminPasswordReset = async () => {
    setAdminAuthError(null);
    setAdminAuthSuccessMessage(null);

    const cleanEmail = adminEmailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setAdminAuthError('Please enter your authorized email address above first, then click "Forgot / Set Password".');
      return;
    }

    if (!ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
      setAdminAuthError(`Access Denied: ${cleanEmail} is not an authorized admin email.`);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setAdminAuthSuccessMessage(
        `A password set/reset link has been sent to ${cleanEmail}. Check your inbox and spam folder to set your password.`
      );
    } catch (err: any) {
      setAdminAuthError(err.message || 'Failed to send password reset email. Please try again.');
    }
  };

  const handleAdminSignOut = async () => {
    try {
      localStorage.removeItem('rla_admin_auth_user');
    } catch (e) {}
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setAdminUser(null);
    setAdminPasswordInput('');
  };

  // Auto-logout after 2 minutes (120,000 ms) of inactivity
  useInactivityTimeout(
    !!adminUser,
    () => {
      handleAdminSignOut();
      setAdminAuthError('Logged out automatically due to 2 minutes of inactivity.');
    },
    120000
  );

  const {
    clients,
    cases,
    notices,
    documents,
    tasks,
    notes,
    invoices,
    hearings,
    notifications,
    clientCredentials,
    addClientCredential,
    addClient,
    addCase,
    updateCase,
    updateCaseStatus,
    addTimelineEvent,
    addNotice,
    updateNoticeStatus,
    addDocument,
    addTask,
    toggleTask,
    addNote,
    addInvoice,
    markInvoicePaid,
    addHearing,
    updateCaseHearing,
    updateHearing,
    sendNotification,
    practiceAreas,
    addPracticeArea,
    updatePracticeArea,
    deletePracticeArea,
    resetPracticeAreas,
    teamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    resetTeamMembers,
    setStuckTeamMember,
    reviews,
    addReview,
    updateReview,
    deleteReview,
    resetReviews,
    insights,
    addInsight,
    updateInsight,
    deleteInsight,
    resetInsights
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'cases' | 'calendar' | 'documents' | 'tasks' | 'billing' | 'practiceAreas' | 'team' | 'reviews' | 'insights'
  >('dashboard');

  // Mobile App Navigation Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Calendar Month Navigation State
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(() => new Date(2026, 7, 1));
  const [showClientPassword, setShowClientPassword] = useState(false);

  // Practice Areas Search, Filters & Modal States
  const [paSearchTerm, setPaSearchTerm] = useState('');
  const [paCategoryFilter, setPaCategoryFilter] = useState('All');
  const [showPracticeAreaModal, setShowPracticeAreaModal] = useState(false);
  const [editingPracticeArea, setEditingPracticeArea] = useState<PracticeArea | null>(null);
  const [deleteConfirmArea, setDeleteConfirmArea] = useState<PracticeArea | null>(null);
  const [paActionSuccess, setPaActionSuccess] = useState<string | null>(null);

  // Practice Area Form State (strictly aligned with frontend PracticeAreasSection + PracticeModal)
  const [paFormData, setPaFormData] = useState({
    title: '',
    shortDesc: '',
    fullDesc: '',
    subServicesText: '',
    image: FIRM_CONFIG.images.about
  });

  // Team Members Search, Filters & Modal States
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamRoleFilter, setTeamRoleFilter] = useState('All');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<TeamMember | null>(null);
  const [teamActionSuccess, setTeamActionSuccess] = useState<string | null>(null);

  // Team Member Form State (strictly aligned with frontend TeamSection card + profile modal)
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    title: 'Advocate High Court',
    pillarWatermark: 'ADVOCATE',
    specialty: '',
    credentialsText: 'Advocate High Court',
    bio: '',
    image: rahimMemberImg,
    stickToLeft: false
  });

  // Reviews Search, Filters & Modal States
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('All');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<ReviewItem | null>(null);
  const [reviewActionSuccess, setReviewActionSuccess] = useState<string | null>(null);

  // Review Form State (strictly aligned with frontend Testimonials carousel)
  const [reviewFormData, setReviewFormData] = useState({
    clientInitials: '',
    caseType: 'Corporate & Commercial Law',
    location: 'Islamabad',
    reviewText: '',
    status: 'published' as 'published' | 'pending' | 'archived'
  });

  // Legal Insights Search, Filters & Modal States
  const [insightSearchTerm, setInsightSearchTerm] = useState('');
  const [insightCategoryFilter, setInsightCategoryFilter] = useState('All');
  const [insightStatusFilter, setInsightStatusFilter] = useState('All');
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [editingInsight, setEditingInsight] = useState<LegalInsightItem | null>(null);
  const [deleteConfirmInsight, setDeleteConfirmInsight] = useState<LegalInsightItem | null>(null);
  const [insightActionSuccess, setInsightActionSuccess] = useState<string | null>(null);

  // Legal Insight Form State (strictly aligned with frontend InsightsSection, Archive & Detail pages)
  const [insightFormData, setInsightFormData] = useState({
    title: '',
    category: 'Litigation & Dispute Resolution',
    author: 'Mr. Rahim Nawaz Khan Abbasi',
    authorRole: 'Senior Counsel',
    date: 'Oct 14, 2026',
    readTime: '6 min read',
    image: gavelImg,
    excerpt: '',
    pullQuote: '',
    fullContentText: '',
    keyTakeawaysText: '',
    statutesReferencedText: '',
    status: 'published' as 'published' | 'draft' | 'archived'
  });

  // Case Management Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [counselFilter, setCounselFilter] = useState<string>('All');
  const [forumFilter, setForumFilter] = useState<string>('All');
  const [taxYearFilter, setTaxYearFilter] = useState<string>('All');

  // Document Vault Search & Filters
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('All');
  const [docUploaderFilter, setDocUploaderFilter] = useState('All');

  // Tasks & Internal Notes Search & Filters
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('All');
  const [noteSearchTerm, setNoteSearchTerm] = useState('');

  // Billing & Fee Invoices Search & Filters
  const [billingSearchTerm, setBillingSearchTerm] = useState('');
  const [billingStatusFilter, setBillingStatusFilter] = useState('All');
  const [billingClientFilter, setBillingClientFilter] = useState('All');

  // Dashboard Cases Quick Search & Filter
  const [dashSearch, setDashSearch] = useState('');
  const [dashFilter, setDashFilter] = useState('All');

  // Dynamic Unique Options for Filters
  const docCategories = Array.from(new Set(documents.map((d) => d.category)));
  const docUploaders = Array.from(new Set(documents.map((d) => d.uploadedBy)));
  const taskAssignees = Array.from(new Set(tasks.map((t) => t.assignedTo)));
  const billingClients = Array.from(new Set(invoices.map((inv) => inv.clientName)));
  const caseForums = Array.from(new Set(cases.map((c) => c.forum)));
  const caseTaxYears = Array.from(new Set(cases.map((c) => c.taxYear)));
  const caseAdvocates = Array.from(new Set(cases.map((c) => c.assignedCounsel).concat(ADVOCATES)));

  // Comprehensive Filtered Collections by Unique Data (CNO #, Section Code, Tax Year, Forum, Case Ref, NTN, File Size, Date, Author, Invoice #, etc.)
  const filteredCases = cases.filter((c) => {
    const q = searchTerm.trim().toLowerCase();

    // Find linked notices to match CNO number, Section code, issuing officer
    const linkedNotices = notices.filter((n) => n.caseId === c.id || n.cnoNumber === c.caseRef);
    const linkedCnos = linkedNotices.map((n) => n.cnoNumber.toLowerCase()).join(' ');
    const linkedSections = linkedNotices.map((n) => n.sectionCode.toLowerCase()).join(' ');
    const linkedOfficers = linkedNotices.map((n) => n.issuingOfficer.toLowerCase()).join(' ');

    const matchesSearch =
      q === '' ||
      c.caseTitle.toLowerCase().includes(q) ||
      c.caseRef.toLowerCase().includes(q) ||
      (c.caseId && c.caseId.toLowerCase().includes(q)) ||
      c.clientName.toLowerCase().includes(q) ||
      c.clientNtn.toLowerCase().includes(q) ||
      c.forum.toLowerCase().includes(q) ||
      c.taxYear.toLowerCase().includes(q) ||
      c.assignedCounsel.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      c.riskLevel.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      (c.nextHearingPurpose && c.nextHearingPurpose.toLowerCase().includes(q)) ||
      (c.demandAmountPkr && c.demandAmountPkr.toString().includes(q)) ||
      linkedCnos.includes(q) ||
      linkedSections.includes(q) ||
      linkedOfficers.includes(q);

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesCounsel = counselFilter === 'All' || c.assignedCounsel === counselFilter;
    const matchesForum = forumFilter === 'All' || c.forum === forumFilter;
    const matchesTaxYear = taxYearFilter === 'All' || c.taxYear === taxYearFilter;

    return matchesSearch && matchesStatus && matchesCounsel && matchesForum && matchesTaxYear;
  });

  const filteredDocuments = documents.filter((doc) => {
    const q = docSearchTerm.trim().toLowerCase();

    // Link case and notices to match file search against case metadata (CNO, Section, Forum, Tax Year, Client NTN, Ref)
    const linkedCase = cases.find((c) => c.id === doc.caseId);
    const linkedNotices = notices.filter((n) => n.caseId === doc.caseId);
    const linkedCnos = linkedNotices.map((n) => n.cnoNumber.toLowerCase()).join(' ');
    const linkedSections = linkedNotices.map((n) => n.sectionCode.toLowerCase()).join(' ');

    const matchesSearch =
      q === '' ||
      doc.title.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.uploadedBy.toLowerCase().includes(q) ||
      (doc.fileSize && doc.fileSize.toLowerCase().includes(q)) ||
      (doc.fileType && doc.fileType.toLowerCase().includes(q)) ||
      (doc.uploadedAt && doc.uploadedAt.toLowerCase().includes(q)) ||
      (doc.caseId && doc.caseId.toLowerCase().includes(q)) ||
      (linkedCase && (
        linkedCase.caseTitle.toLowerCase().includes(q) ||
        linkedCase.caseRef.toLowerCase().includes(q) ||
        linkedCase.clientName.toLowerCase().includes(q) ||
        linkedCase.clientNtn.toLowerCase().includes(q) ||
        linkedCase.forum.toLowerCase().includes(q) ||
        linkedCase.taxYear.toLowerCase().includes(q) ||
        linkedCase.assignedCounsel.toLowerCase().includes(q)
      )) ||
      linkedCnos.includes(q) ||
      linkedSections.includes(q);

    const matchesCategory =
      docCategoryFilter === 'All' || doc.category === docCategoryFilter;
    const matchesUploader =
      docUploaderFilter === 'All' || doc.uploadedBy === docUploaderFilter;

    return matchesSearch && matchesCategory && matchesUploader;
  });

  const filteredTasks = tasks.filter((t) => {
    const q = taskSearchTerm.trim().toLowerCase();
    const linkedCase = cases.find((c) => c.id === t.caseId);
    const linkedNotices = notices.filter((n) => n.caseId === t.caseId);
    const linkedCnos = linkedNotices.map((n) => n.cnoNumber.toLowerCase()).join(' ');
    const linkedSections = linkedNotices.map((n) => n.sectionCode.toLowerCase()).join(' ');

    const matchesSearch =
      q === '' ||
      t.title.toLowerCase().includes(q) ||
      t.assignedTo.toLowerCase().includes(q) ||
      t.priority.toLowerCase().includes(q) ||
      t.dueDate.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      (linkedCase && (
        linkedCase.caseTitle.toLowerCase().includes(q) ||
        linkedCase.caseRef.toLowerCase().includes(q) ||
        linkedCase.clientName.toLowerCase().includes(q) ||
        linkedCase.clientNtn.toLowerCase().includes(q)
      )) ||
      linkedCnos.includes(q) ||
      linkedSections.includes(q);

    const matchesStatus =
      taskStatusFilter === 'All' ||
      (taskStatusFilter === 'Pending' && !t.isCompleted) ||
      (taskStatusFilter === 'Completed' && t.isCompleted);
    const matchesAssignee =
      taskAssigneeFilter === 'All' || t.assignedTo === taskAssigneeFilter;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const filteredNotes = notes.filter((n) => {
    const q = noteSearchTerm.trim().toLowerCase();
    const linkedCase = cases.find((c) => c.id === n.caseId);
    const linkedNotices = notices.filter((not) => not.caseId === n.caseId);
    const linkedCnos = linkedNotices.map((not) => not.cnoNumber.toLowerCase()).join(' ');
    const linkedSections = linkedNotices.map((not) => not.sectionCode.toLowerCase()).join(' ');

    return (
      q === '' ||
      n.text.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q) ||
      n.date.toLowerCase().includes(q) ||
      (linkedCase && (
        linkedCase.caseTitle.toLowerCase().includes(q) ||
        linkedCase.caseRef.toLowerCase().includes(q) ||
        linkedCase.clientName.toLowerCase().includes(q) ||
        linkedCase.clientNtn.toLowerCase().includes(q)
      )) ||
      linkedCnos.includes(q) ||
      linkedSections.includes(q)
    );
  });

  const filteredInvoices = invoices.filter((inv) => {
    const q = billingSearchTerm.trim().toLowerCase();
    const linkedCase = cases.find((c) => c.id === inv.caseId);
    const linkedNotices = notices.filter((n) => n.caseId === inv.caseId);
    const linkedCnos = linkedNotices.map((n) => n.cnoNumber.toLowerCase()).join(' ');
    const linkedSections = linkedNotices.map((n) => n.sectionCode.toLowerCase()).join(' ');

    const matchesSearch =
      q === '' ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.serviceDescription.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q) ||
      inv.clientNtn.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q) ||
      inv.issueDate.toLowerCase().includes(q) ||
      inv.dueDate.toLowerCase().includes(q) ||
      inv.totalAmountPkr.toString().includes(q) ||
      (linkedCase && (
        linkedCase.caseTitle.toLowerCase().includes(q) ||
        linkedCase.caseRef.toLowerCase().includes(q) ||
        linkedCase.forum.toLowerCase().includes(q) ||
        linkedCase.taxYear.toLowerCase().includes(q)
      )) ||
      linkedCnos.includes(q) ||
      linkedSections.includes(q);

    const matchesStatus =
      billingStatusFilter === 'All' || inv.status === billingStatusFilter;
    const matchesClient =
      billingClientFilter === 'All' || inv.clientName === billingClientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  // Dynamic Practice Area Categories & Filtered List
  const paCategories = Array.from(new Set((practiceAreas || []).map((p) => p.category).filter(Boolean)));
  const filteredPracticeAreas = (practiceAreas || []).filter((pa) => {
    const q = paSearchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      pa.title.toLowerCase().includes(q) ||
      pa.category.toLowerCase().includes(q) ||
      pa.shortDesc.toLowerCase().includes(q) ||
      pa.fullDesc.toLowerCase().includes(q) ||
      (pa.badge && pa.badge.toLowerCase().includes(q)) ||
      pa.subServices.some((s) => s.toLowerCase().includes(q)) ||
      pa.keyHighlights.some((h) => h.toLowerCase().includes(q));

    const matchesCategory = paCategoryFilter === 'All' || pa.category === paCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddPracticeArea = () => {
    setEditingPracticeArea(null);
    setPaFormData({
      title: '',
      shortDesc: '',
      fullDesc: '',
      subServicesText: '',
      image: FIRM_CONFIG.images.about
    });
    setShowPracticeAreaModal(true);
  };

  const handleOpenEditPracticeArea = (area: PracticeArea) => {
    setEditingPracticeArea(area);
    setPaFormData({
      title: area.title,
      shortDesc: area.shortDesc,
      fullDesc: area.fullDesc || '',
      subServicesText: (area.subServices || []).join(', '),
      image: area.image || FIRM_CONFIG.images.about
    });
    setShowPracticeAreaModal(true);
  };

  const handleSavePracticeArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paFormData.title.trim()) return;

    const subServicesList = paFormData.subServicesText
      ? paFormData.subServicesText
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const shortDescText = paFormData.shortDesc.trim();
    const fullDescText = paFormData.fullDesc.trim() || shortDescText;
    const highlightsList = subServicesList.length > 0
      ? subServicesList.slice(0, 6)
      : [shortDescText || 'Full legal advisory and representation'];
    const imageSrc = paFormData.image.trim() || FIRM_CONFIG.images.about;

    if (editingPracticeArea) {
      updatePracticeArea(editingPracticeArea.id, {
        title: paFormData.title.trim(),
        category: editingPracticeArea.category || paFormData.title.trim(),
        badge: editingPracticeArea.badge || '',
        iconName: editingPracticeArea.iconName || 'Scale',
        shortDesc: shortDescText,
        fullDesc: fullDescText,
        subServices: subServicesList,
        keyHighlights: highlightsList,
        image: imageSrc
      });
      setPaActionSuccess(`Updated "${paFormData.title.trim()}" successfully.`);
    } else {
      addPracticeArea({
        title: paFormData.title.trim(),
        category: paFormData.title.trim(),
        iconName: 'Scale',
        shortDesc: shortDescText,
        fullDesc: fullDescText,
        subServices: subServicesList,
        keyHighlights: highlightsList,
        image: imageSrc
      });
      setPaActionSuccess(`Added "${paFormData.title.trim()}" successfully.`);
    }

    setShowPracticeAreaModal(false);
    setTimeout(() => setPaActionSuccess(null), 4000);
  };

  const handleDeletePracticeArea = (area: PracticeArea) => {
    deletePracticeArea(area.id);
    setDeleteConfirmArea(null);
    setPaActionSuccess(`Removed practice area "${area.title}".`);
    setTimeout(() => setPaActionSuccess(null), 4000);
  };

  const handleResetPracticeAreas = () => {
    if (typeof window !== 'undefined' && window.confirm('Reset all practice areas to firm default services? Any custom practice areas will be replaced with the 6 core practice areas.')) {
      resetPracticeAreas();
      setPaActionSuccess('Practice areas reset to standard firm defaults.');
      setTimeout(() => setPaActionSuccess(null), 4000);
    }
  };

  const renderPracticeAreaIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case 'FileText': return <FileText className={className} />;
      case 'Building2':
      case 'Building': return <Building2 className={className} />;
      case 'Gavel': return <Gavel className={className} />;
      case 'Home': return <HomeIcon className={className} />;
      case 'Scroll': return <Scroll className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Users': return <Users className={className} />;
      case 'Landmark': return <Landmark className={className} />;
      case 'Briefcase': return <Briefcase className={className} />;
      case 'Scale':
      default:
        return <Scale className={className} />;
    }
  };

  // Team Members Filtering & Handlers
  const filteredTeamMembers = (teamMembers || []).filter((m) => {
    const q = teamSearchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      m.name.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.specialty.toLowerCase().includes(q) ||
      m.bio.toLowerCase().includes(q) ||
      (m.credentials && m.credentials.some((c) => c.toLowerCase().includes(q)));

    const matchesRole =
      teamRoleFilter === 'All' ||
      (teamRoleFilter === 'CEO' && m.isCeo) ||
      (teamRoleFilter === 'Associate' && !m.isCeo);

    return matchesSearch && matchesRole;
  });

  const handleOpenAddTeamMember = () => {
    setEditingTeamMember(null);
    setTeamFormData({
      name: '',
      title: 'Advocate High Court',
      pillarWatermark: 'ADVOCATE',
      specialty: '',
      credentialsText: 'Advocate High Court',
      bio: '',
      image: rahimMemberImg,
      stickToLeft: false
    });
    setShowTeamModal(true);
  };

  const handleOpenEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    const isCurrentlyStuck = !!member.stickToLeft || (!teamMembers.some((m) => m.stickToLeft) && !!member.isCeo);
    const combinedBio =
      member.fullBio && member.fullBio.length > 0
        ? member.fullBio.join('\n\n')
        : member.bio || '';
    const combinedSpecs =
      member.specializations && member.specializations.length > 0
        ? member.specializations.join(', ')
        : member.specialty || '';
    setTeamFormData({
      name: member.name,
      title: member.title,
      pillarWatermark: member.pillarWatermark || (member.isCeo ? 'FOUNDER' : 'ADVOCATE'),
      specialty: combinedSpecs,
      credentialsText: (member.credentials || []).join(', '),
      bio: combinedBio,
      image: member.image || rahimMemberImg,
      stickToLeft: isCurrentlyStuck
    });
    setShowTeamModal(true);
  };

  const handleStickToLeft = (memberId: string) => {
    setStuckTeamMember(memberId);
    const target = teamMembers.find((m) => m.id === memberId);
    setTeamActionSuccess(
      `"${target?.name || 'Selected profile'}" is now stuck to the left side of the screen.`
    );
    setTimeout(() => setTeamActionSuccess(null), 4000);
  };

  const handleSaveTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormData.name.trim()) return;

    const credsList = teamFormData.credentialsText
      ? teamFormData.credentialsText
          .split(/[\n,]+/)
          .map((c) => c.trim())
          .filter(Boolean)
      : ['Advocate High Court'];

    const bioText =
      teamFormData.bio.trim() ||
      `${teamFormData.name.trim()} is an advocate at Rahim Law Associates advising and representing clients across trial and appellate courts.`;

    const bioParagraphs = bioText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const parsedSpecs = teamFormData.specialty
      ? teamFormData.specialty
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : ['Appellate & Corporate Law'];

    const watermark = teamFormData.pillarWatermark.trim().toUpperCase() || 'ADVOCATE';

    if (editingTeamMember) {
      updateTeamMember(editingTeamMember.id, {
        name: teamFormData.name.trim(),
        title: teamFormData.title.trim(),
        experienceYears: editingTeamMember.experienceYears || 10,
        specialty: parsedSpecs[0] || teamFormData.specialty.trim() || 'Appellate & Corporate Law',
        specializations: parsedSpecs,
        pillarWatermark: watermark,
        bio: bioParagraphs[0] || bioText,
        fullBio: bioParagraphs.length > 0 ? bioParagraphs : [bioText],
        credentials: credsList,
        keyWin: editingTeamMember.keyWin || '',
        image: teamFormData.image.trim() || rahimMemberImg,
        isCeo: editingTeamMember.isCeo || watermark === 'FOUNDER',
        stickToLeft: teamFormData.stickToLeft
      });
      if (teamFormData.stickToLeft) {
        setStuckTeamMember(editingTeamMember.id);
      }
      setTeamActionSuccess(`Updated team member "${teamFormData.name.trim()}" successfully.`);
    } else {
      const generatedId =
        teamFormData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
        `team-${Date.now()}`;
      addTeamMember({
        name: teamFormData.name.trim(),
        title: teamFormData.title.trim(),
        experienceYears: 10,
        specialty: parsedSpecs[0] || teamFormData.specialty.trim() || 'Appellate & Corporate Law',
        specializations: parsedSpecs,
        pillarWatermark: watermark,
        bio: bioParagraphs[0] || bioText,
        fullBio: bioParagraphs.length > 0 ? bioParagraphs : [bioText],
        credentials: credsList,
        keyWin: '',
        image: teamFormData.image.trim() || rahimMemberImg,
        isCeo: watermark === 'FOUNDER',
        stickToLeft: teamFormData.stickToLeft
      });
      if (teamFormData.stickToLeft) {
        setStuckTeamMember(generatedId);
      }
      setTeamActionSuccess(`Added "${teamFormData.name.trim()}" to the firm roster.`);
    }

    setShowTeamModal(false);
    setTimeout(() => setTeamActionSuccess(null), 4000);
  };

  const handleDeleteTeamMember = (member: TeamMember) => {
    deleteTeamMember(member.id);
    setDeleteConfirmMember(null);
    setTeamActionSuccess(`Removed team member "${member.name}".`);
    setTimeout(() => setTeamActionSuccess(null), 4000);
  };

  const handleResetTeamMembers = () => {
    if (typeof window !== 'undefined' && window.confirm('Reset team roster to original founding counsel members?')) {
      resetTeamMembers();
      setTeamActionSuccess('Restored founding attorneys roster.');
      setTimeout(() => setTeamActionSuccess(null), 4000);
    }
  };

  // Reviews Filtering & Handlers
  const filteredReviews = (reviews || []).filter((r) => {
    const q = reviewSearchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      r.clientInitials.toLowerCase().includes(q) ||
      r.clientRole.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.caseType.toLowerCase().includes(q) ||
      r.reviewText.toLowerCase().includes(q) ||
      r.dollarSaved.toLowerCase().includes(q);

    const matchesRating =
      reviewRatingFilter === 'All' ||
      r.rating === Number(reviewRatingFilter);

    const matchesStatus =
      reviewStatusFilter === 'All' ||
      (reviewStatusFilter === 'published' && (r.status === 'published' || !r.status)) ||
      r.status === reviewStatusFilter;

    return matchesSearch && matchesRating && matchesStatus;
  });

  const handleOpenAddReview = () => {
    setEditingReview(null);
    setReviewFormData({
      clientInitials: '',
      caseType: 'Corporate & Commercial Law',
      location: 'Islamabad',
      reviewText: '',
      status: 'published'
    });
    setShowReviewModal(true);
  };

  const handleOpenEditReview = (review: ReviewItem) => {
    setEditingReview(review);
    setReviewFormData({
      clientInitials: review.clientInitials,
      caseType: review.caseType || review.clientRole || 'Corporate & Commercial Law',
      location: review.location || '',
      reviewText: review.reviewText,
      status: review.status || 'published'
    });
    setShowReviewModal(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewFormData.clientInitials.trim() || !reviewFormData.reviewText.trim()) return;

    const matterArea = reviewFormData.caseType.trim() || 'Legal Advisory';

    if (editingReview) {
      updateReview(editingReview.id, {
        clientInitials: reviewFormData.clientInitials.trim(),
        clientRole: editingReview.clientRole || matterArea,
        location: reviewFormData.location.trim(),
        caseType: matterArea,
        dollarSaved: editingReview.dollarSaved || '',
        rating: editingReview.rating || 5,
        reviewText: reviewFormData.reviewText.trim(),
        verifiedBadge: editingReview.verifiedBadge ?? true,
        date: editingReview.date || '',
        status: reviewFormData.status,
        featured: editingReview.featured !== false
      });
      setReviewActionSuccess(`Updated testimonial for "${reviewFormData.clientInitials.trim()}".`);
    } else {
      addReview({
        clientInitials: reviewFormData.clientInitials.trim(),
        clientRole: matterArea,
        location: reviewFormData.location.trim(),
        caseType: matterArea,
        dollarSaved: '',
        rating: 5,
        reviewText: reviewFormData.reviewText.trim(),
        verifiedBadge: true,
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        status: reviewFormData.status,
        featured: true
      });
      setReviewActionSuccess(`Added new client review from "${reviewFormData.clientInitials.trim()}".`);
    }

    setShowReviewModal(false);
    setTimeout(() => setReviewActionSuccess(null), 4000);
  };

  const handleDeleteReview = (review: ReviewItem) => {
    deleteReview(review.id);
    setDeleteConfirmReview(null);
    setReviewActionSuccess(`Removed review from "${review.clientInitials}".`);
    setTimeout(() => setReviewActionSuccess(null), 4000);
  };

  const handleToggleReviewStatus = (review: ReviewItem) => {
    const nextStatus = review.status === 'archived' ? 'published' : 'archived';
    updateReview(review.id, { status: nextStatus });
    setReviewActionSuccess(
      nextStatus === 'published'
        ? `Published review from "${review.clientInitials}" to public website.`
        : `Archived review from "${review.clientInitials}".`
    );
    setTimeout(() => setReviewActionSuccess(null), 4000);
  };

  const handleResetReviews = () => {
    if (typeof window !== 'undefined' && window.confirm('Reset reviews to default firm testimonials?')) {
      resetReviews();
      setReviewActionSuccess('Restored standard client reviews.');
      setTimeout(() => setReviewActionSuccess(null), 4000);
    }
  };

  // Legal Insights Filtering & Handlers
  const filteredInsights = (insights || []).filter((item) => {
    const q = insightSearchTerm.trim().toLowerCase();
    const authorName = typeof item.author === 'object' && item.author !== null ? item.author.name : String(item.author || '');
    const matchesSearch =
      q === '' ||
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      authorName.toLowerCase().includes(q) ||
      (item.keyTakeaways && item.keyTakeaways.some((t) => t.toLowerCase().includes(q)));

    const matchesCategory =
      insightCategoryFilter === 'All' || item.category === insightCategoryFilter;

    const matchesStatus =
      insightStatusFilter === 'All' ||
      (insightStatusFilter === 'published' && (item.status === 'published' || !item.status)) ||
      item.status === insightStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAddInsight = () => {
    setEditingInsight(null);
    setInsightFormData({
      title: '',
      category: 'Litigation & Dispute Resolution',
      author: 'Mr. Rahim Nawaz Khan Abbasi',
      authorRole: 'Senior Counsel',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: '6 min read',
      image: gavelImg,
      excerpt: '',
      pullQuote: '',
      fullContentText: '',
      keyTakeawaysText: '',
      statutesReferencedText: '',
      status: 'published'
    });
    setShowInsightModal(true);
  };

  const handleOpenEditInsight = (insight: LegalInsightItem) => {
    setEditingInsight(insight);
    const authorName = typeof insight.author === 'object' && insight.author !== null ? insight.author.name : String(insight.author || 'Mr. Rahim Nawaz Khan Abbasi');
    const authorRole = typeof insight.author === 'object' && insight.author !== null ? insight.author.role : 'Senior Counsel';
    const initialBody =
      insight.sections && insight.sections.length > 0
        ? insight.sections.flatMap((s) => s.paragraphs).join('\n\n')
        : (insight.content || []).join('\n\n');
    setInsightFormData({
      title: insight.title,
      category: insight.category,
      author: authorName,
      authorRole: authorRole,
      date: insight.publishedDate || insight.date,
      readTime: insight.readTime || '5 min read',
      image: insight.image || gavelImg,
      excerpt: insight.excerpt,
      pullQuote: insight.pullQuote || '',
      fullContentText: initialBody,
      keyTakeawaysText: (insight.keyTakeaways || []).join('\n'),
      statutesReferencedText: (insight.statutesReferenced || []).join('\n'),
      status: insight.status || 'published'
    });
    setShowInsightModal(true);
  };

  const handleSaveInsight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightFormData.title.trim()) return;

    const parsedKeyTakeaways = insightFormData.keyTakeawaysText
      ? insightFormData.keyTakeawaysText
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
      : [insightFormData.title.trim()];

    const parsedStatutes = insightFormData.statutesReferencedText
      ? insightFormData.statutesReferencedText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const parsedFullContent = insightFormData.fullContentText
      ? insightFormData.fullContentText
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [insightFormData.excerpt.trim() || insightFormData.title.trim()];

    const generatedSlug =
      (editingInsight && editingInsight.slug) ||
      insightFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `insight-${Date.now()}`;

    const existingAuthor =
      editingInsight && typeof editingInsight.author === 'object' && editingInsight.author !== null
        ? editingInsight.author
        : null;

    const authorPayload = {
      name: insightFormData.author.trim() || 'Mr. Rahim Nawaz Khan Abbasi',
      role: insightFormData.authorRole.trim() || 'Senior Counsel',
      credentials:
        existingAuthor?.credentials ||
        insightFormData.authorRole.trim() ||
        'Advocate High Court'
    };

    const dateText =
      insightFormData.date.trim() ||
      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const coverImage = insightFormData.image.trim() || gavelImg;
    const cleanPullQuote = insightFormData.pullQuote.trim();

    if (editingInsight) {
      const originalSectionsBody =
        editingInsight.sections && editingInsight.sections.length > 0
          ? editingInsight.sections.flatMap((s) => s.paragraphs).join('\n\n')
          : '';
      const updatedSections =
        editingInsight.sections &&
        editingInsight.sections.length > 0 &&
        insightFormData.fullContentText.trim() === originalSectionsBody.trim()
          ? editingInsight.sections
          : [
              {
                heading:
                  editingInsight.sections?.[0]?.heading || 'Overview & Legal Analysis',
                paragraphs: parsedFullContent
              }
            ];

      updateInsight(editingInsight.id, {
        title: insightFormData.title.trim(),
        slug: generatedSlug,
        category: insightFormData.category.trim() || 'Litigation & Dispute Resolution',
        author: authorPayload,
        date: dateText,
        publishedDate: dateText,
        readTime: insightFormData.readTime.trim() || '5 min read',
        image: coverImage,
        excerpt: insightFormData.excerpt.trim() || 'Legal brief and statutory commentary.',
        keyTakeaways: parsedKeyTakeaways,
        content: parsedFullContent,
        sections: updatedSections,
        ...(cleanPullQuote ? { pullQuote: cleanPullQuote } : {}),
        ...(parsedStatutes.length > 0 ? { statutesReferenced: parsedStatutes } : {}),
        ...(editingInsight.subtitle ? { subtitle: editingInsight.subtitle } : {}),
        ...(editingInsight.imageCaption ? { imageCaption: editingInsight.imageCaption } : {}),
        ...(editingInsight.number ? { number: editingInsight.number } : {}),
        status: insightFormData.status,
        featured: editingInsight.featured ?? true
      });
      setInsightActionSuccess(`Updated article "${insightFormData.title.trim()}".`);
    } else {
      addInsight({
        title: insightFormData.title.trim(),
        slug: generatedSlug,
        category: insightFormData.category.trim() || 'Litigation & Dispute Resolution',
        author: authorPayload,
        date: dateText,
        publishedDate: dateText,
        readTime: insightFormData.readTime.trim() || '5 min read',
        image: coverImage,
        excerpt: insightFormData.excerpt.trim() || 'Legal brief and statutory commentary.',
        keyTakeaways: parsedKeyTakeaways,
        content: parsedFullContent,
        sections: [
          {
            heading: 'Overview & Legal Analysis',
            paragraphs: parsedFullContent
          }
        ],
        ...(cleanPullQuote ? { pullQuote: cleanPullQuote } : {}),
        ...(parsedStatutes.length > 0 ? { statutesReferenced: parsedStatutes } : {}),
        status: insightFormData.status,
        featured: true
      });
      setInsightActionSuccess(`Added new legal insight "${insightFormData.title.trim()}".`);
    }

    setShowInsightModal(false);
    setTimeout(() => setInsightActionSuccess(null), 4000);
  };

  const handleDeleteInsight = (insight: LegalInsightItem) => {
    deleteInsight(insight.id);
    setDeleteConfirmInsight(null);
    setInsightActionSuccess(`Deleted article "${insight.title}".`);
    setTimeout(() => setInsightActionSuccess(null), 4000);
  };

  const handleToggleInsightStatus = (insight: LegalInsightItem) => {
    const nextStatus = insight.status === 'archived' ? 'published' : 'archived';
    updateInsight(insight.id, { status: nextStatus });
    setInsightActionSuccess(
      nextStatus === 'published'
        ? `Published "${insight.title}" to public blog and insights feed.`
        : `Archived "${insight.title}".`
    );
    setTimeout(() => setInsightActionSuccess(null), 4000);
  };

  const handleResetInsights = () => {
    if (typeof window !== 'undefined' && window.confirm('Reset legal insights to default firm publication articles?')) {
      resetInsights();
      setInsightActionSuccess('Restored standard firm legal publications.');
      setTimeout(() => setInsightActionSuccess(null), 4000);
    }
  };

  // Calendar State & Smooth Scroll Ref
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const calendarHearingsListRef = useRef<HTMLDivElement>(null);

  const handleSelectCalendarDate = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    setTimeout(() => {
      calendarHearingsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Modal States
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false);
  const [showNoticesModal, setShowNoticesModal] = useState(false);
  const [noticeStatusFilter, setNoticeStatusFilter] = useState<'all' | 'Pending Reply' | 'Challenged in Appeal' | 'Order Passed'>('all');
  const [noticeSearchTerm, setNoticeSearchTerm] = useState('');
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddHearingModal, setShowAddHearingModal] = useState(false);
  const [showSendNotifModal, setShowSendNotifModal] = useState(false);

  // Selected Case Detail Drawer & Sub-tab
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [caseDetailTab, setCaseDetailTab] = useState<'overview' | 'notices' | 'tasks' | 'notes' | 'documents' | 'billing' | 'whatsapp'>('overview');

  // Lock background window scroll when Case Details drawer is open
  useEffect(() => {
    if (selectedCase) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCase]);

  // Edit Case Details State
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [editCaseForm, setEditCaseForm] = useState<Partial<CaseFile>>({});

  // WhatsApp Tab State & Templates
  const [waTemplateType, setWaTemplateType] = useState<'hearing' | 'notice' | 'invoice' | 'stay' | 'custom'>('hearing');
  const [waCustomMessage, setWaCustomMessage] = useState('');
  const [waCopiedNotice, setWaCopiedNotice] = useState(false);

  // PDF Invoice Modal State
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);

  // Case Detail Hearing Form States
  const [isEditingCaseHearing, setIsEditingCaseHearing] = useState(false);
  const [caseHearingForm, setCaseHearingForm] = useState(() => ({
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    time: '10:00 AM',
    forum: 'Islamabad High Court (IHC)' as LegalForum,
    bench: 'Division Bench - Islamabad High Court',
    purpose: 'Arguments on Interlocutory Stay Order Application',
    counselAssigned: 'Mr. Rahim Nawaz Khan Abbasi',
    previousHearingDate: '',
    previousHearingOutcome: ''
  }));

  const handleStartEditHearing = () => {
    if (selectedCase) {
      setCaseHearingForm({
        date: selectedCase.nextHearingDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        time: '10:00 AM',
        forum: selectedCase.forum || 'Islamabad High Court (IHC)',
        bench: 'Honourable High Court Bench',
        purpose: selectedCase.nextHearingPurpose || 'Cause List Arguments & Proceedings',
        counselAssigned: selectedCase.assignedCounsel || 'Mr. Rahim Nawaz Khan Abbasi',
        previousHearingDate: selectedCase.nextHearingDate || new Date().toISOString().split('T')[0],
        previousHearingOutcome: ''
      });
    }
    setIsEditingCaseHearing(true);
  };

  const handleSaveCaseHearing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    updateCaseHearing(selectedCase.id, {
      nextHearingDate: caseHearingForm.date,
      nextHearingPurpose: caseHearingForm.purpose,
      previousHearingDate: caseHearingForm.previousHearingDate,
      previousHearingOutcome: caseHearingForm.previousHearingOutcome,
      time: caseHearingForm.time,
      bench: caseHearingForm.bench,
      forum: caseHearingForm.forum,
      counselAssigned: caseHearingForm.counselAssigned
    });

    setSelectedCase((prev) =>
      prev
        ? {
            ...prev,
            nextHearingDate: caseHearingForm.date,
            nextHearingPurpose: caseHearingForm.purpose,
            forum: caseHearingForm.forum,
            assignedCounsel: caseHearingForm.counselAssigned
          }
        : null
    );

    setIsEditingCaseHearing(false);
    alert('Hearing schedule and previous hearing record updated successfully!');
  };

  // Case File Details Edit Handlers
  const handleStartEditCase = () => {
    if (selectedCase) {
      const existingCred = clientCredentials.find(
        (c) => c.clientId === selectedCase.clientId || (c.email && c.email.toLowerCase() === selectedCase.clientLoginEmail?.toLowerCase())
      );
      setEditCaseForm({
        caseTitle: selectedCase.caseTitle,
        caseRef: selectedCase.caseRef,
        taxYear: selectedCase.taxYear,
        forum: selectedCase.forum,
        status: selectedCase.status,
        riskLevel: selectedCase.riskLevel,
        demandAmountPkr: selectedCase.demandAmountPkr,
        savedAmountPkr: selectedCase.savedAmountPkr,
        assignedCounsel: selectedCase.assignedCounsel,
        summary: selectedCase.summary,
        nextHearingDate: selectedCase.nextHearingDate || '',
        nextHearingPurpose: selectedCase.nextHearingPurpose || '',
        clientLoginEmail: existingCred?.email || selectedCase.clientLoginEmail || '',
        clientLoginPassword: existingCred?.password || selectedCase.clientLoginPassword || ''
      });
      setIsEditingCase(!isEditingCase);
    }
  };

  const handleSaveCaseEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    updateCase(selectedCase.id, editCaseForm);
    if (editCaseForm.clientLoginEmail && editCaseForm.clientLoginPassword) {
      addClientCredential({
        clientId: selectedCase.clientId,
        clientName: selectedCase.clientName,
        email: editCaseForm.clientLoginEmail,
        password: editCaseForm.clientLoginPassword
      });
    }
    setSelectedCase((prev) => (prev ? { ...prev, ...editCaseForm } : null));
    setIsEditingCase(false);
    alert('Case details and client portal access credentials updated successfully!');
  };

  // WhatsApp Message Generator
  const getFormattedWhatsAppText = () => {
    if (!selectedCase) return '';
    const caseInvoices = invoices.filter((i) => i.caseId === selectedCase.id);
    const latestInvoice = caseInvoices[0];

    switch (waTemplateType) {
      case 'hearing':
        return `*Rahim Law Associates - ADVOCATES & TAX CONSULTANTS*\n📍 *Executive Suite 402, Judicial Heights, Sector F-7/2, Islamabad*\n\nAssalamu Alaikum *${selectedCase.clientName}*,\n\nThis is an official court hearing notification regarding your tax litigation file:\n📁 *Case File:* ${selectedCase.caseTitle}\n🏛️ *Ref / CNO:* ${selectedCase.caseRef}\n⚖️ *Legal Forum:* ${selectedCase.forum}\n\n📅 *Next Court Hearing:* ${selectedCase.nextHearingDate || 'Upcoming Schedule'}\n⏰ *Time:* 10:00 AM\n👤 *Assigned Counsel:* ${selectedCase.assignedCounsel}\n🎯 *Purpose:* ${selectedCase.nextHearingPurpose || 'Cause List Arguments & Proceedings'}\n\n📌 *Instructions for Client:* Please ensure all supporting income tax/sales tax records are updated. Reply to this message if you require a preliminary briefing with your advocate before the hearing.\n\nRegards,\n*Advocate Desk - Rahim Law Associates*\n📞 Contact: +92 345 5061906`;

      case 'notice':
        return `*Rahim Law Associates - ADVOCATES & TAX CONSULTANTS*\n📍 *Islamabad High Court & FBR Tax Practice*\n\nAssalamu Alaikum *${selectedCase.clientName}*,\n\nImportant update regarding your FBR tax notice compliance:\n📁 *Case File:* ${selectedCase.caseTitle}\n📄 *Notice Ref:* ${selectedCase.caseRef}\n🏛️ *Tax Forum:* ${selectedCase.forum}\n📅 *Tax Year:* ${selectedCase.taxYear}\n\n⚠️ *Disputed Tax Demand:* Rs. ${(selectedCase.demandAmountPkr / 100000).toFixed(2)} Lakh\n⏳ *Reply Due Date:* ${selectedCase.nextHearingDate || 'Within 7 Days'}\n\n⚖️ *Legal Status:* Our advocate team has prepared the comprehensive rebuttal and stay petition under the Income Tax Ordinance. No coercive action will be taken by FBR during pending stay.\n\nRegards,\n*Advocate Desk - Rahim Law Associates*`;

      case 'invoice':
        return `*Rahim Law Associates - ADVOCATES & TAX CONSULTANTS*\n📍 *Sector F-7/2, Islamabad*\n\nAssalamu Alaikum *${selectedCase.clientName}*,\n\nFee Remittance Statement for legal services rendered:\n📄 *Invoice Ref:* ${latestInvoice ? latestInvoice.invoiceNumber : 'INV-2026-RLA'}\n📁 *Case:* ${selectedCase.caseTitle}\n💰 *Total Payable Amount:* Rs. ${latestInvoice ? latestInvoice.totalAmountPkr.toLocaleString() : '250,000'} PKR\n\n🏦 *Bank Transfer Details:*\n• *Bank Name:* Habib Bank Limited (HBL)\n• *Account Title:* Rahim Law Associates Advocates\n• *IBAN:* PK36HABB0001234567890123\n• *Branch:* G-8 Markaz Branch, Islamabad\n\nPlease share the payment transaction receipt/screenshot here upon remittance so we can issue your official stamped tax clearance receipt.\n\nThank you,\n*Accounts Dept - Rahim Law Associates*`;

      case 'stay':
        return `*Rahim Law Associates - ADVOCATES & TAX CONSULTANTS*\n📍 *High Court & Appellate Litigation Desk*\n\nAssalamu Alaikum *${selectedCase.clientName}*,\n\n🎉 *FAVORABLE COURT ORDER UPDATE:*\nWe are pleased to inform you that the Honourable Court has granted an *Interlocutory Stay Order* in your case:\n\n📁 *Case Title:* ${selectedCase.caseTitle}\n🏛️ *Court Forum:* ${selectedCase.forum}\n🛡️ *Relief Granted:* FBR tax recovery notice stayed and bank attachment restrained until final decision.\n💵 *Tax Amount Protected:* Rs. ${(selectedCase.demandAmountPkr / 100000).toFixed(2)} Lakh\n\nYou can view and download the certified copy of the court order from your online Rahim Law Associates Client Portal.\n\nWarm regards,\n*Mr. Rahim Nawaz Khan Abbasi*\nSenior Advocate - Rahim Law Associates`;

      case 'custom':
      default:
        return `*Rahim Law Associates - ADVOCATES & TAX CONSULTANTS*\n📍 *Islamabad High Court Practice*\n\nAssalamu Alaikum *${selectedCase.clientName}*,\n\n${waCustomMessage || `Regarding your tax file *${selectedCase.caseTitle}* (${selectedCase.caseRef}), our legal team has updated your case status to: *${selectedCase.status}*.`}\n\nPlease feel free to contact us if you need further clarification.\n\nBest regards,\n*Rahim Law Associates Team*`;
    }
  };

  const handleSendWhatsAppDirect = () => {
    if (!selectedCase) return;
    const client = clients.find((c) => c.id === selectedCase.clientId);
    const phone = client?.phone || '+92 300 1234567';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('03') ? '92' + cleanPhone.slice(1) : cleanPhone;

    const text = getFormattedWhatsAppText();
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  const handleCopyWhatsAppText = () => {
    const text = getFormattedWhatsAppText();
    navigator.clipboard.writeText(text);
    setWaCopiedNotice(true);
    setTimeout(() => setWaCopiedNotice(false), 2500);
  };

  const handleLogWhatsAppNotification = () => {
    if (!selectedCase) return;
    const client = clients.find((c) => c.id === selectedCase.clientId);
    const phone = client?.phone || '+92 300 1234567';

    sendNotification({
      clientId: selectedCase.clientId,
      clientName: selectedCase.clientName,
      caseId: selectedCase.id,
      type: 'WhatsApp',
      recipientPhoneOrEmail: phone,
      title: `WhatsApp Alert (${waTemplateType.toUpperCase()}): ${selectedCase.caseRef}`,
      message: getFormattedWhatsAppText()
    });

    alert('Notification logged successfully in dispatch history!');
  };

  // Case Detail Inline Form States
  const [inlineTask, setInlineTask] = useState(() => ({
    title: '',
    assignedTo: 'Mr. Rahim Nawaz Khan Abbasi',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    priority: 'Urgent' as const
  }));

  const [inlineNote, setInlineNote] = useState({
    text: '',
    author: 'Mr. Rahim Nawaz Khan Abbasi',
    isPrivileged: true
  });

  const [inlineDoc, setInlineDoc] = useState({
    title: '',
    category: 'FBR Notice' as const
  });

  const [inlineInvoice, setInlineInvoice] = useState(() => ({
    serviceDescription: 'Legal Retainer & High Court Case Representation',
    retainerFeePkr: 250000,
    hearingFeePkr: 50000,
    salesTaxPkr: 0,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  }));

  // Comprehensive New Case Form Inputs
  const [newCaseData, setNewCaseData] = useState(() => ({
    title: '',
    clientId: clients[0]?.id || '',
    cnoNumber: '',
    sectionCode: '122(5A)',
    assignedCounsel: 'Mr. Rahim Nawaz Khan Abbasi',
    forum: 'Islamabad High Court (IHC)' as LegalForum,
    taxYear: 'Tax Year 2025',
    status: 'Notice Received' as CaseStatus,
    riskLevel: 'High' as RiskLevel,
    demandAmountPkr: 5000000,
    savedAmountPkr: 0,
    nextHearingDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    nextHearingTime: '10:00 AM',
    nextHearingBench: 'Division Bench - Islamabad High Court',
    nextHearingPurpose: 'Arguments on Interlocutory Stay Order Application',
    summary: '',
    initialNote: '',
    initialTask: '',
    clientLoginEmail: '',
    clientLoginPassword: ''
  }));

  const [isAddingNewClientInCase, setIsAddingNewClientInCase] = useState(false);
  const [newCaseClientDraft, setNewCaseClientDraft] = useState({
    name: '',
    businessName: '',
    ntn: '',
    cnic: '',
    phone: '',
    email: '',
    category: 'Corporate' as const,
    city: 'Islamabad'
  });

  const [newClientData, setNewClientData] = useState({
    name: '',
    businessName: '',
    cnic: '',
    ntn: '',
    category: 'Corporate' as const,
    phone: '',
    email: '',
    city: 'Islamabad',
    registeredAddress: '',
    status: 'Active' as const,
    clientLoginEmail: '',
    clientLoginPassword: 'Password123!'
  });


  const [newNoticeData, setNewNoticeData] = useState(() => ({
    cnoNumber: '',
    caseId: cases[0]?.id || '',
    clientId: clients[0]?.id || '',
    sectionCode: '122(5A)',
    noticeTitle: '',
    issuingOfficer: 'Deputy Commissioner Inland Revenue, RTO Islamabad',
    taxYear: '2025',
    dateReceived: new Date().toISOString().split('T')[0],
    dueDate: '',
    disputedAmountPkr: 2500000,
    status: 'Pending Reply' as const,
    summary: ''
  }));

  const [newDocData, setNewDocData] = useState({
    caseId: cases[0]?.id || '',
    clientId: clients[0]?.id || '',
    title: '',
    category: 'FBR Notice' as const,
    fileSize: '1.5 MB',
    uploadedBy: 'Advocate Desk',
    fileType: 'pdf' as const,
    downloadUrl: '#',
    isClientVisible: true
  });

  const [newInvoiceData, setNewInvoiceData] = useState(() => ({
    caseId: cases[0]?.id || '',
    clientId: cases[0]?.clientId || clients[0]?.id || '',
    serviceDescription: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    retainerFeePkr: 250000,
    hearingFeePkr: 50000,
    salesTaxPkr: 0,
    totalAmountPkr: 300000,
    paidAmountPkr: 0,
    status: 'Pending' as const
  }));

  const [newHearingData, setNewHearingData] = useState(() => ({
    caseId: cases[0]?.id || '',
    caseTitle: '',
    clientName: '',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '10:00 AM',
    forum: 'Islamabad High Court (IHC)' as LegalForum,
    bench: 'Honourable High Court Bench',
    counselAssigned: 'Mr. Rahim Nawaz Khan Abbasi',
    purpose: '',
    priority: 'High' as const,
    previousHearingDate: '',
    previousHearingOutcome: ''
  }));

  const [notifData, setNotifData] = useState({
    clientId: clients[0]?.id || '',
    type: 'WhatsApp' as const,
    recipientPhoneOrEmail: clients[0]?.phone || '',
    title: 'Court Hearing Alert',
    message: 'Dear Client, your upcoming tax hearing is scheduled at High Court Islamabad. - Rahim Law Associates'
  });

  // Submit Handlers
  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();

    let targetClientId = newCaseData.clientId || clients[0]?.id || '';
    let createdNewClient: Client | undefined = undefined;

    if (isAddingNewClientInCase) {
      const trimmedName = newCaseClientDraft.name.trim();
      if (!trimmedName) return;

      const resolvedEmail = (newCaseClientDraft.email || newCaseData.clientLoginEmail || '').trim();
      const resolvedPassword = (newCaseData.clientLoginPassword || '').trim();

      createdNewClient = addClient(
        {
          name: trimmedName,
          businessName: newCaseClientDraft.businessName.trim(),
          cnic: newCaseClientDraft.cnic.trim() || 'N/A',
          ntn: newCaseClientDraft.ntn.trim() || 'Pending',
          category: newCaseClientDraft.category,
          phone: newCaseClientDraft.phone.trim(),
          email: resolvedEmail,
          city: newCaseClientDraft.city.trim() || 'Islamabad',
          registeredAddress: '',
          status: 'Active' as const
        },
        resolvedEmail && resolvedPassword ? resolvedEmail : undefined,
        resolvedEmail && resolvedPassword ? resolvedPassword : undefined
      );
      targetClientId = createdNewClient.id;
    }

    const created = addCase({
      title: newCaseData.title,
      clientId: targetClientId,
      clientRecord: createdNewClient,
      assignedCounsel: newCaseData.assignedCounsel,
      forum: newCaseData.forum,
      taxYear: newCaseData.taxYear,
      status: newCaseData.status,
      riskLevel: newCaseData.riskLevel,
      demandAmountPkr: newCaseData.demandAmountPkr,
      summary: `${newCaseData.summary} ${
        newCaseData.cnoNumber ? `[CNO No: ${newCaseData.cnoNumber}, Sec: ${newCaseData.sectionCode}]` : ''
      }`,
      nextHearingDate: newCaseData.nextHearingDate || undefined,
      nextHearingPurpose: newCaseData.nextHearingPurpose || undefined,
      clientLoginEmail: newCaseData.clientLoginEmail || newCaseClientDraft.email || '',
      clientLoginPassword: newCaseData.clientLoginPassword
    });

    if (created && newCaseData.initialNote) {
      addNote({
        caseId: created.id,
        author: newCaseData.assignedCounsel,
        text: newCaseData.initialNote,
        isPrivileged: true
      });
    }

    if (created && newCaseData.initialTask) {
      addTask({
        caseId: created.id,
        title: newCaseData.initialTask,
        assignedTo: newCaseData.assignedCounsel,
        dueDate: newCaseData.nextHearingDate || new Date().toISOString().split('T')[0],
        priority: 'Urgent'
      });
    }

    setShowAddCaseModal(false);
    setIsAddingNewClientInCase(false);
    setNewCaseClientDraft({
      name: '',
      businessName: '',
      ntn: '',
      cnic: '',
      phone: '',
      email: '',
      category: 'Corporate' as const,
      city: 'Islamabad'
    });
    alert(`Tax Litigation Case File ${created.caseRef} registered successfully!${
      createdNewClient ? ` New client "${createdNewClient.name}" added.` : ''
    } ${
      newCaseData.clientLoginEmail ? `Client Portal sign-in credentials created for ${newCaseData.clientLoginEmail}.` : ''
    }`);
    setNewCaseData({
      title: '',
      clientId: createdNewClient?.id || clients[0]?.id || '',
      cnoNumber: '',
      sectionCode: '122(5A)',
      forum: 'Islamabad High Court (IHC)' as LegalForum,
      taxYear: 'Tax Year 2025',
      status: 'Notice Received' as CaseStatus,
      riskLevel: 'High' as RiskLevel,
      assignedCounsel: 'Mr. Rahim Nawaz Khan Abbasi',
      demandAmountPkr: 5000000,
      savedAmountPkr: 0,
      nextHearingDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      nextHearingTime: '10:00 AM',
      nextHearingBench: 'Division Bench - Islamabad High Court',
      nextHearingPurpose: 'Arguments on Interlocutory Stay Order Application',
      summary: '',
      initialNote: '',
      initialTask: '',
      clientLoginEmail: '',
      clientLoginPassword: ''
    });
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const loginEmail = newClientData.email || newClientData.clientLoginEmail;
    const loginPass = newClientData.clientLoginPassword || 'Password123!';
    
    const createdClient = addClient(newClientData, loginEmail, loginPass);
    setShowAddClientModal(false);
    alert(`Client Profile created for ${createdClient.name}! Client Portal sign-in credentials created: Email: ${loginEmail}, Password: ${loginPass}`);
  };


  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    addNotice(newNoticeData);
    setShowAddNoticeModal(false);
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCaseId = newDocData.caseId || cases[0]?.id || '';
    const selCase = cases.find((c) => c.id === targetCaseId);
    const targetClientId = selCase ? selCase.clientId : (newDocData.clientId || clients[0]?.id || '');

    const createdDoc = addDocument({
      ...newDocData,
      caseId: targetCaseId,
      clientId: targetClientId
    });

    alert(`Document "${createdDoc.title || 'Legal Document'}" uploaded & synced to Case File [${selCase?.caseRef || 'REF'}] successfully!`);

    setNewDocData({
      caseId: cases[0]?.id || '',
      clientId: cases[0]?.clientId || clients[0]?.id || '',
      title: '',
      category: 'FBR Notice',
      fileSize: '1.5 MB',
      uploadedBy: 'Mr. Rahim Nawaz Khan Abbasi',
      fileType: 'pdf',
      downloadUrl: '#',
      isClientVisible: true
    });

    setShowAddDocModal(false);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const selCase = cases.find((c) => c.id === newInvoiceData.caseId) || cases[0];
    const targetCaseId = selCase ? selCase.id : newInvoiceData.caseId;
    const targetClientId = selCase ? selCase.clientId : (clients[0]?.id || '');
    const totalPkr = (newInvoiceData.retainerFeePkr || 0) + (newInvoiceData.hearingFeePkr || 0);

    const created = addInvoice({
      caseId: targetCaseId,
      clientId: targetClientId,
      serviceDescription: newInvoiceData.serviceDescription || 'Legal Representation & Retainer Fees',
      issueDate: newInvoiceData.issueDate || new Date().toISOString().split('T')[0],
      dueDate: newInvoiceData.dueDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      retainerFeePkr: newInvoiceData.retainerFeePkr,
      hearingFeePkr: newInvoiceData.hearingFeePkr,
      salesTaxPkr: 0,
      totalAmountPkr: totalPkr,
      paidAmountPkr: 0,
      status: 'Pending'
    });

    setShowAddInvoiceModal(false);
    alert(`Invoice ${created.invoiceNumber} created successfully!`);
  };

  const handleCreateHearing = (e: React.FormEvent) => {
    e.preventDefault();
    const selCase = cases.find((c) => c.id === newHearingData.caseId);
    addHearing({
      ...newHearingData,
      caseTitle: selCase ? selCase.caseTitle : 'Tax Case Hearing',
      clientName: selCase ? selCase.clientName : 'Client'
    });

    const calUrl = buildGoogleCalendarUrl({
      title: `Tax Hearing: ${selCase ? selCase.caseTitle : 'Court Hearing'}`,
      details: `Client: ${selCase ? selCase.clientName : 'Client'}\nPurpose: ${newHearingData.purpose}\nBench: ${newHearingData.bench}\nCounsel: ${newHearingData.counselAssigned}`,
      location: newHearingData.forum,
      startDate: newHearingData.date,
      startTime: newHearingData.time || '10:00'
    });

    setShowAddHearingModal(false);

    if (window.confirm('Hearing successfully scheduled! Open Google Calendar to sync event now?')) {
      window.open(calUrl, '_blank');
    }
  };

  const handleSendNotif = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === notifData.clientId);
    sendNotification({
      ...notifData,
      clientName: client ? client.name : 'Client'
    });

    // Also trigger native WhatsApp link
    if (notifData.type === 'WhatsApp') {
      const cleanPhone = notifData.recipientPhoneOrEmail.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(notifData.message)}`;
      window.open(waUrl, '_blank');
    }

    setShowSendNotifModal(false);
  };

  // Inline Handlers for Selected Case Drawer
  const handleAddInlineTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !inlineTask.title) return;
    addTask({
      caseId: selectedCase.id,
      title: inlineTask.title,
      assignedTo: inlineTask.assignedTo,
      dueDate: inlineTask.dueDate,
      priority: inlineTask.priority
    });
    setInlineTask({
      title: '',
      assignedTo: 'Adv. Jamshaid Khan',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      priority: 'Urgent'
    });
  };

  const handleAddInlineNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !inlineNote.text) return;
    addNote({
      caseId: selectedCase.id,
      author: inlineNote.author,
      text: inlineNote.text,
      isPrivileged: inlineNote.isPrivileged
    });
    setInlineNote({
      text: '',
      author: 'Mr. Rahim Nawaz Khan Abbasi',
      isPrivileged: true
    });
  };

  const handleAddInlineDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !inlineDoc.title) return;
    addDocument({
      caseId: selectedCase.id,
      clientId: selectedCase.clientId,
      title: inlineDoc.title,
      category: inlineDoc.category,
      fileSize: '1.8 MB',
      uploadedBy: 'Advocate Desk',
      fileType: 'pdf',
      downloadUrl: '#',
      isClientVisible: true
    });
    setInlineDoc({ title: '', category: 'FBR Notice' });
  };

  const handleAddInlineInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    const client = clients.find((c) => c.id === selectedCase.clientId);
    const totalPkr = inlineInvoice.retainerFeePkr + inlineInvoice.hearingFeePkr;

    addInvoice({
      caseId: selectedCase.id,
      clientId: selectedCase.clientId,
      serviceDescription: inlineInvoice.serviceDescription,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: inlineInvoice.dueDate,
      retainerFeePkr: inlineInvoice.retainerFeePkr,
      hearingFeePkr: inlineInvoice.hearingFeePkr,
      salesTaxPkr: 0,
      totalAmountPkr: totalPkr,
      paidAmountPkr: 0,
      status: 'Pending'
    });

    setInlineInvoice({
      serviceDescription: 'Legal Retainer & Representation',
      retainerFeePkr: 200000,
      hearingFeePkr: 50000,
      salesTaxPkr: 0,
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
    });
  };

  const handleSendWhatsAppCaseReminder = () => {
    if (!selectedCase) return;
    const client = clients.find((c) => c.id === selectedCase.clientId);
    const phone = client?.phone || '+92 300 1234567';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const msg = `Assalamu Alaikum ${selectedCase.clientName},\n\nThis is an official hearing notice from Rahim Law Associates regarding your tax file *${selectedCase.caseTitle}* (${selectedCase.caseRef}).\n\n📌 *Forum:* ${selectedCase.forum}\n📅 *Next Hearing Date:* ${selectedCase.nextHearingDate || 'Upcoming Schedule'}\n⚖️ *Lead Counsel:* ${selectedCase.assignedCounsel}\n🎯 *Purpose:* ${selectedCase.nextHearingPurpose || 'Cause list hearing'}\n\nPlease keep your tax documentation ready. Reply to this message if you have any questions.`;

    sendNotification({
      clientId: selectedCase.clientId,
      clientName: selectedCase.clientName,
      caseId: selectedCase.id,
      type: 'WhatsApp',
      recipientPhoneOrEmail: phone,
      title: `Hearing Alert: ${selectedCase.caseRef}`,
      message: msg
    });

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddCaseToGoogleCalendar = () => {
    if (!selectedCase) return;
    const url = buildGoogleCalendarUrl({
      title: `Tax Court Hearing: ${selectedCase.caseTitle}`,
      details: `Client: ${selectedCase.clientName}\nCase Ref: ${selectedCase.caseRef}\nCounsel: ${selectedCase.assignedCounsel}\nPurpose: ${selectedCase.nextHearingPurpose || 'Court Proceedings'}`,
      location: selectedCase.forum,
      startDate: selectedCase.nextHearingDate || new Date().toISOString().split('T')[0],
      startTime: '10:00'
    });
    window.open(url, '_blank');
  };

  // Combine explicit hearings with cases that have a nextHearingDate scheduled
  const allSyncedHearings = [
    ...hearings,
    ...cases
      .filter((c) => c.nextHearingDate && !hearings.some((h) => h.caseId === c.id && h.date === c.nextHearingDate))
      .map((c) => ({
        id: `case-h-${c.id}`,
        caseId: c.id,
        caseTitle: c.caseTitle,
        clientName: c.clientName,
        date: c.nextHearingDate!,
        time: '10:00 AM',
        forum: c.forum,
        bench: 'Honourable High Court / Appellate Bench',
        counselAssigned: c.assignedCounsel,
        purpose: c.nextHearingPurpose || 'Cause List Hearing Proceedings',
        priority: c.riskLevel === 'Critical' ? ('High' as const) : ('Medium' as const)
      }))
  ];

  // Filter Calendar Hearings
  const calendarHearings = selectedCalendarDate
    ? allSyncedHearings.filter((h) => h.date === selectedCalendarDate)
    : allSyncedHearings;

  // Render Days for Dynamic Calendar Grid
  const calendarYear = calendarCurrentDate.getFullYear();
  const calendarMonth = calendarCurrentDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const mStr = (calendarMonth + 1).toString().padStart(2, '0');
    const dStr = dayNum.toString().padStart(2, '0');
    const dateStr = `${calendarYear}-${mStr}-${dStr}`;
    const dayHearings = allSyncedHearings.filter((h) => h.date === dateStr);
    return { dayNum, dateStr, dayHearings };
  });

  // Metrics
  const pendingNoticesCount = notices.filter((n) => n.status === 'Pending Reply').length;

  if (adminAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-10 h-10 border-4 border-[#612912] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-600">Verifying Admin Account...</p>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#452415]/20 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="relative w-[240px] h-[75px] mx-auto">
              <img
                src="https://i.ibb.co/xS4KS0LC/Untitled-design-2.png"
                alt="Rahim Law Associates Logo"
                className="w-full h-full object-contain object-center mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="bg-[#612912]/10 text-[#612912] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Rahim Law Associates Admin Portal
            </span>
            <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">
              Advocate Admin Authentication
            </h1>
            <p className="text-xs text-gray-600">
              Restricted Portal for Senior Advocates & Partners of Rahim Law Associates. Please sign in with your authorized account.
            </p>
          </div>

          {adminAuthError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl font-medium space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Access Denied</span>
              </div>
              <p>{adminAuthError}</p>
            </div>
          )}

          {adminAuthSuccessMessage && (
            <div className="bg-[#612912]/5 border border-[#612912]/20 text-[#452415] text-xs p-3.5 rounded-2xl font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#612912] shrink-0 mt-0.5" />
              <span>{adminAuthSuccessMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdminGoogleSignIn}
            className="w-full bg-[#612912] hover:bg-[#452415] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-3 cursor-pointer border border-[#E5B842]/40/30"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span className="text-white text-xs sm:text-sm">Sign in with Authorized Google Account</span>
          </button>

          {/* OR DIVIDER */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
              or sign in with email & password
            </span>
          </div>

          {/* EMAIL & PASSWORD SIGN IN FORM */}
          <form onSubmit={handleAdminEmailPasswordSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="Enter authorized email address"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleAdminPasswordReset}
                  className="text-[11px] text-[#612912] hover:text-[#34160B] font-semibold hover:underline cursor-pointer"
                >
                  Forgot / Set Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={adminShowPassword ? 'text' : 'password'}
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder={adminIsRegisterMode ? 'Set a password (min 6 chars)' : '••••••••'}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setAdminShowPassword(!adminShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title={adminShowPassword ? 'Hide password' : 'Show password'}
                >
                  {adminShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1A1A1A] hover:bg-[#612912] text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-gray-800"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>
                {adminIsRegisterMode ? 'Register Password & Sign In' : 'Sign In with Email & Password'}
              </span>
            </button>

            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setAdminIsRegisterMode(!adminIsRegisterMode);
                  setAdminAuthError(null);
                  setAdminAuthSuccessMessage(null);
                }}
                className="text-[11px] text-gray-500 hover:text-[#452415] font-medium hover:underline cursor-pointer"
              >
                {adminIsRegisterMode
                  ? 'Already set your password? Return to standard Sign In'
                  : 'First time signing in with password? Create your password here'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Case Management', icon: Briefcase, badge: cases.length },
    { id: 'calendar', label: 'Hearing Calendar', icon: CalendarIcon, badge: hearings.length },
    { id: 'documents', label: 'Document Vault', icon: FolderOpen },
    { id: 'tasks', label: 'Tasks & Internal Notes', icon: CheckSquare },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
    { id: 'practiceAreas', label: 'Practice Areas', icon: Scale, badge: practiceAreas?.length || 0 },
    { id: 'team', label: 'Our Team', icon: Users, badge: teamMembers?.length || 0 },
    { id: 'reviews', label: 'Client Reviews', icon: MessageSquareQuote, badge: reviews?.length || 0 },
    { id: 'insights', label: 'Legal Insights', icon: BookOpen, badge: insights?.length || 0 }
  ];

  const activeTabObj = navMenuItems.find((m) => m.id === activeTab) || navMenuItems[0];

  return (
    <div className="admin-portal-root font-nexa min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col md:flex-row w-full max-w-full overflow-x-hidden">
      {/* --- MOBILE APP STICKY TOP HEADER --- */}
      <header className="md:hidden sticky top-0 z-40 bg-[#612912] text-white px-4 py-3 flex items-center justify-between border-b border-[#452415] shadow-md">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2 text-xs font-extrabold cursor-pointer border border-white/15"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5 text-[#E5B842]" />
          <span className="whitespace-nowrap">Menu</span>
        </button>

        <div className="text-center px-2">
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#E5B842] block">
            Rahim Law Associates
          </span>
          <h2 className="text-xs font-heading font-extrabold text-white truncate max-w-[150px] sm:max-w-[200px]">
            {activeTabObj.label}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCaseModal(true)}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-[#E5B842] hover:bg-[#D4A533] text-[#1A1A1A] font-extrabold text-xs flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Case</span>
        </button>
      </header>

      {/* --- ANIMATED MOBILE SLIDE-IN SLIDE-OUT DRAWER --- */}
      {/* Backdrop Overlay */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Container with Slide Animation */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-[#612912] text-white z-50 p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto space-y-5 pr-1">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[#452415] pb-4">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#E5B842] block">
                Chambers Mobile App
              </span>
              <h2 className="text-base font-heading font-extrabold text-white">Rahim Law Associates</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
              aria-label="Close Navigation Drawer"
            >
              <X className="w-5 h-5 text-[#E5B842]" />
            </button>
          </div>

          {/* Drawer Nav Items */}
          <nav className="space-y-1.5">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    isActive
                      ? 'bg-[#E5B842] text-[#1A1A1A] shadow-md font-extrabold scale-[1.02]'
                      : 'text-amber-100/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
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

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-[#452415]/60 text-xs text-[#E5B842] space-y-3 shrink-0">
          <div>
            <div className="font-bold text-white text-xs">Advocate Chambers Admin</div>
            <div className="text-[10px] text-[#E5B842] font-mono truncate">{adminUser?.email || 'Authorized Advocate Admin'}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleAdminSignOut();
            }}
            className="w-full min-h-[44px] bg-red-600/90 hover:bg-red-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* --- DESKTOP SIDEBAR NAVIGATION --- */}
      <aside className="hidden md:flex w-64 bg-[#612912] text-white shrink-0 border-r border-[#452415] p-5 flex-col justify-between min-h-screen">
        <div>
          <div className="mb-6 px-1 pt-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#E5B842] block">
              Case Management System
            </span>
            <h2 className="text-lg font-heading font-extrabold text-white">Rahim Law Associates Chambers Desk</h2>
          </div>

          <nav className="space-y-1.5">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
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
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
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

        <div className="pt-4 border-t border-[#452415]/60 text-[11px] text-[#E5B842] space-y-2.5">
          <div>
            <div className="font-bold text-white">Rahim Law Associates Advocates</div>
            <div className="text-[10px] text-[#E5B842] font-mono truncate">{adminUser?.email || 'Authorized Advocate Admin'}</div>
          </div>
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="w-full bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 font-sans">
            {/* 1. Executive Desk Header & Quick Action Launch Hub */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#452415]/15 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-extrabold text-[#612912] bg-[#E5B842]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Rahim Law Associates • Executive Desk
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      System Online & Synced
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] tracking-tight">
                    Advocate Control & Analytics Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5A6275] mt-1 max-w-2xl leading-relaxed">
                    At-a-glance overview of active High Court writs, ATIR appeals, FBR statutory notice deadlines, cause list court hearings & fee receivables.
                  </p>
                </div>

                {/* Primary Launch Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddCaseModal(true)}
                    className="flex-1 sm:flex-initial bg-[#E5B842] hover:bg-[#D4A533] text-[#1A1A1A] font-extrabold px-4 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border border-[#E5B842]/40"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Register Case File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewDocData((prev) => ({
                        ...prev,
                        caseId: prev.caseId || cases[0]?.id || '',
                        clientId: prev.clientId || cases[0]?.clientId || clients[0]?.id || ''
                      }));
                      setShowAddDocModal(true);
                    }}
                    className="flex-1 sm:flex-initial bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-4 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#E5B842] shrink-0" />
                    <span>Upload Case Brief</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewInvoiceData((prev) => ({
                        ...prev,
                        caseId: prev.caseId || cases[0]?.id || '',
                        clientId: prev.clientId || cases[0]?.clientId || clients[0]?.id || ''
                      }));
                      setShowAddInvoiceModal(true);
                    }}
                    className="flex-1 sm:flex-initial bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-4 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-[#E5B842] shrink-0" />
                    <span>Issue Fee Invoice</span>
                  </button>
                </div>
              </div>

              {/* Quick Navigation & Shortcut Bar */}
              <div className="pt-4 border-t border-gray-100 flex items-center gap-2.5 overflow-x-auto text-xs font-bold text-[#452415] scrollbar-none">
                <span className="text-gray-400 text-[10px] uppercase tracking-wider font-mono shrink-0 mr-1">
                  Quick Actions:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddNoticeModal(true)}
                  className="bg-[#FAF8F5] hover:bg-[#612912]/10 text-[#452415] border border-gray-200 hover:border-[#612912]/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Log FBR Notice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHearingModal(true)}
                  className="bg-[#FAF8F5] hover:bg-[#612912]/10 text-[#452415] border border-gray-200 hover:border-[#612912]/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>Schedule Cause List Hearing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="bg-[#FAF8F5] hover:bg-[#612912]/10 text-[#452415] border border-gray-200 hover:border-[#612912]/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#452415]" />
                  <span>Document Vault ({documents.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className="bg-[#FAF8F5] hover:bg-[#612912]/10 text-[#452415] border border-gray-200 hover:border-[#612912]/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#452415]" />
                  <span>Billing Ledger ({invoices.length})</span>
                </button>
              </div>
            </div>

            {/* 2. Key Performance Indicators (4 Cards Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Active Cases */}
              <div 
                onClick={() => setActiveTab('cases')}
                className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm hover:border-[#612912] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center text-[11px] font-bold text-[#5A6275] uppercase tracking-wider">
                  <span>Active Litigation Files</span>
                  <div className="p-2 rounded-xl bg-[#612912]/10 text-[#612912] group-hover:bg-[#612912] group-hover:text-white transition-colors">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-2">
                  {cases.length} Files
                </div>
                <div className="text-xs text-[#612912] font-semibold mt-1 flex items-center justify-between">
                  <span>Demand Protected:</span>
                  <span className="font-extrabold">Rs. {(cases.reduce((a, c) => a + c.demandAmountPkr, 0) / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="text-[10px] text-[#5A6275] mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span>High Court, ATIR & FBR</span>
                  <span className="text-[#612912] font-bold group-hover:underline">Manage Cases →</span>
                </div>
              </div>

              {/* Card 2: FBR Notice Compliance */}
              <div
                onClick={() => setShowNoticesModal(true)}
                className="bg-white p-5 rounded-3xl border border-red-200 hover:border-red-500 shadow-sm transition-all cursor-pointer group hover:shadow-md"
                title="Click to view all pending FBR notice replies"
              >
                <div className="flex justify-between items-center text-[11px] font-bold text-[#5A6275] uppercase tracking-wider">
                  <span>FBR Notice Compliance</span>
                  <div className="p-2 rounded-xl bg-red-100 text-red-700 group-hover:bg-red-700 group-hover:text-white transition-colors">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-red-700 mt-2 flex items-center justify-between">
                  <span>{notices.filter((n) => n.status === 'Pending Reply').length} Due</span>
                  <span className="text-xs font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    Action Needed
                  </span>
                </div>
                <div className="text-xs text-red-700 font-semibold mt-1">
                  Avoid ex-parte tax demand orders
                </div>
                <div className="text-[10px] text-red-600 mt-2 pt-2 border-t border-red-100 flex items-center justify-between font-bold">
                  <span>Total Notices Logged: {notices.length}</span>
                  <span className="group-hover:underline">View All Notices →</span>
                </div>
              </div>

              {/* Card 3: Cause List Court Schedule */}
              <div 
                onClick={() => setActiveTab('calendar')}
                className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm hover:border-[#612912] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center text-[11px] font-bold text-[#5A6275] uppercase tracking-wider">
                  <span>Cause List Hearings</span>
                  <div className="p-2 rounded-xl bg-[#E5B842]/20 text-[#612912] group-hover:bg-[#E5B842] group-hover:text-[#1A1A1A] transition-colors">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-2">
                  {hearings.length} Hearings
                </div>
                <div className="text-xs text-[#452415] font-semibold mt-1 flex items-center justify-between">
                  <span>Next Court Hearing:</span>
                  <span className="font-extrabold bg-[#E5B842]/30 px-2 py-0.5 rounded text-[11px]">
                    {hearings[0]?.date || 'Aug 12'}
                  </span>
                </div>
                <div className="text-[10px] text-[#5A6275] mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span>IHC & ATIR Cause Lists</span>
                  <span className="text-[#612912] font-bold group-hover:underline">Open Calendar →</span>
                </div>
              </div>

              {/* Card 4: Fee Receivables */}
              <div 
                onClick={() => setActiveTab('billing')}
                className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm hover:border-[#612912] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center text-[11px] font-bold text-[#5A6275] uppercase tracking-wider">
                  <span>Fee Receivables</span>
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#452415] mt-2">
                  Rs. {(invoices.filter((i) => i.status !== 'Paid').reduce((a, i) => a + (i.totalAmountPkr - i.paidAmountPkr), 0) / 1000).toFixed(0)}k PKR
                </div>
                <div className="text-xs text-amber-800 font-semibold mt-1 flex items-center justify-between">
                  <span>Pending Invoices:</span>
                  <span className="font-extrabold">{invoices.filter((i) => i.status !== 'Paid').length} Unpaid</span>
                </div>
                <div className="text-[10px] text-[#5A6275] mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span>Retainers & Hearing Fees</span>
                  <span className="text-[#612912] font-bold group-hover:underline">Billing Ledger →</span>
                </div>
              </div>
            </div>

            {/* 3. Action Queue & Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side (2 Columns): Active Tax Litigation Repository with Filters */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
                  {/* Panel Title & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                          Active Tax Litigation Repository
                        </h3>
                        <span className="text-[10px] font-extrabold bg-[#612912] text-white px-2 py-0.5 rounded-full">
                          {cases.length} Files
                        </span>
                      </div>
                      <p className="text-xs text-[#5A6275] mt-0.5">
                        Select any litigation file to view timeline events, synced briefs, billing ledgers & WhatsApp dispatches.
                      </p>
                    </div>

                    <button 
                      onClick={() => setActiveTab('cases')} 
                      className="text-xs font-extrabold text-[#452415] hover:text-[#612912] hover:underline shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      View All Files ({cases.length}) →
                    </button>
                  </div>

                  {/* Integrated Dashboard Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <div className="relative w-full sm:flex-1">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={dashSearch}
                        onChange={(e) => setDashSearch(e.target.value)}
                        placeholder="Search by client name, case ref or court forum..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#612912] focus:border-transparent font-medium"
                      />
                      {dashSearch && (
                        <button
                          onClick={() => setDashSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-[11px] font-bold">
                      {['All', 'Stay Granted', 'ATIR Tribunal Pending', 'Response Drafted', 'Favorable Order Passed'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setDashFilter(st)}
                          className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                            dashFilter === st
                              ? 'bg-[#612912] text-white border-[#612912]'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {st === 'All' ? 'All Statuses' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Case Cards List */}
                  <div className="space-y-3 pt-1">
                    {(() => {
                      const filtered = cases.filter((c) => {
                        const matchesSearch =
                          !dashSearch ||
                          c.clientName.toLowerCase().includes(dashSearch.toLowerCase()) ||
                          c.caseTitle.toLowerCase().includes(dashSearch.toLowerCase()) ||
                          c.caseRef.toLowerCase().includes(dashSearch.toLowerCase()) ||
                          c.forum.toLowerCase().includes(dashSearch.toLowerCase());
                        const matchesFilter = dashFilter === 'All' || c.status === dashFilter;
                        return matchesSearch && matchesFilter;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-gray-300 text-gray-500 text-xs">
                            <p className="font-bold">No litigation cases match your search or filter.</p>
                            <button
                              onClick={() => {
                                setDashSearch('');
                                setDashFilter('All');
                              }}
                              className="text-[#612912] font-extrabold underline mt-2 inline-block cursor-pointer"
                            >
                              Reset filters
                            </button>
                          </div>
                        );
                      }

                      return filtered.map((c) => {
                        const caseDocs = documents.filter((d) => d.caseId === c.id);
                        const caseInvs = invoices.filter((i) => i.caseId === c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCase(c)}
                            className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200 hover:border-[#612912] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-md"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono font-extrabold bg-[#612912] text-white px-2.5 py-0.5 rounded-md">
                                  {c.caseRef}
                                </span>
                                <span className="text-xs font-extrabold text-[#1A1A1A]">{c.clientName}</span>
                                <span className="text-[10px] font-bold bg-[#612912]/10 text-[#452415] px-2 py-0.5 rounded-md">
                                  Tax Year {c.taxYear}
                                </span>
                              </div>

                              <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A] group-hover:text-[#612912] transition-colors leading-snug">
                                {c.caseTitle}
                              </h4>

                              <div className="text-[11px] text-[#5A6275] flex items-center gap-3 flex-wrap">
                                <span>Forum: <strong className="text-[#452415]">{c.forum}</strong></span>
                                <span>• Lead Counsel: <strong className="text-[#1A1A1A]">{c.assignedCounsel}</strong></span>
                              </div>

                              {/* Synced Stats Tags */}
                              <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-gray-600 flex-wrap">
                                <span className="bg-white border border-gray-200 px-2.5 py-0.5 rounded-md text-[#452415] flex items-center gap-1 shadow-2xs">
                                  <FolderOpen className="w-3 h-3 text-[#E5B842]" /> {caseDocs.length} Synced Docs
                                </span>
                                <span className="bg-white border border-gray-200 px-2.5 py-0.5 rounded-md text-[#452415] flex items-center gap-1 shadow-2xs">
                                  <CreditCard className="w-3 h-3 text-[#E5B842]" /> {caseInvs.length} Invoices
                                </span>
                                {c.nextHearingDate && (
                                  <span className="bg-[#E5B842]/20 border border-[#E5B842]/40 px-2.5 py-0.5 rounded-md text-[#452415] flex items-center gap-1 font-extrabold">
                                    <CalendarIcon className="w-3 h-3 text-[#612912]" /> Next Hearing: {c.nextHearingDate}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Disputed Demand & Status Pill */}
                            <div className="text-left sm:text-right shrink-0 space-y-1">
                              <div className="text-xs font-extrabold text-red-700">
                                Disputed Demand:
                              </div>
                              <div className="text-sm font-extrabold text-red-800 font-mono">
                                Rs. {(c.demandAmountPkr / 100000).toFixed(1)} Lakh
                              </div>
                              <span className="text-[10px] font-extrabold bg-[#E5B842] text-[#1A1A1A] px-2.5 py-1 rounded-full inline-block shadow-2xs">
                                {c.status}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Side (1 Column): Cause List Schedule & Billing Receivables */}
              <div className="space-y-6">
                {/* Panel 1: Cause List Court Schedule */}
                <div className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                        Cause List Court Schedule
                      </h3>
                      <p className="text-[11px] text-[#5A6275]">High Court & Appellate Benches</p>
                    </div>
                    <button 
                      onClick={() => setShowAddHearingModal(true)} 
                      className="text-xs font-bold bg-[#612912] hover:bg-[#452415] text-white px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#E5B842]" /> Schedule
                    </button>
                  </div>

                  <div className="space-y-3">
                    {hearings.slice(0, 3).map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          const selCase = cases.find((c) => c.id === h.caseId);
                          if (selCase) setSelectedCase(selCase);
                        }}
                        className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200 hover:border-[#612912] text-xs space-y-2 cursor-pointer transition-all hover:shadow-sm group"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-extrabold text-[#452415] bg-[#612912]/10 px-2 py-0.5 rounded text-[10px]">
                            {h.forum}
                          </span>
                          <span className="font-extrabold text-[#1A1A1A] bg-[#E5B842] px-2.5 py-0.5 rounded shadow-2xs text-[11px]">
                            📅 {h.date}
                          </span>
                        </div>

                        <div className="font-extrabold text-sm text-[#1A1A1A] group-hover:text-[#612912] leading-snug">
                          {h.caseTitle}
                        </div>

                        <div className="text-[11px] text-[#5A6275]">
                          Bench: <strong className="text-[#1A1A1A]">{h.bench}</strong>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <span className="text-[10px] text-gray-500 font-medium">Counsel: {h.counselAssigned.split(' ')[0]}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = buildGoogleCalendarUrl({
                                title: `Tax Hearing: ${h.caseTitle}`,
                                details: `Client: ${h.clientName}\nCounsel: ${h.counselAssigned}\nBench: ${h.bench}`,
                                location: h.forum,
                                startDate: h.date,
                                startTime: '10:00'
                              });
                              window.open(url, '_blank');
                            }}
                            className="text-[10px] font-extrabold text-[#452415] hover:text-[#612912] flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <CalendarIcon className="w-3 h-3 text-[#E5B842]" /> + Google Calendar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="w-full text-center text-xs font-bold text-[#612912] hover:underline pt-1 block cursor-pointer"
                  >
                    View Full Cause List Calendar ({hearings.length}) →
                  </button>
                </div>

                {/* Panel 2: Pending Fee Receivables Summary */}
                <div className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                        Fee Receivables
                      </h3>
                      <p className="text-[11px] text-[#5A6275]">Unpaid Retainers & Bills</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('billing')} 
                      className="text-xs font-bold text-[#452415] hover:underline cursor-pointer"
                    >
                      Billing Ledger →
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {invoices.filter((i) => i.status !== 'Paid').map((i) => (
                      <div key={i.id} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-[#1A1A1A]">{i.clientName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {i.invoiceNumber} • Due: {i.dueDate}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-[#452415] block text-sm font-mono">
                            Rs. {i.totalAmountPkr.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForPdf(i)}
                            className="text-[10px] font-extrabold text-white bg-[#612912] hover:bg-[#452415] px-2.5 py-1 rounded-lg transition-colors cursor-pointer mt-1 inline-block shadow-2xs"
                          >
                            Send Invoice PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CASE MANAGEMENT --- */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm">
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">Tax Litigation Repository</h1>
                <p className="text-xs text-[#5A6275]">Filter active tax appeals, High Court writs, and show cause responses.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddHearingModal(true)}
                  className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <CalendarIcon className="w-4 h-4 text-[#E5B842]" />
                  <span>Schedule Hearing</span>
                </button>

                <button
                  onClick={() => setShowAddCaseModal(true)}
                  className="bg-[#E5B842] hover:bg-[#E09415] text-[#1A1A1A] font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Case</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#452415]/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <Search className="w-4 h-4 text-[#452415] shrink-0" />
                <input
                  type="text"
                  placeholder="Search by Case Title, Ref #, CNO No, Section Code, NTN, Client, Forum, Tax Year, Counsel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#452415] text-xs font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500 shrink-0"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Notice Received">Notice Received</option>
                  <option value="Response Drafted">Response Drafted</option>
                  <option value="Under Audit">Under Audit</option>
                  <option value="CIR Appeal Pending">CIR Appeal Pending</option>
                  <option value="ATIR Tribunal Pending">ATIR Tribunal Pending</option>
                  <option value="High Court Writ Active">High Court Writ Active</option>
                  <option value="Stay Granted">Stay Granted</option>
                  <option value="Favorable Order Passed">Favorable Order Passed</option>
                </select>

                <select
                  value={forumFilter}
                  onChange={(e) => setForumFilter(e.target.value)}
                  className="bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-xs"
                >
                  <option value="All">All Legal Forums</option>
                  {caseForums.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                <select
                  value={taxYearFilter}
                  onChange={(e) => setTaxYearFilter(e.target.value)}
                  className="bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-xs"
                >
                  <option value="All">All Tax Years</option>
                  {caseTaxYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <div className="bg-[#612912]/10 text-[#612912] font-extrabold px-3 py-2 rounded-xl text-xs shrink-0">
                  {filteredCases.length} / {cases.length} Files
                </div>
              </div>
            </div>

            {/* Cases Vertical List */}
            <div className="flex flex-col gap-4">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-extrabold bg-[#612912] text-white px-2.5 py-0.5 rounded-md">
                        {c.caseRef}
                      </span>
                      <span className="text-xs font-bold text-[#5A6275]">Tax Year: {c.taxYear}</span>
                      <span className="text-xs font-extrabold text-[#452415] bg-[#612912]/10 px-2.5 py-0.5 rounded-md">
                        {c.forum}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          c.riskLevel === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : c.riskLevel === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-[#612912]/10 text-[#452415]'
                        }`}
                      >
                        {c.riskLevel} Risk
                      </span>
                      <span className="text-[10px] font-bold bg-[#E5B842]/20 text-[#1A1A1A] px-2.5 py-0.5 rounded-full">
                        {c.status}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-lg text-[#1A1A1A]">{c.caseTitle}</h3>

                    <div className="text-xs text-[#5A6275] flex flex-wrap gap-x-4 gap-y-1">
                      <span>Client: <strong className="text-[#1A1A1A]">{c.clientName}</strong> (NTN: {c.clientNtn})</span>
                      <span>Lead Counsel: <strong className="text-[#452415]">{c.assignedCounsel}</strong></span>
                      <span>Disputed Demand: <strong className="text-red-700">Rs. {(c.demandAmountPkr / 100000).toFixed(1)} Lakh</strong></span>
                    </div>

                    <p className="text-xs text-gray-700 bg-[#FAF8F5] p-3 rounded-2xl border border-gray-100">
                      {c.summary}
                    </p>

                    {c.nextHearingDate && (
                      <div className="text-xs text-[#452415] font-semibold flex items-center gap-2 pt-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#E5B842]" />
                        <span>Next Hearing: <strong className="text-[#1A1A1A]">{c.nextHearingDate}</strong> — {c.nextHearingPurpose || 'Proceedings'}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 gap-3">
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="bg-[#612912] hover:bg-[#452415] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Open Case File</span>
                      <ChevronRight className="w-4 h-4 text-[#E5B842]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 5: HEARING CALENDAR (INTERACTIVE GRID) --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm">
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">Tax Hearing Calendar</h1>
                <p className="text-xs text-[#5A6275]">Click on any date to filter hearings or click a hearing to open case details.</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedCalendarDate && (
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3 py-2 rounded-2xl text-xs"
                  >
                    Show All Dates
                  </button>
                )}
                <button
                  onClick={() => setShowAddHearingModal(true)}
                  className="bg-[#E5B842] hover:bg-[#E09415] text-[#1A1A1A] font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Court Hearing</span>
                </button>
              </div>
            </div>

            {/* Interactive Month Grid */}
            <div className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                    {calendarCurrentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} Cause List Grid
                  </h3>
                  <div className="flex items-center gap-1 bg-[#FAF8F5] border border-gray-200 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarCurrentDate(
                          new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, 1)
                        )
                      }
                      className="px-2 py-1 font-extrabold text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
                      title="Previous Month"
                    >
                      &larr; Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarCurrentDate(new Date())}
                      className="px-2.5 py-1 font-bold text-[#452415] hover:bg-[#612912]/5 rounded-lg transition-all text-[11px]"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarCurrentDate(
                          new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 1)
                        )
                      }
                      className="px-2 py-1 font-extrabold text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
                      title="Next Month"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#452415]">
                  {selectedCalendarDate ? `Selected: ${selectedCalendarDate}` : 'Showing All Dates'}
                </span>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#5A6275] border-b pb-2">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cd) => {
                  const isSelected = selectedCalendarDate === cd.dateStr;
                  const hasHearings = cd.dayHearings.length > 0;

                  return (
                    <button
                      key={cd.dateStr}
                      onClick={() => handleSelectCalendarDate(cd.dateStr)}
                      className={`p-2 min-h-[70px] rounded-2xl border transition-all flex flex-col justify-between text-left ${
                        isSelected
                          ? 'bg-[#612912] text-white border-[#612912] shadow-md'
                          : hasHearings
                          ? 'bg-[#452415]/10 border-[#452415]/30 text-[#1A1A1A] hover:bg-[#452415]/20'
                          : 'bg-[#FAF8F5] border-gray-100 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-extrabold text-xs flex justify-between w-full">
                        <span>{cd.dayNum}</span>
                        {hasHearings && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#E5B842]' : 'bg-[#452415]'}`} />
                        )}
                      </div>

                      {hasHearings && (
                        <div className="mt-1">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-[#E5B842] text-[#1A1A1A]' : 'bg-[#452415] text-white'
                            }`}
                          >
                            {cd.dayHearings.length}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hearings List for Selected Date or All */}
            <div ref={calendarHearingsListRef} className="space-y-4 scroll-mt-24">
              <h3 className="font-heading font-extrabold text-lg text-[#1A1A1A]">
                {selectedCalendarDate ? `Hearings Scheduled for ${selectedCalendarDate}` : 'All Scheduled Hearings'}
              </h3>

              {calendarHearings.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-[#452415]/15 text-center text-xs text-gray-500">
                  No hearings listed for this date.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calendarHearings.map((h) => {
                    const selCase = cases.find((c) => c.id === h.caseId);
                    return (
                      <div
                        key={h.id}
                        className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3 hover:border-[#452415] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="bg-[#452415] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                            {h.forum}
                          </span>
                          <span className="text-xs font-extrabold text-[#1A1A1A] bg-[#E5B842] px-2 py-0.5 rounded-md">
                            {h.date} @ {h.time}
                          </span>
                        </div>

                        <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">{h.caseTitle}</h3>

                        <div className="text-xs text-[#5A6275]">
                          Client: <span className="font-bold text-[#1A1A1A]">{h.clientName}</span> • Bench: {h.bench}
                        </div>

                        <div className="text-xs font-bold text-[#452415]">Lead Counsel: {h.counselAssigned}</div>

                        <div className="text-xs text-gray-700 bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-100">
                          Purpose: {h.purpose}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <button
                            onClick={() => {
                              if (selCase) setSelectedCase(selCase);
                            }}
                            className="bg-[#612912] hover:bg-[#452415] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                          >
                            <span>Open Case Details</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#E5B842]" />
                          </button>

                          <button
                            onClick={() => {
                              const url = buildGoogleCalendarUrl({
                                title: `Tax Hearing: ${h.caseTitle}`,
                                details: `Client: ${h.clientName}\nCounsel: ${h.counselAssigned}\nBench: ${h.bench}`,
                                location: h.forum,
                                startDate: h.date,
                                startTime: '10:00'
                              });
                              window.open(url, '_blank');
                            }}
                            className="bg-amber-100 hover:bg-amber-200 text-[#1A1A1A] text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 text-[#452415]" />
                            <span>Add Google Calendar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 6: DOCUMENT VAULT --- */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm">
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">Secure Document Storage</h1>
                <p className="text-xs text-[#5A6275]">Categorized repository of stay orders, wakalatnamas, FBR replies, & tax return filings.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewDocData((prev) => ({
                    ...prev,
                    caseId: prev.caseId || cases[0]?.id || '',
                    clientId: prev.clientId || cases[0]?.clientId || clients[0]?.id || ''
                  }));
                  setShowAddDocModal(true);
                }}
                className="bg-[#E5B842] hover:bg-[#E09415] text-[#1A1A1A] font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>

            {/* Document Vault Search & Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5A6275] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={docSearchTerm}
                    onChange={(e) => setDocSearchTerm(e.target.value)}
                    placeholder="Search documents by Title, CNO #, Section Code, Category, Uploader, File Size, Date, Client, or Case Ref..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415] font-medium"
                  />
                  {docSearchTerm && (
                    <button
                      onClick={() => setDocSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-2 rounded-2xl border border-gray-200 text-xs">
                    <Filter className="w-3.5 h-3.5 text-[#452415]" />
                    <span className="font-bold text-[#5A6275]">Category:</span>
                    <select
                      value={docCategoryFilter}
                      onChange={(e) => setDocCategoryFilter(e.target.value)}
                      className="bg-transparent font-bold text-[#1A1A1A] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Categories ({documents.length})</option>
                      {docCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {docUploaders.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-2 rounded-2xl border border-gray-200 text-xs">
                      <span className="font-bold text-[#5A6275]">Uploader:</span>
                      <select
                        value={docUploaderFilter}
                        onChange={(e) => setDocUploaderFilter(e.target.value)}
                        className="bg-transparent font-bold text-[#1A1A1A] focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Uploaders</option>
                        {docUploaders.map((up) => (
                          <option key={up} value={up}>
                            {up}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(docSearchTerm || docCategoryFilter !== 'All' || docUploaderFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setDocSearchTerm('');
                        setDocCategoryFilter('All');
                        setDocUploaderFilter('All');
                      }}
                      className="bg-red-50 text-red-700 hover:bg-red-100 font-bold px-3 py-2 rounded-2xl text-xs transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-[#5A6275] font-semibold flex items-center justify-between px-1">
                <span>Showing {filteredDocuments.length} of {documents.length} archived legal documents</span>
              </div>
            </div>

            {/* Document Grid */}
            {filteredDocuments.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#452415]/15 text-center space-y-2">
                <FolderOpen className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="font-heading font-extrabold text-base text-[#1A1A1A]">No Matching Documents Found</h4>
                <p className="text-xs text-[#5A6275]">Try adjusting your search query or selected category filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocuments.map((doc) => {
                  const linkedCase = cases.find((c) => c.id === doc.caseId);
                  return (
                    <div key={doc.id} className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm flex items-start justify-between gap-4 hover:border-[#452415] transition-all">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold bg-[#452415]/10 text-[#452415] px-2.5 py-0.5 rounded-md">
                            {doc.category}
                          </span>
                          {doc.isClientVisible ? (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                              Client Visible
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md">
                              Internal
                            </span>
                          )}
                        </div>

                        <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A] mt-1">{doc.title}</h3>

                        {/* Direct Case File Link */}
                        {linkedCase ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCase(linkedCase)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#452415] bg-[#612912]/10 hover:bg-[#612912]/20 px-2.5 py-1 rounded-xl transition-all"
                            title="Open Case File Detail Page"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-[#E5B842]" />
                            <span>Case: [{linkedCase.caseRef}] {linkedCase.clientName}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic block">Unassigned Case</span>
                        )}

                        <div className="text-[11px] text-[#5A6275] pt-1">
                          Uploaded by: <span className="font-bold">{doc.uploadedBy}</span> on {doc.uploadedAt}
                        </div>
                        <div className="text-[11px] font-mono text-[#452415]">Size: {doc.fileSize}</div>
                      </div>

                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Simulated PDF Download: Downloading "${doc.title}"...`);
                        }}
                        className="bg-[#612912] text-white p-3 rounded-2xl hover:bg-[#452415] transition-colors shrink-0"
                        title="Download File"
                      >
                        <Download className="w-4 h-4 text-[#E5B842]" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 7: TASKS & INTERNAL NOTES --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm">
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">Internal Tasks & Privileged Notes</h1>
                <p className="text-xs text-[#5A6275]">Legal team task assignments and confidential attorney notes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks Column */}
              <div className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">Associate Tasks ({filteredTasks.length})</h3>
                </div>

                {/* Task Search & Filter Bar */}
                <div className="space-y-2.5 bg-[#FAF8F5] p-3.5 rounded-2xl border border-gray-200">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#5A6275] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={taskSearchTerm}
                      onChange={(e) => setTaskSearchTerm(e.target.value)}
                      placeholder="Search tasks by title, associate, CNO #, Section Code, Case Ref, or NTN..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-gray-200">
                      <span className="font-bold text-[#5A6275] text-[10px]">Status:</span>
                      <select
                        value={taskStatusFilter}
                        onChange={(e) => setTaskStatusFilter(e.target.value)}
                        className="bg-transparent font-bold text-[#1A1A1A] focus:outline-none text-xs cursor-pointer"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending Only</option>
                        <option value="Completed">Completed Only</option>
                      </select>
                    </div>

                    {(taskSearchTerm || taskStatusFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setTaskSearchTerm('');
                          setTaskStatusFilter('All');
                          setTaskAssigneeFilter('All');
                        }}
                        className="text-[10px] font-bold text-red-600 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Task Items */}
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 bg-[#FAF8F5] rounded-2xl border border-dashed border-gray-200">
                    No associate tasks match the search or filter criteria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => toggleTask(t.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          t.isCompleted
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-[#FAF8F5] border-gray-200 hover:border-[#452415]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={t.isCompleted}
                          onChange={() => {}}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#452415]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#1A1A1A]">{t.title}</span>
                            <span className="text-[10px] font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                              Due: {t.dueDate}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#5A6275]">
                            Assigned to: <span className="font-bold text-[#452415]">{t.assignedTo}</span>
                          </div>
                          {t.notes && <div className="text-[11px] text-gray-600 mt-1 italic">{t.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privileged Notes Column */}
              <div className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">Privileged Attorney Notes ({filteredNotes.length})</h3>
                </div>

                {/* Notes Search Bar */}
                <div className="relative bg-[#FAF8F5] p-2 rounded-2xl border border-gray-200">
                  <Search className="w-3.5 h-3.5 text-[#5A6275] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noteSearchTerm}
                    onChange={(e) => setNoteSearchTerm(e.target.value)}
                    placeholder="Search notes content, author, CNO #, Section Code, or Case Ref..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                  {noteSearchTerm && (
                    <button
                      onClick={() => setNoteSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 bg-[#FAF8F5] rounded-2xl border border-dashed border-gray-200">
                    No privileged notes match your search.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotes.map((n) => (
                      <div key={n.id} className="p-4 rounded-2xl bg-[#612912]/5 border border-[#452415]/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold bg-[#612912] text-white px-2 py-0.5 rounded-md">
                            {n.author}
                          </span>
                          <span className="text-xs text-[#5A6275]">{n.date}</span>
                        </div>
                        <p className="text-xs text-[#1A1A1A] italic">{n.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 8: BILLING & INVOICES --- */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm">
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">Billing & Fee Management</h1>
                <p className="text-xs text-[#5A6275]">Retainer contracts, High Court appearance fees, & fee payment statuses.</p>
              </div>
              <button
                onClick={() => setShowAddInvoiceModal(true)}
                className="bg-[#E5B842] hover:bg-[#E09415] text-[#1A1A1A] font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Fee Invoice</span>
              </button>
            </div>

            {/* Billing Search & Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5A6275] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={billingSearchTerm}
                    onChange={(e) => setBillingSearchTerm(e.target.value)}
                    placeholder="Search invoices by invoice #, service, client, NTN, CNO #, Section Code, or case ref..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                  {billingSearchTerm && (
                    <button
                      onClick={() => setBillingSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-2 rounded-2xl border border-gray-200 text-xs">
                    <Filter className="w-3.5 h-3.5 text-[#452415]" />
                    <span className="font-bold text-[#5A6275]">Status:</span>
                    <select
                      value={billingStatusFilter}
                      onChange={(e) => setBillingStatusFilter(e.target.value)}
                      className="bg-transparent font-bold text-[#1A1A1A] focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Statuses ({invoices.length})</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending / Unpaid</option>
                      <option value="Partially Paid">Partially Paid</option>
                    </select>
                  </div>

                  {billingClients.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-2 rounded-2xl border border-gray-200 text-xs">
                      <span className="font-bold text-[#5A6275]">Client:</span>
                      <select
                        value={billingClientFilter}
                        onChange={(e) => setBillingClientFilter(e.target.value)}
                        className="bg-transparent font-bold text-[#1A1A1A] focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Clients</option>
                        {billingClients.map((cli) => (
                          <option key={cli} value={cli}>
                            {cli}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(billingSearchTerm || billingStatusFilter !== 'All' || billingClientFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setBillingSearchTerm('');
                        setBillingStatusFilter('All');
                        setBillingClientFilter('All');
                      }}
                      className="bg-red-50 text-red-700 hover:bg-red-100 font-bold px-3 py-2 rounded-2xl text-xs transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-[#5A6275] font-semibold flex items-center justify-between px-1">
                <span>Showing {filteredInvoices.length} of {invoices.length} fee invoices</span>
                <span>
                  Total Filtered Amount: <strong className="text-[#452415]">Rs. {filteredInvoices.reduce((acc, i) => acc + (i.retainerFeePkr + i.hearingFeePkr), 0).toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* Invoices List */}
            {filteredInvoices.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#452415]/15 text-center space-y-2">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="font-heading font-extrabold text-base text-[#1A1A1A]">No Matching Invoices Found</h4>
                <p className="text-xs text-[#5A6275]">Try adjusting your search criteria or status filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((inv) => {
                  const linkedCase = cases.find((c) => c.id === inv.caseId);
                  return (
                    <div key={inv.id} className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#452415] transition-all">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#452415] bg-[#452415]/10 px-2 py-0.5 rounded">{inv.invoiceNumber}</span>
                          <span className="text-xs text-[#5A6275]">Issued: {inv.issueDate}</span>
                        </div>
                        <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">{inv.serviceDescription}</h3>
                        
                        {/* Direct Linked Case File button */}
                        {linkedCase ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCase(linkedCase)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#452415] bg-[#612912]/10 hover:bg-[#612912]/20 px-2.5 py-1 rounded-xl transition-all"
                            title="Open Case File Detail Page"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-[#E5B842]" />
                            <span>Case: [{linkedCase.caseRef}] {linkedCase.clientName}</span>
                          </button>
                        ) : (
                          <div className="text-xs text-[#5A6275]">
                            Client: <span className="font-bold text-[#1A1A1A]">{inv.clientName}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 shrink-0">
                      <div>
                        <div className="text-[10px] text-[#5A6275]">Total Invoice Fee</div>
                        <div className="font-extrabold text-[#452415] text-base">
                          Rs. {(inv.retainerFeePkr + inv.hearingFeePkr).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span
                          className={`text-center text-[10px] font-extrabold px-3 py-1 rounded-full ${
                            inv.status === 'Paid'
                              ? 'bg-[#612912]/10 text-[#452415]'
                              : inv.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {inv.status}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForPdf(inv)}
                            className="bg-[#612912] text-white text-xs font-bold px-3 py-1 rounded-xl hover:bg-[#452415] flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3 text-[#E5B842]" /> PDF
                          </button>

                          <button
                            onClick={() => setSelectedInvoiceForPdf(inv)}
                            className="bg-[#25D366] text-white text-xs font-bold px-2.5 py-1 rounded-xl hover:bg-[#612912] flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> WhatsApp
                          </button>
                        </div>

                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => markInvoicePaid(inv.id, 'Bank Transfer')}
                            className="bg-[#FAF8F5] text-gray-700 text-[11px] font-bold px-3 py-1 rounded-xl hover:bg-gray-200 border border-gray-300"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* --- TAB 10: PRACTICE AREAS MANAGEMENT (SIMPLIFIED) --- */}
        {activeTab === 'practiceAreas' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm">
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">Practice Areas</h1>
                <p className="text-xs text-[#5A6275] mt-0.5">
                  Manage the legal services displayed on your public website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddPracticeArea}
                className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#E5B842]" />
                <span>Add Practice Area</span>
              </button>
            </div>

            {/* Success Alert */}
            {paActionSuccess && (
              <div className="bg-[#612912]/5 border border-[#612912]/30 text-[#34160B] px-5 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#452415] shrink-0" />
                  <span>{paActionSuccess}</span>
                </div>
                <button
                  onClick={() => setPaActionSuccess(null)}
                  className="text-[#612912] hover:text-[#34160B] font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-[#452415]/15 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5A6275] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={paSearchTerm}
                  onChange={(e) => setPaSearchTerm(e.target.value)}
                  placeholder="Search practice areas..."
                  className="w-full pl-10 pr-8 py-2 bg-[#FAF8F5] rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                />
                {paSearchTerm && (
                  <button
                    onClick={() => setPaSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-2 rounded-xl border border-gray-200 text-xs">
                  <Filter className="w-3.5 h-3.5 text-[#452415]" />
                  <select
                    value={paCategoryFilter}
                    onChange={(e) => setPaCategoryFilter(e.target.value)}
                    className="bg-transparent font-bold text-[#1A1A1A] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Categories ({practiceAreas?.length || 0})</option>
                    {paCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {(paSearchTerm || paCategoryFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setPaSearchTerm('');
                      setPaCategoryFilter('All');
                    }}
                    className="text-xs text-red-600 font-bold px-2 py-1 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Practice Areas List */}
            {filteredPracticeAreas.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-gray-300 space-y-3">
                <Scale className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">No practice areas found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {paSearchTerm || paCategoryFilter !== 'All'
                    ? 'No services match your search filter.'
                    : 'No practice areas added yet.'}
                </p>
                <button
                  onClick={handleOpenAddPracticeArea}
                  className="bg-[#612912] text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>Add Practice Area</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPracticeAreas.map((area) => (
                  <div
                    key={area.id}
                    className="bg-white rounded-2xl border border-[#452415]/15 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Icon, Title, Category & Description */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#452415]/10 text-[#452415] flex items-center justify-center shrink-0 border border-[#452415]/20 mt-0.5">
                        {renderPracticeAreaIcon(area.iconName, 'w-5 h-5')}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading font-extrabold text-[#1A1A1A] text-sm sm:text-base">
                            {area.title}
                          </h3>
                          {area.category && area.category !== area.title && (
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                              {area.category}
                            </span>
                          )}
                          {area.badge && (
                            <span className="text-[10px] font-extrabold text-[#D98200] bg-[#E5B842]/15 px-2 py-0.5 rounded-md border border-[#E5B842]/30">
                              {area.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#5A6275] line-clamp-2 leading-relaxed">
                          {area.shortDesc}
                        </p>

                        {area.subServices && area.subServices.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-bold text-gray-400">Services:</span>
                            {area.subServices.slice(0, 4).map((sub, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium bg-[#FAF8F5] text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                              >
                                {sub}
                              </span>
                            ))}
                            {area.subServices.length > 4 && (
                              <span className="text-[10px] text-[#452415] font-bold">
                                +{area.subServices.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPracticeArea(area)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#612912] hover:text-white text-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmArea(area)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Delete Practice Area"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Subtle Reset link at the bottom */}
                <div className="pt-4 flex items-center justify-between text-xs text-gray-400 px-2">
                  <span>Showing {filteredPracticeAreas.length} practice areas</span>
                  <button
                    type="button"
                    onClick={handleResetPracticeAreas}
                    className="hover:text-gray-600 underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restore default services</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 11: OUR TEAM MANAGEMENT (SIMPLIFIED) --- */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm">
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">Our Team</h1>
                <p className="text-xs text-[#5A6275] mt-0.5">
                  Manage the attorneys, partners, and legal counsel displayed on your public website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddTeamMember}
                className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#E5B842]" />
                <span>Add Team Member</span>
              </button>
            </div>

            {/* Success Alert */}
            {teamActionSuccess && (
              <div className="bg-[#612912]/5 border border-[#612912]/30 text-[#34160B] px-5 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#452415] shrink-0" />
                  <span>{teamActionSuccess}</span>
                </div>
                <button
                  onClick={() => setTeamActionSuccess(null)}
                  className="text-[#612912] hover:text-[#34160B] font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Sticky-to-Left Profile Control Banner */}
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                  <Pin className="w-4 h-4 fill-amber-700 text-amber-700" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-[#1A1A1A]">Stuck Profile (Left Side of Screen):</span>
                    <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                      {teamMembers.find((m) => m.stickToLeft)?.name ||
                        teamMembers.find((m) => m.isCeo)?.name ||
                        'CEO Profile (Default)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    This profile stays stationary on the left side of the screen in the team section while other members scroll in the carousel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <label className="text-[11px] font-bold text-gray-700 whitespace-nowrap">Stick Profile to Left:</label>
                <select
                  value={
                    teamMembers.find((m) => m.stickToLeft)?.id ||
                    teamMembers.find((m) => m.isCeo)?.id ||
                    teamMembers[0]?.id ||
                    ''
                  }
                  onChange={(e) => handleStickToLeft(e.target.value)}
                  className="bg-white border border-amber-300 text-amber-900 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#452415] cursor-pointer shadow-xs"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isCeo ? '(CEO)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-[#452415]/15 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5A6275] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  placeholder="Search by advocate name, specialty, title, or credential..."
                  className="w-full pl-10 pr-8 py-2 bg-[#FAF8F5] rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                />
                {teamSearchTerm && (
                  <button
                    onClick={() => setTeamSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-gray-200">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] font-bold">Role:</span>
                  <select
                    value={teamRoleFilter}
                    onChange={(e) => setTeamRoleFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#452415] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Members ({teamMembers?.length || 0})</option>
                    <option value="CEO">Leadership / CEO</option>
                    <option value="Associate">Associate Counsel</option>
                  </select>
                </div>

                <div className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-xl">
                  {filteredTeamMembers.length} {filteredTeamMembers.length === 1 ? 'member' : 'members'}
                </div>
              </div>
            </div>

            {/* List of Team Members */}
            {filteredTeamMembers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700 text-sm">No team members match your search</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Try clearing your search query or reset the filter to view all advocates and partners.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTeamSearchTerm('');
                    setTeamRoleFilter('All');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-xl text-gray-700 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-[#452415]/15 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Avatar, Name, Role & Details */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-[#452415]/20 bg-[#34160B] shadow-sm">
                        <img
                          src={member.image || rahimMemberImg}
                          alt={member.name}
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                        />
                        {member.isCeo && (
                          <div className="absolute top-0 right-0 bg-[#E5B842] text-black p-0.5 rounded-bl-lg shadow-sm" title="Founder & CEO">
                            <Award className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading font-extrabold text-[#1A1A1A] text-sm sm:text-base">
                            {member.name}
                          </h3>
                          {(member.pillarWatermark || member.isCeo) && (
                            <span className="text-[10px] font-bold text-[#452415] bg-[#612912]/5 px-2 py-0.5 rounded-md border border-[#612912]/20">
                              {member.pillarWatermark || (member.isCeo ? 'FOUNDER' : 'ADVOCATE')}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-semibold text-[#452415]">
                          {member.title}
                        </div>

                        <p className="text-xs text-[#5A6275] line-clamp-2 leading-relaxed">
                          {member.bio}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-gray-400">Credentials:</span>
                          {(member.credentials || []).map((cred, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium bg-[#FAF8F5] text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                            >
                              {cred}
                            </span>
                          ))}
                        </div>

                        {member.specialty && (
                          <div className="text-[11px] text-gray-600 font-medium pt-0.5">
                            <span className="font-bold text-[#452415]">Focus: </span>
                            {member.specialty}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0 justify-end flex-wrap">
                      {member.stickToLeft || (!teamMembers.some((m) => m.stickToLeft) && member.isCeo) ? (
                        <span className="px-3 py-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                          <Pin className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                          <span>Stuck to Left</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStickToLeft(member.id)}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-transparent text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Stick this profile to the left side of the screen"
                        >
                          <Pin className="w-3.5 h-3.5 text-gray-500" />
                          <span>Stick to Left</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditTeamMember(member)}
                        className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-[#612912] hover:text-white text-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmMember(member)}
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Delete Team Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Reset link at bottom */}
                <div className="pt-4 flex items-center justify-between text-xs text-gray-400 px-2">
                  <span>Showing {filteredTeamMembers.length} team members</span>
                  <button
                    type="button"
                    onClick={handleResetTeamMembers}
                    className="hover:text-gray-600 underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restore default team roster</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 12: CLIENT REVIEWS & TESTIMONIALS MANAGEMENT */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Action Success Alert */}
            {reviewActionSuccess && (
              <div className="bg-[#612912]/5 border border-[#612912]/20 text-[#452415] px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-medium shadow-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#452415]" />
                  <span>{reviewActionSuccess}</span>
                </div>
                <button
                  onClick={() => setReviewActionSuccess(null)}
                  className="text-[#612912] hover:text-[#34160B] font-bold ml-4 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Top Header & Action */}
            <div className="bg-white rounded-3xl p-6 border border-[#452415]/15 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#452415]/10 text-[#452415] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Website Testimonials
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-xs text-gray-500 font-medium">Public Trust &amp; Marquee Stream</span>
                </div>
                <h2 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">
                  Client Reviews &amp; Testimonials
                </h2>
                <p className="text-xs text-[#5A6275] max-w-2xl mt-1">
                  Manage client testimonials, tax relief numbers, ratings, and case verification badges shown in the continuous scrolling marquee on the public homepage.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleOpenAddReview}
                  className="bg-[#452415] hover:bg-[#612912] text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Review</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Total Reviews
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#1A1A1A]">
                  {reviews.length}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {reviews.filter((r) => r.status !== 'archived').length} Active on Website
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Average Rating
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-2xl font-heading font-extrabold text-[#1A1A1A]">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(2)
                      : '5.00'}
                  </div>
                  <div className="flex text-[#E5B842]">
                    <Star className="w-4 h-4 fill-[#E5B842]" />
                  </div>
                </div>
                <div className="text-[11px] text-[#612912] font-medium mt-0.5">
                  100% Positive Feedback
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Verified Cases
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#452415]">
                  {reviews.filter((r) => r.verifiedBadge).length}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  With advocate privilege
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Featured Reviews
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#E5B842]">
                  {reviews.filter((r) => r.featured !== false).length}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Promoted in marquee
                </div>
              </div>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search testimonials by client initials, role, location, tax relief or review text..."
                    value={reviewSearchTerm}
                    onChange={(e) => setReviewSearchTerm(e.target.value)}
                    className="w-full bg-[#FAF8F5] pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                  {reviewSearchTerm && (
                    <button
                      onClick={() => setReviewSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(e.target.value)}
                    className="bg-[#FAF8F5] px-3 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#452415]"
                  >
                    <option value="All">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                  </select>

                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className="bg-[#FAF8F5] px-3 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#452415]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>

                  {(reviewSearchTerm || reviewRatingFilter !== 'All' || reviewStatusFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setReviewSearchTerm('');
                        setReviewRatingFilter('All');
                        setReviewStatusFilter('All');
                      }}
                      className="px-3 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Testimonials List */}
            {filteredReviews.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <MessageSquareQuote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-heading font-extrabold text-base text-gray-800 mb-1">
                  No Reviews Found
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  No testimonials match your current search criteria or filter options.
                </p>
                <button
                  onClick={handleOpenAddReview}
                  className="bg-[#452415] hover:bg-[#612912] text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Review</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-3xl p-5 border border-[#452415]/15 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Top Meta Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {/* Rating Stars */}
                        <div className="flex gap-0.5">
                          {[...Array(review.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-[#E5B842] fill-[#E5B842]" />
                          ))}
                        </div>

                        {/* Verified Badge */}
                        {review.verifiedBadge && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#452415] bg-[#E8F5F0] px-2.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#452415]" />
                            <span>Verified Case</span>
                          </span>
                        )}

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            review.status === 'archived'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-[#612912]/10 text-[#452415]'
                          }`}
                        >
                          {review.status === 'archived' ? 'Archived' : 'Published on Site'}
                        </span>
                      </div>

                      {/* Date & Optional Highlight */}
                      <div className="flex items-center gap-2.5">
                        {review.date && (
                          <span className="text-xs text-gray-400 font-medium">
                            {review.date}
                          </span>
                        )}
                        {review.dollarSaved && (
                          <span className="bg-[#FAF3E6] border border-[#E5B842]/30 text-[#8F5605] font-extrabold text-xs px-3 py-1 rounded-xl">
                            Saved {review.dollarSaved}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mb-4 relative">
                      <Quote className="w-8 h-8 text-[#452415]/10 absolute -top-2 -left-1 pointer-events-none" />
                      <p className="text-xs sm:text-sm text-gray-700 italic pl-5 leading-relaxed font-serif">
                        &quot;{review.reviewText}&quot;
                      </p>
                    </div>

                    {/* Case Domain Pill */}
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 bg-[#FAF8F5] border border-gray-200 text-[#452415] text-[11px] font-bold px-3 py-1 rounded-xl">
                        <Briefcase className="w-3 h-3 text-[#452415]" />
                        <span>{review.caseType}</span>
                      </span>
                    </div>

                    {/* Bottom Row: Client Profile & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      {/* Client info */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#452415] text-white flex items-center justify-center font-heading font-extrabold text-xs shadow-sm shrink-0">
                          {(review.clientInitials || 'CL')
                            .split(' ')
                            .map((w) => w[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-[#1A1A1A]">
                            {review.clientInitials}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {review.clientRole && review.clientRole !== review.caseType
                              ? `${review.clientRole}${review.location ? ` • ${review.location}` : ''}`
                              : review.location || review.caseType}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleReviewStatus(review)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                            review.status === 'archived'
                              ? 'bg-[#612912]/5 hover:bg-[#612912]/10 text-[#612912]'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                          title={review.status === 'archived' ? 'Publish to Website' : 'Archive from Website'}
                        >
                          {review.status === 'archived' ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Archive</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditReview(review)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit Review Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmReview(review)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Reset link at bottom */}
                <div className="pt-4 flex items-center justify-between text-xs text-gray-400 px-2">
                  <span>Showing {filteredReviews.length} client reviews</span>
                  <button
                    type="button"
                    onClick={handleResetReviews}
                    className="hover:text-gray-600 underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restore default testimonials</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 11: LEGAL INSIGHTS & BLOG MANAGEMENT --- */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Header & Quick Action Toolbar */}
            <div className="bg-white p-6 rounded-3xl border border-[#452415]/15 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-[#E5B842] uppercase tracking-wider block">
                    Firm Publications &amp; Thought Leadership
                  </span>
                  <h1 className="text-2xl font-heading font-extrabold text-[#1A1A1A]">
                    Legal Insights &amp; Briefings Management
                  </h1>
                  <p className="text-xs text-[#5A6275]">
                    Publish and manage tax law updates, High Court writ analyses, FBR compliance guides, and corporate alerts.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenAddInsight}
                    className="bg-[#E5B842] hover:bg-[#E09415] text-[#1A1A1A] font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Legal Briefing</span>
                  </button>

                  <a
                    href="/insights"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-[#E5B842]" />
                    <span>View Public Insights</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleResetInsights}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2.5 rounded-2xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                    title="Restore default legal publications"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Action Success Alert Banner */}
              {insightActionSuccess && (
                <div className="bg-[#612912]/5 border border-[#612912]/20 text-[#452415] text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#612912] shrink-0" />
                  <span className="font-semibold">{insightActionSuccess}</span>
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Total Briefings
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#1A1A1A]">
                  {insights.length}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Authored publications
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Live on Website
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#452415]">
                  {insights.filter((i) => i.status === 'published' || !i.status).length}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Published articles
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Featured Articles
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#E5B842]">
                  {insights.filter((i) => i.featured !== false).length}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Homepage marquee feed
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Practice Topics
                </div>
                <div className="text-2xl font-heading font-extrabold text-[#612912]">
                  {new Set(insights.map((i) => i.category)).size}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Distinct legal categories
                </div>
              </div>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-[#452415]/15 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search insights by title, category, author, keywords, or takeaways..."
                    value={insightSearchTerm}
                    onChange={(e) => setInsightSearchTerm(e.target.value)}
                    className="w-full bg-[#FAF8F5] pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                  {insightSearchTerm && (
                    <button
                      onClick={() => setInsightSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <select
                    value={insightCategoryFilter}
                    onChange={(e) => setInsightCategoryFilter(e.target.value)}
                    className="bg-[#FAF8F5] px-3 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#452415]"
                  >
                    <option value="All">All Categories</option>
                    {Array.from(new Set(insights.map((i) => i.category))).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={insightStatusFilter}
                    onChange={(e) => setInsightStatusFilter(e.target.value)}
                    className="bg-[#FAF8F5] px-3 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#452415]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>

                  {(insightSearchTerm || insightCategoryFilter !== 'All' || insightStatusFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setInsightSearchTerm('');
                        setInsightCategoryFilter('All');
                        setInsightStatusFilter('All');
                      }}
                      className="px-3 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Legal Insights List */}
            {filteredInsights.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-heading font-extrabold text-base text-gray-800 mb-1">
                  No Legal Insights Found
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  No articles or briefings match your search criteria or category filters.
                </p>
                <button
                  onClick={handleOpenAddInsight}
                  className="bg-[#452415] hover:bg-[#612912] text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write First Legal Briefing</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInsights.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-5 border border-[#452415]/15 shadow-sm hover:shadow-md transition-all relative overflow-hidden space-y-4"
                  >
                    {/* Top Row: Category, Badges, Status & Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[#452415]/10 text-[#452415] text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Scale className="w-3 h-3 text-[#452415]" />
                          <span>{item.category}</span>
                        </span>

                        {item.featured !== false && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[#8F5605] bg-[#FAF3E6] border border-[#E5B842]/30 px-2.5 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-[#E5B842] fill-[#E5B842]" />
                            <span>Featured</span>
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            item.status === 'archived'
                              ? 'bg-gray-100 text-gray-600'
                              : item.status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#612912]/10 text-[#452415]'
                          }`}
                        >
                          {item.status === 'archived'
                            ? 'Archived'
                            : item.status === 'draft'
                            ? 'Draft'
                            : 'Published on Site'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.readTime || '5 min read'}</span>
                        </span>
                        <span>•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>

                    {/* Article Title & Excerpt */}
                    <div>
                      <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#1A1A1A] hover:text-[#452415] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-2">
                        {item.excerpt}
                      </p>
                    </div>

                    {/* Key Takeaways Preview */}
                    {item.keyTakeaways && item.keyTakeaways.length > 0 && (
                      <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-gray-100 space-y-1.5">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                          Key Counsel Takeaways:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#452415] shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{takeaway}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: Author details & Management Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      {/* Author */}
                      {(() => {
                        const authorName = typeof item.author === 'object' && item.author !== null ? item.author.name : String(item.author || 'Rahim Law Associates Counsel');
                        const authorRole = typeof item.author === 'object' && item.author !== null ? item.author.role : 'Advocate High Court | Associate Counsel';
                        const initials = authorName.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('');
                        return (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#612912] text-white flex items-center justify-center font-heading font-extrabold text-xs shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-[#1A1A1A]">{authorName}</div>
                              <div className="text-[10px] text-gray-500">{authorRole}</div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                        <a
                          href={`/insights/${item.slug || item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#612912]/10 hover:bg-[#612912]/20 text-[#612912] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open live briefing page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Public</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleInsightStatus(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                            item.status === 'archived'
                              ? 'bg-[#612912]/5 hover:bg-[#612912]/10 text-[#612912]'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                          title={item.status === 'archived' ? 'Publish to Website' : 'Archive from Website'}
                        >
                          {item.status === 'archived' ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Archive</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditInsight(item)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit Insight Article"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmInsight(item)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Reset & Count link at bottom */}
                <div className="pt-4 flex items-center justify-between text-xs text-gray-400 px-2">
                  <span>Showing {filteredInsights.length} legal publications</span>
                  <button
                    type="button"
                    onClick={handleResetInsights}
                    className="hover:text-gray-600 underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restore default firm articles</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- MOBILE APP STICKY BOTTOM QUICK NAV BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#612912] border-t border-[#452415] px-2 py-1 flex items-center justify-around text-[10px] font-bold text-amber-100 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center ${
            activeTab === 'dashboard' ? 'text-[#E5B842] font-extrabold scale-105' : 'hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cases')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center relative ${
            activeTab === 'cases' ? 'text-[#E5B842] font-extrabold scale-105' : 'hover:text-white'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>Cases</span>
          {cases.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#E5B842]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] justify-center relative ${
            activeTab === 'calendar' ? 'text-[#E5B842] font-extrabold scale-105' : 'hover:text-white'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>Calendar</span>
          {hearings.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#E5B842]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
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

      {/* --- MODALS --- */}

      {/* MODAL 1: COMPREHENSIVE NEW TAX CASE MODAL */}
      {showAddCaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#452415]/20 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wider block">Litigation Intake</span>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">Register New Tax Litigation File</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddCaseModal(false);
                  setIsAddingNewClientInCase(false);
                }}
                className="text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Court Writ Petition against Section 7E Deemed Tax Demand"
                  value={newCaseData.title}
                  onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={isAddingNewClientInCase ? 'sm:col-span-2' : ''}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="font-bold text-gray-700">
                      {isAddingNewClientInCase ? 'New Client Details' : 'Select Client'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewClientInCase(!isAddingNewClientInCase)}
                      className="text-[11px] font-extrabold text-[#612912] hover:text-[#452415] underline cursor-pointer whitespace-nowrap"
                    >
                      {isAddingNewClientInCase ? '← Select Existing Client' : '+ Add New Client'}
                    </button>
                  </div>

                  {!isAddingNewClientInCase ? (
                    <select
                      value={newCaseData.clientId}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_CLIENT__') {
                          setIsAddingNewClientInCase(true);
                        } else {
                          setNewCaseData({ ...newCaseData, clientId: e.target.value });
                        }
                      }}
                      className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (NTN: {c.ntn})
                        </option>
                      ))}
                      <option value="__NEW_CLIENT__">+ Add New Client...</option>
                    </select>
                  ) : (
                    <div className="bg-[#612912]/5 p-3 rounded-2xl border border-[#452415]/20 space-y-2.5">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">
                          New Client Name / Entity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Al-Farooq Traders or Muhammad Tariq"
                          value={newCaseClientDraft.name}
                          onChange={(e) =>
                            setNewCaseClientDraft({ ...newCaseClientDraft, name: e.target.value })
                          }
                          className="w-full bg-white p-2.5 rounded-xl border border-gray-200 font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">NTN Number (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. 3948572-9"
                            value={newCaseClientDraft.ntn}
                            onChange={(e) =>
                              setNewCaseClientDraft({ ...newCaseClientDraft, ntn: e.target.value })
                            }
                            className="w-full bg-white p-2 rounded-xl border border-gray-200 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">CNIC Number (Optional)</label>
                          <input
                            type="text"
                            placeholder="35202-1234567-1"
                            value={newCaseClientDraft.cnic}
                            onChange={(e) =>
                              setNewCaseClientDraft({ ...newCaseClientDraft, cnic: e.target.value })
                            }
                            className="w-full bg-white p-2 rounded-xl border border-gray-200 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Phone / WhatsApp (Optional)</label>
                          <input
                            type="text"
                            placeholder="+92 300 1234567"
                            value={newCaseClientDraft.phone}
                            onChange={(e) =>
                              setNewCaseClientDraft({ ...newCaseClientDraft, phone: e.target.value })
                            }
                            className="w-full bg-white p-2 rounded-xl border border-gray-200"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Client Email (Optional)</label>
                          <input
                            type="email"
                            placeholder="client@company.pk"
                            value={newCaseClientDraft.email}
                            onChange={(e) =>
                              setNewCaseClientDraft({ ...newCaseClientDraft, email: e.target.value })
                            }
                            className="w-full bg-white p-2 rounded-xl border border-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={isAddingNewClientInCase ? 'sm:col-span-2' : ''}>
                  <label className="font-bold text-gray-700 block mb-1">FBR CNO / Order No.</label>
                  <input
                    type="text"
                    placeholder="e.g. CNO-100008927"
                    value={newCaseData.cnoNumber}
                    onChange={(e) => setNewCaseData({ ...newCaseData, cnoNumber: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Legal Forum</label>
                  <select
                    value={newCaseData.forum}
                    onChange={(e) => setNewCaseData({ ...newCaseData, forum: e.target.value as LegalForum })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  >
                    <option value="Islamabad High Court (IHC)">Islamabad High Court (IHC)</option>
                    <option value="Appellate Tribunal Inland Revenue (ATIR)">Appellate Tribunal (ATIR)</option>
                    <option value="Commissioner Inland Revenue (Appeals)">CIR (Appeals)</option>
                    <option value="FBR RTO Islamabad">FBR RTO Islamabad</option>
                    <option value="FBR LTO Rawalpindi">FBR LTO Rawalpindi</option>
                    <option value="Supreme Court of Pakistan">Supreme Court of Pakistan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Section Code</label>
                  <input
                    type="text"
                    value={newCaseData.sectionCode}
                    onChange={(e) => setNewCaseData({ ...newCaseData, sectionCode: e.target.value })}
                    placeholder="122(5A), 177, 7E, 214C"
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tax Year</label>
                  <input
                    type="text"
                    value={newCaseData.taxYear}
                    onChange={(e) => setNewCaseData({ ...newCaseData, taxYear: e.target.value })}
                    placeholder="Tax Year 2025"
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Lead Counsel</label>
                  <select
                    value={newCaseData.assignedCounsel}
                    onChange={(e) => setNewCaseData({ ...newCaseData, assignedCounsel: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold"
                  >
                    {ADVOCATES.map((adv) => (
                      <option key={adv} value={adv}>
                        {adv}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Risk Level</label>
                  <select
                    value={newCaseData.riskLevel}
                    onChange={(e) => setNewCaseData({ ...newCaseData, riskLevel: e.target.value as RiskLevel })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Disputed Demand (PKR)</label>
                  <input
                    type="number"
                    value={newCaseData.demandAmountPkr}
                    onChange={(e) => setNewCaseData({ ...newCaseData, demandAmountPkr: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              {/* Hearing Schedule Block */}
              <div className="bg-[#612912]/5 p-3 rounded-2xl border border-[#452415]/20 space-y-2">
                <span className="font-extrabold text-[#452415] block">Initial Cause List Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Initial Hearing Date</label>
                    <input
                      type="date"
                      value={newCaseData.nextHearingDate}
                      onChange={(e) => setNewCaseData({ ...newCaseData, nextHearingDate: e.target.value })}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Hearing Purpose</label>
                    <input
                      type="text"
                      placeholder="e.g. Confirmation of Stay Order"
                      value={newCaseData.nextHearingPurpose}
                      onChange={(e) => setNewCaseData({ ...newCaseData, nextHearingPurpose: e.target.value })}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Case Summary & Legal Grounds</label>
                <textarea
                  rows={2}
                  placeholder="Summary of show cause notice, statutory grounds of writ or appeal..."
                  value={newCaseData.summary}
                  onChange={(e) => setNewCaseData({ ...newCaseData, summary: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Initial Privileged Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Check HC stay precedents for Sec 7E"
                    value={newCaseData.initialNote}
                    onChange={(e) => setNewCaseData({ ...newCaseData, initialNote: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Initial Associate Task (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Draft Writ Petition draft by Friday"
                    value={newCaseData.initialTask}
                    onChange={(e) => setNewCaseData({ ...newCaseData, initialTask: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              {/* Client Portal Credentials Block */}
              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-extrabold text-[#1A1A1A] text-xs block">🔐 Assign Client Portal Login (Optional)</span>
                  <span className="text-[10px] text-gray-600 font-bold">Allows client to sign-in to track this case</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Client Sign-In Email</label>
                    <input
                      type="email"
                      placeholder="client@company.pk"
                      value={newCaseData.clientLoginEmail || ''}
                      onChange={(e) => setNewCaseData({ ...newCaseData, clientLoginEmail: e.target.value })}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Client Password</label>
                    <input
                      type="text"
                      placeholder="Password123!"
                      value={newCaseData.clientLoginPassword || ''}
                      onChange={(e) => setNewCaseData({ ...newCaseData, clientLoginPassword: e.target.value })}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCaseModal(false);
                    setIsAddingNewClientInCase(false);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border text-gray-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-[#E5B842] hover:bg-[#E09415] text-[#1A1A1A] font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Register Case File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW CLIENT */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#452415]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">Register Client Profile</h3>
              <button onClick={() => setShowAddClientModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Client Full Name / Entity</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Farooq Traders"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">NTN Number</label>
                  <input
                    type="text"
                    required
                    placeholder="3948572-9"
                    value={newClientData.ntn}
                    onChange={(e) => setNewClientData({ ...newClientData, ntn: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">CNIC Number</label>
                  <input
                    type="text"
                    required
                    placeholder="35202-1234567-1"
                    value={newClientData.cnic}
                    onChange={(e) => setNewClientData({ ...newClientData, cnic: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={newClientData.phone}
                    onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.pk"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Set Client Portal Password</label>
                <input
                  type="text"
                  required
                  placeholder="Password123!"
                  value={newClientData.clientLoginPassword || 'Password123!'}
                  onChange={(e) => setNewClientData({ ...newClientData, clientLoginPassword: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-mono"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">Client can use this email & password to sign in to their Client Portal</span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border text-gray-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-[#612912] hover:bg-[#452415] text-white font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FBR NOTICES & PENDING REPLIES REGISTRY */}
      {showNoticesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] p-6 border border-[#452415]/20 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto pr-1">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full uppercase">
                      Statutory Compliance Desk
                    </span>
                    <span className="text-[10px] font-extrabold bg-[#612912] text-white px-2.5 py-0.5 rounded-full">
                      {notices.filter((n) => n.status === 'Pending Reply').length} Due Replies
                    </span>
                  </div>
                  <h2 className="text-xl font-heading font-extrabold text-[#1A1A1A]">
                    FBR Statutory Notices & Pending Replies
                  </h2>
                  <p className="text-xs text-gray-600">
                    Track show cause notices, audit calls, section 122/177 assessments, and manage due reply deadlines.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowAddNoticeModal(true);
                    }}
                    className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#E5B842]" />
                    <span>Log Notice</span>
                  </button>
                  <button
                    onClick={() => setShowNoticesModal(false)}
                    className="text-gray-400 hover:text-black font-extrabold p-1 text-base ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5] p-3 rounded-2xl border border-gray-200">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search CNO, Section, Client, Officer..."
                    value={noticeSearchTerm}
                    onChange={(e) => setNoticeSearchTerm(e.target.value)}
                    className="w-full bg-white pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 text-xs font-bold w-full sm:w-auto overflow-x-auto">
                  {[
                    { id: 'all', label: `All (${notices.length})` },
                    { id: 'Pending Reply', label: `Due Replies (${notices.filter((n) => n.status === 'Pending Reply').length})` },
                    { id: 'Challenged in Appeal', label: `In Appeal (${notices.filter((n) => n.status === 'Challenged in Appeal').length})` },
                    { id: 'Order Passed', label: `Orders (${notices.filter((n) => n.status === 'Order Passed').length})` }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setNoticeStatusFilter(f.id as any)}
                      className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        noticeStatusFilter === f.id
                          ? 'bg-[#612912] text-white font-extrabold shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Notices */}
              <div className="space-y-3">
                {notices
                  .filter((n) => {
                    const matchesFilter =
                      noticeStatusFilter === 'all' || n.status === noticeStatusFilter;
                    const q = noticeSearchTerm.toLowerCase().trim();
                    const matchesSearch =
                      !q ||
                      n.noticeTitle.toLowerCase().includes(q) ||
                      n.cnoNumber.toLowerCase().includes(q) ||
                      n.sectionCode.toLowerCase().includes(q) ||
                      n.clientName.toLowerCase().includes(q) ||
                      n.issuingOfficer.toLowerCase().includes(q);
                    return matchesFilter && matchesSearch;
                  })
                  .map((notice) => {
                    const linkedCase = cases.find((c) => c.id === notice.caseId);
                    const isPending = notice.status === 'Pending Reply';
                    return (
                      <div
                        key={notice.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isPending
                            ? 'bg-red-50/50 border-red-200 hover:border-red-400'
                            : 'bg-white border-gray-200 hover:border-[#612912]/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-extrabold text-[11px] bg-[#612912] text-white px-2 py-0.5 rounded">
                                {notice.cnoNumber}
                              </span>
                              <span className="font-extrabold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                u/s {notice.sectionCode}
                              </span>
                              <span className="text-xs font-extrabold text-gray-900">
                                {notice.clientName}
                              </span>
                            </div>
                            <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A] mt-1">
                              {notice.noticeTitle}
                            </h4>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <select
                              value={notice.status}
                              onChange={(e) => updateNoticeStatus(notice.id, e.target.value as any)}
                              className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border cursor-pointer ${
                                isPending
                                  ? 'bg-red-600 text-white border-red-700'
                                  : notice.status === 'Challenged in Appeal'
                                  ? 'bg-amber-500 text-black border-amber-600'
                                  : 'bg-[#452415] text-white border-[#452415]'
                              }`}
                            >
                              <option value="Pending Reply">⚠️ Pending Reply</option>
                              <option value="Challenged in Appeal">⚖️ Challenged in Appeal</option>
                              <option value="Order Passed">✅ Order Passed / Replied</option>
                            </select>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 my-2 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-gray-100">
                          {notice.summary}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-600 border-t pt-2 border-gray-100">
                          <div>
                            <span className="text-gray-400 block">Issuing Authority:</span>
                            <span className="font-semibold text-gray-800 truncate block">{notice.issuingOfficer}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Tax Year:</span>
                            <span className="font-extrabold text-[#452415]">{notice.taxYear}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Disputed Demand:</span>
                            <span className="font-extrabold text-red-700">
                              Rs. {(notice.disputedAmountPkr / 100000).toFixed(1)} Lakh
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Reply Due Date:</span>
                            <span className={`font-extrabold ${isPending ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                              {notice.dueDate} {isPending && '(Urgent)'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                          {linkedCase ? (
                            <button
                              onClick={() => {
                                setShowNoticesModal(false);
                                setSelectedCase(linkedCase);
                              }}
                              className="text-xs font-bold text-[#452415] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-[#E5B842]" />
                              <span>Open Linked Case [{linkedCase.caseRef}]</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No direct case file linked</span>
                          )}

                          <button
                            onClick={() => {
                              if (linkedCase) {
                                setShowNoticesModal(false);
                                setSelectedCase(linkedCase);
                                setCaseDetailTab('whatsapp');
                                setWaTemplateType('notice');
                              } else {
                                alert(`Notice Ref: ${notice.cnoNumber}\nClient: ${notice.clientName}\nDue Date: ${notice.dueDate}`);
                              }
                            }}
                            className="bg-[#25D366] hover:bg-[#612912] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp Client Alert</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowNoticesModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold px-5 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG FBR NOTICE */}
      {showAddNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#452415]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wider block">FBR Compliance</span>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">Log FBR Notice</h3>
              </div>
              <button onClick={() => setShowAddNoticeModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Select Case File <span className="text-red-500">*</span> (Syncs to Case Detail Page)
                </label>
                <SearchableCaseSelect
                  required
                  cases={cases}
                  value={newNoticeData.caseId}
                  onChange={(caseId) => {
                    const sel = cases.find((c) => c.id === caseId);
                    setNewNoticeData({
                      ...newNoticeData,
                      caseId: caseId,
                      clientId: sel ? sel.clientId : newNoticeData.clientId
                    });
                  }}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notice CNO Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNO-2026-991823"
                  value={newNoticeData.cnoNumber}
                  onChange={(e) => setNewNoticeData({ ...newNoticeData, cnoNumber: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Section Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 122(5A), 177, 7E, 214C"
                  value={newNoticeData.sectionCode}
                  onChange={(e) => setNewNoticeData({ ...newNoticeData, sectionCode: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notice Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Notice for Audit of Income Tax Return"
                  value={newNoticeData.noticeTitle}
                  onChange={(e) => setNewNoticeData({ ...newNoticeData, noticeTitle: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newNoticeData.dueDate}
                    onChange={(e) => setNewNoticeData({ ...newNoticeData, dueDate: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Demand Amount (PKR)</label>
                  <input
                    type="number"
                    value={newNoticeData.disputedAmountPkr}
                    onChange={(e) => setNewNoticeData({ ...newNoticeData, disputedAmountPkr: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddNoticeModal(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#612912] text-white font-extrabold shadow-sm"
                >
                  Save Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: UPLOAD DOCUMENT */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#452415]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wider block">Document Vault Intake</span>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">Upload Document to Case Vault</h3>
              </div>
              <button onClick={() => setShowAddDocModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Select Case File <span className="text-red-500">*</span> (Syncs to Case Detail Page)
                </label>
                <SearchableCaseSelect
                  required
                  cases={cases}
                  value={newDocData.caseId || cases[0]?.id || ''}
                  onChange={(caseId) => {
                    const sel = cases.find((c) => c.id === caseId);
                    setNewDocData({
                      ...newDocData,
                      caseId: caseId,
                      clientId: sel ? sel.clientId : (clients[0]?.id || '')
                    });
                  }}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified High Court Stay Order Copy"
                  value={newDocData.title}
                  onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category</label>
                  <select
                    value={newDocData.category}
                    onChange={(e) => setNewDocData({ ...newDocData, category: e.target.value as any })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold"
                  >
                    <option value="Court Order / Stay Order">Court Order / Stay Order</option>
                    <option value="Wakalatnama / Power of Attorney">Wakalatnama / Power of Attorney</option>
                    <option value="FBR Notice">FBR Notice</option>
                    <option value="Reply & Rebuttal">Reply & Rebuttal</option>
                    <option value="Tax Return & Wealth Statement">Tax Return & Wealth Statement</option>
                    <option value="Bank Statement">Bank Statement</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Uploaded By / Author</label>
                  <select
                    value={newDocData.uploadedBy}
                    onChange={(e) => setNewDocData({ ...newDocData, uploadedBy: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold"
                  >
                    {ADVOCATES.map((adv) => (
                      <option key={adv} value={adv}>
                        {adv}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-[#452415]/30 bg-[#FAF8F5] p-4 rounded-2xl text-center">
                <FolderOpen className="w-6 h-6 text-[#452415] mx-auto mb-1" />
                <div className="font-bold text-[#1A1A1A]">Drag & drop legal PDF / DOC file</div>
                <div className="text-[10px] text-[#5A6275] mt-0.5">High Court Stay Order, FBR Reply (Max 25MB)</div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="clientVisibleCheck"
                  checked={newDocData.isClientVisible}
                  onChange={(e) => setNewDocData({ ...newDocData, isClientVisible: e.target.checked })}
                  className="rounded border-gray-300 text-[#452415]"
                />
                <label htmlFor="clientVisibleCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Make document visible to client in Client Portal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#612912] text-white font-extrabold shadow-sm"
                >
                  Save & Sync to Case File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ISSUE INVOICE */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#452415]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wider block">Billing & Receivables</span>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">Issue Legal Fee Invoice</h3>
              </div>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Select Case File <span className="text-red-500">*</span> (Syncs to Case Detail Page)
                </label>
                <SearchableCaseSelect
                  required
                  cases={cases}
                  value={newInvoiceData.caseId}
                  onChange={(caseId) => {
                    const sel = cases.find((c) => c.id === caseId);
                    setNewInvoiceData({
                      ...newInvoiceData,
                      caseId: caseId,
                      clientId: sel ? sel.clientId : newInvoiceData.clientId
                    });
                  }}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Court Stay Order Retainer & Representation"
                  value={newInvoiceData.serviceDescription}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, serviceDescription: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Retainer Fee (PKR)</label>
                  <input
                    type="number"
                    value={newInvoiceData.retainerFeePkr}
                    onChange={(e) =>
                      setNewInvoiceData({
                        ...newInvoiceData,
                        retainerFeePkr: Number(e.target.value),
                        totalAmountPkr: Number(e.target.value) + newInvoiceData.hearingFeePkr
                      })
                    }
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Hearing Fee (PKR)</label>
                  <input
                    type="number"
                    value={newInvoiceData.hearingFeePkr}
                    onChange={(e) =>
                      setNewInvoiceData({
                        ...newInvoiceData,
                        hearingFeePkr: Number(e.target.value),
                        totalAmountPkr: newInvoiceData.retainerFeePkr + Number(e.target.value)
                      })
                    }
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-gray-200 flex justify-between font-extrabold text-[#452415]">
                <span>Total Fee Payable:</span>
                <span>Rs. {newInvoiceData.totalAmountPkr.toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E5B842] text-[#1A1A1A] font-extrabold shadow-sm"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: SCHEDULE HEARING */}
      {showAddHearingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#452415]/20 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">Schedule Court Hearing</h3>
              <button onClick={() => setShowAddHearingModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateHearing} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Case File</label>
                <SearchableCaseSelect
                  cases={cases}
                  value={newHearingData.caseId}
                  onChange={(caseId) => setNewHearingData({ ...newHearingData, caseId: caseId })}
                />
              </div>

              {/* Previous Hearing Record */}
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#612912]/15 space-y-2">
                <div className="text-[11px] font-extrabold text-[#452415]">Previous Hearing Record (What Happened Last Time)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block text-[10px] mb-0.5">Last Hearing Date</label>
                    <input
                      type="date"
                      value={newHearingData.previousHearingDate || ''}
                      onChange={(e) => setNewHearingData({ ...newHearingData, previousHearingDate: e.target.value })}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block text-[10px] mb-0.5">Forum</label>
                    <input
                      type="text"
                      value={newHearingData.forum}
                      onChange={(e) => setNewHearingData({ ...newHearingData, forum: e.target.value as LegalForum })}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block text-[10px] mb-0.5">Previous Hearing Outcome / Court Order</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Interim stay granted against FBR demand notice. Adjourned for arguments."
                    value={newHearingData.previousHearingOutcome || ''}
                    onChange={(e) => setNewHearingData({ ...newHearingData, previousHearingOutcome: e.target.value })}
                    className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs resize-none"
                  />
                </div>
              </div>

              {/* New Hearing Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">New Hearing Date</label>
                  <input
                    type="date"
                    required
                    value={newHearingData.date}
                    onChange={(e) => setNewHearingData({ ...newHearingData, date: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM"
                    value={newHearingData.time}
                    onChange={(e) => setNewHearingData({ ...newHearingData, time: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Next Hearing Purpose / Stage</label>
                <input
                  type="text"
                  required
                  placeholder="Arguments on Confirmation of Interim Stay Order"
                  value={newHearingData.purpose}
                  onChange={(e) => setNewHearingData({ ...newHearingData, purpose: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddHearingModal(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#612912] text-white font-extrabold shadow-sm"
                >
                  Save Cause List Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: WHATSAPP NOTIFICATION DISPATCHER */}
      {showSendNotifModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#452415]/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">Send Client WhatsApp Alert</h3>
              <button onClick={() => setShowSendNotifModal(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleSendNotif} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Channel</label>
                <select
                  value={notifData.type}
                  onChange={(e) => setNotifData({ ...notifData, type: e.target.value as any })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-[#452415]"
                >
                  <option value="WhatsApp">WhatsApp Instant Message</option>
                  <option value="Email">Official Client Email</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Recipient Phone / Email</label>
                <input
                  type="text"
                  required
                  value={notifData.recipientPhoneOrEmail}
                  onChange={(e) => setNotifData({ ...notifData, recipientPhoneOrEmail: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={notifData.title}
                  onChange={(e) => setNotifData({ ...notifData, title: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={notifData.message}
                  onChange={(e) => setNotifData({ ...notifData, message: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSendNotifModal(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#25D366] text-white font-extrabold shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Alert Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COMPREHENSIVE CASE DETAIL DRAWER (WITH CLICK OUTSIDE TO CLOSE) --- */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCase(null);
            }
          }}
        >
          <div className="bg-white w-full max-w-3xl h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-extrabold bg-[#612912] text-white px-2.5 py-0.5 rounded-md">
                      {selectedCase.caseRef}
                    </span>
                    <span className="text-xs font-bold text-[#452415] bg-[#612912]/10 px-2.5 py-0.5 rounded-md">
                      Tax Year {selectedCase.taxYear}
                    </span>
                  </div>
                  <h2 className="text-xl font-heading font-extrabold text-[#1A1A1A]">
                    {selectedCase.caseTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartEditCase}
                    className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                    title="Edit Case File Details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#E5B842]" />
                    <span>{isEditingCase ? 'Cancel Edit' : 'Edit Case'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCase(null);
                      setIsEditingCase(false);
                    }}
                    className="text-gray-400 hover:text-black font-extrabold p-1 text-base ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Navigation Tabs inside Case Detail Drawer */}
              <div className="flex items-center gap-1 border-b pb-2 text-xs font-bold overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview & Details' },
                  { id: 'notices', label: `FBR Notices (${notices.filter((n) => n.caseId === selectedCase.id).length})` },
                  { id: 'whatsapp', label: 'WhatsApp Alerts 💬' },
                  { id: 'tasks', label: `Tasks (${tasks.filter((t) => t.caseId === selectedCase.id).length})` },
                  { id: 'notes', label: `Notes (${notes.filter((n) => n.caseId === selectedCase.id).length})` },
                  { id: 'documents', label: `Docs (${documents.filter((d) => d.caseId === selectedCase.id).length})` },
                  { id: 'billing', label: `Invoices (${invoices.filter((i) => i.caseId === selectedCase.id).length})` }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCaseDetailTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                      caseDetailTab === t.id
                        ? 'bg-[#612912] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW & CASE DETAILS */}
              {caseDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* EDIT CASE DETAILS FORM */}
                  {isEditingCase ? (
                    <form onSubmit={handleSaveCaseEdit} className="bg-white p-5 rounded-2xl border-2 border-[#452415]/30 shadow-md space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b pb-3 font-heading font-extrabold text-sm text-[#612912]">
                        <span>Edit Case File Parameters</span>
                        <span className="text-xs text-gray-500 font-mono">Case ID: {selectedCase.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="font-bold text-gray-700 block mb-1">Case Title</label>
                          <input
                            type="text"
                            required
                            value={editCaseForm.caseTitle || ''}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, caseTitle: e.target.value })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-extrabold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">CNO / Case Reference No.</label>
                          <input
                            type="text"
                            required
                            value={editCaseForm.caseRef || ''}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, caseRef: e.target.value })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Tax Year</label>
                          <input
                            type="text"
                            required
                            value={editCaseForm.taxYear || ''}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, taxYear: e.target.value })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Legal Forum</label>
                          <select
                            value={editCaseForm.forum}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, forum: e.target.value as LegalForum })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-bold"
                          >
                            <option value="Islamabad High Court (IHC)">Islamabad High Court (IHC)</option>
                            <option value="Appellate Tribunal Inland Revenue (ATIR)">Appellate Tribunal (ATIR)</option>
                            <option value="Commissioner Inland Revenue (Appeals)">CIR (Appeals)</option>
                            <option value="FBR RTO Islamabad">FBR RTO Islamabad</option>
                            <option value="FBR LTO Rawalpindi">FBR LTO Rawalpindi</option>
                            <option value="Supreme Court of Pakistan">Supreme Court of Pakistan</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Case Status</label>
                          <select
                            value={editCaseForm.status}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, status: e.target.value as CaseStatus })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-bold text-[#452415]"
                          >
                            <option value="Notice Received">Notice Received</option>
                            <option value="Response Drafted">Response Drafted</option>
                            <option value="Under Audit">Under Audit</option>
                            <option value="CIR Appeal Pending">CIR Appeal Pending</option>
                            <option value="ATIR Tribunal Pending">ATIR Tribunal Pending</option>
                            <option value="High Court Writ Active">High Court Writ Active</option>
                            <option value="Stay Granted">Stay Granted</option>
                            <option value="Favorable Order Passed">Favorable Order Passed</option>
                            <option value="Closed & Settled">Closed & Settled</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Risk Level</label>
                          <select
                            value={editCaseForm.riskLevel}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, riskLevel: e.target.value as RiskLevel })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-bold"
                          >
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Demand Amount (PKR)</label>
                          <input
                            type="number"
                            value={editCaseForm.demandAmountPkr || 0}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, demandAmountPkr: Number(e.target.value) })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-mono font-bold text-red-700"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Tax Saved Amount (PKR)</label>
                          <input
                            type="number"
                            value={editCaseForm.savedAmountPkr || 0}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, savedAmountPkr: Number(e.target.value) })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-mono font-bold text-[#612912]"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Assigned Lead Counsel</label>
                          <input
                            type="text"
                            value={editCaseForm.assignedCounsel || ''}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, assignedCounsel: e.target.value })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 font-bold text-[#452415]"
                          />
                        </div>

                        {/* Client Portal Credentials Edit */}
                        <div className="sm:col-span-2 bg-[#612912]/5/60 p-3 rounded-xl border border-[#612912]/20/80 space-y-2">
                          <div className="text-[11px] font-extrabold text-[#612912] flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-[#452415]" />
                            <span>Client Portal Sign-In Credentials (Email & Password)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="font-bold text-gray-700 block text-[10px] mb-0.5">Client Portal Email</label>
                              <input
                                type="email"
                                required
                                value={editCaseForm.clientLoginEmail || ''}
                                onChange={(e) => setEditCaseForm({ ...editCaseForm, clientLoginEmail: e.target.value })}
                                placeholder="client@company.com"
                                className="w-full bg-white p-2 rounded-xl border border-gray-300 font-medium text-xs text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-gray-700 block text-[10px] mb-0.5">Client Portal Password</label>
                              <input
                                type="text"
                                required
                                value={editCaseForm.clientLoginPassword || ''}
                                onChange={(e) => setEditCaseForm({ ...editCaseForm, clientLoginPassword: e.target.value })}
                                placeholder="e.g. ClientPass123"
                                className="w-full bg-white p-2 rounded-xl border border-gray-300 font-mono text-xs text-gray-900"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-bold text-gray-700 block mb-1">Case Synopsis / Legal Summary</label>
                          <textarea
                            rows={3}
                            value={editCaseForm.summary || ''}
                            onChange={(e) => setEditCaseForm({ ...editCaseForm, summary: e.target.value })}
                            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-300 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => setIsEditingCase(false)}
                          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-[#612912] text-white font-extrabold shadow-sm hover:bg-[#452415]"
                        >
                          Save Case Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Case Info Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] p-4 rounded-2xl border border-gray-200 text-xs">
                      <div>
                        <span className="text-[#5A6275] block">Client Name:</span>
                        <span className="font-bold text-[#1A1A1A]">{selectedCase.clientName}</span>
                      </div>
                      <div>
                        <span className="text-[#5A6275] block">NTN Number:</span>
                        <span className="font-mono font-bold text-[#452415]">{selectedCase.clientNtn}</span>
                      </div>
                      <div>
                        <span className="text-[#5A6275] block">Lead Advocate:</span>
                        <span className="font-bold text-[#452415]">{selectedCase.assignedCounsel}</span>
                      </div>
                      <div>
                        <span className="text-[#5A6275] block">Tax Demand at Stake:</span>
                        <span className="font-extrabold text-red-700">
                          Rs. {(selectedCase.demandAmountPkr / 100000).toFixed(1)} Lakh
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hearing Management Card */}
                  <div className="bg-[#612912]/5 border border-[#452415]/20 p-5 rounded-2xl text-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#452415]/20 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-[#452415] block">
                          Listed Hearing & Cause List
                        </span>
                        <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                          {selectedCase.nextHearingDate
                            ? `Next Hearing: ${selectedCase.nextHearingDate}`
                            : 'No Upcoming Hearing Scheduled'}
                        </h4>
                      </div>

                      <button
                        onClick={handleStartEditHearing}
                        className="bg-[#612912] hover:bg-[#452415] text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E5B842]" />
                        <span>{isEditingCaseHearing ? 'Cancel Edit' : 'Add / Update Hearing'}</span>
                      </button>
                    </div>

                    {/* Inline Hearing Edit / Add Form */}
                    {isEditingCaseHearing ? (
                      <form onSubmit={handleSaveCaseHearing} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                        <div className="font-extrabold text-[#612912] text-xs">
                          Update Hearing Date & Cause List Details
                        </div>

                        {/* Previous Hearing Record */}
                        <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#612912]/15 space-y-2">
                          <div className="text-[11px] font-extrabold text-[#452415]">Previous Hearing Record (What Happened Last Time)</div>
                          <div>
                            <label className="font-bold text-gray-700 block text-[10px] mb-0.5">Previous Hearing Date</label>
                            <input
                              type="date"
                              value={caseHearingForm.previousHearingDate}
                              onChange={(e) => setCaseHearingForm({ ...caseHearingForm, previousHearingDate: e.target.value })}
                              className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block text-[10px] mb-0.5">Previous Hearing Outcome / Order Sheet Summary</label>
                            <textarea
                              rows={2}
                              placeholder="e.g. High Court issued interim stay order against FBR demand notice. Adjourned for arguments."
                              value={caseHearingForm.previousHearingOutcome}
                              onChange={(e) => setCaseHearingForm({ ...caseHearingForm, previousHearingOutcome: e.target.value })}
                              className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs resize-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">New Hearing Date</label>
                            <input
                              type="date"
                              required
                              value={caseHearingForm.date}
                              onChange={(e) => setCaseHearingForm({ ...caseHearingForm, date: e.target.value })}
                              className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200 font-bold"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Time</label>
                            <input
                              type="text"
                              required
                              value={caseHearingForm.time}
                              onChange={(e) => setCaseHearingForm({ ...caseHearingForm, time: e.target.value })}
                              className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Legal Forum</label>
                            <select
                              value={caseHearingForm.forum}
                              onChange={(e) =>
                                setCaseHearingForm({ ...caseHearingForm, forum: e.target.value as LegalForum })
                              }
                              className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200 font-bold"
                            >
                              <option value="Islamabad High Court (IHC)">Islamabad High Court (IHC)</option>
                              <option value="Appellate Tribunal Inland Revenue (ATIR)">Appellate Tribunal (ATIR)</option>
                              <option value="Commissioner Inland Revenue (Appeals)">CIR (Appeals)</option>
                              <option value="FBR RTO Islamabad">FBR RTO Islamabad</option>
                              <option value="FBR LTO Rawalpindi">FBR LTO Rawalpindi</option>
                              <option value="Supreme Court of Pakistan">Supreme Court of Pakistan</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Bench / Court Room</label>
                            <input
                              type="text"
                              placeholder="e.g. Division Bench - IHC"
                              value={caseHearingForm.bench}
                              onChange={(e) => setCaseHearingForm({ ...caseHearingForm, bench: e.target.value })}
                              className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Hearing Purpose / Stage</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Arguments on Interim Stay Extension"
                            value={caseHearingForm.purpose}
                            onChange={(e) => setCaseHearingForm({ ...caseHearingForm, purpose: e.target.value })}
                            className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Assigned Counsel</label>
                          <input
                            type="text"
                            value={caseHearingForm.counselAssigned}
                            onChange={(e) => setCaseHearingForm({ ...caseHearingForm, counselAssigned: e.target.value })}
                            className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-gray-200 font-bold text-[#452415]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setIsEditingCaseHearing(false)}
                            className="px-3 py-1.5 rounded-xl border text-gray-600 font-bold text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-xl bg-[#612912] text-white font-extrabold text-xs shadow-sm"
                          >
                            Save Hearing Schedule
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-200">
                          <div>
                            <span className="text-[10px] text-gray-500 block">Hearing Date:</span>
                            <span className="font-extrabold text-[#1A1A1A]">
                              {selectedCase.nextHearingDate || 'Pending Date'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 block">Forum / Court:</span>
                            <span className="font-bold text-[#452415]">{selectedCase.forum}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 block">Lead Advocate:</span>
                            <span className="font-bold text-[#1A1A1A]">{selectedCase.assignedCounsel}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-gray-500 block">Purpose / Stage:</span>
                          <p className="font-semibold text-gray-800">
                            {selectedCase.nextHearingPurpose || 'Cause list hearing appearance'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSendWhatsAppCaseReminder}
                              className="bg-[#25D366] hover:bg-[#612912] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send WhatsApp Alert</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleAddCaseToGoogleCalendar}
                              className="bg-amber-100 hover:bg-amber-200 text-[#1A1A1A] font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-amber-300"
                            >
                              <CalendarIcon className="w-3.5 h-3.5 text-[#452415]" />
                              <span>Google Calendar</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleStartEditHearing}
                            className="text-[#452415] hover:underline font-extrabold text-xs flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Reschedule / Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chronological Hearing Timeline */}
                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A] mb-3">Chronological Cause List History</h3>
                    <div className="space-y-3 relative pl-4 border-l-2 border-[#452415]/20">
                      {selectedCase.timeline.map((item) => (
                        <div key={item.id} className="relative bg-[#FAF8F5] p-3 rounded-2xl border border-gray-200 text-xs">
                          <div className="absolute -left-[23px] top-3 w-3 h-3 rounded-full bg-[#452415]" />
                          <div className="flex justify-between font-bold text-[#1A1A1A] mb-1">
                            <span>{item.title}</span>
                            <span className="text-[#452415]">{item.date}</span>
                          </div>
                          <p className="text-[#5A6275] mb-1">{item.description}</p>
                          {item.outcome && (
                            <div className="text-[11px] font-extrabold text-[#452415] bg-[#612912]/5 p-1.5 rounded-lg">
                              Outcome: {item.outcome}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CLIENT ACCESS CREDENTIALS SUMMARY CARD */}
                  {(() => {
                    const caseCred = clientCredentials.find(
                      (c) => c.clientId === selectedCase.clientId || (c.email && c.email.toLowerCase() === selectedCase.clientLoginEmail?.toLowerCase())
                    );
                    const displayEmail = caseCred?.email || selectedCase.clientLoginEmail || 'Not assigned yet';
                    const displayPass = caseCred?.password || selectedCase.clientLoginPassword || 'Not assigned yet';

                    return (
                      <div className="bg-[#612912]/5 border border-[#452415]/20 p-4 rounded-2xl space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-[#452415]/20 pb-2">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#452415]" />
                            <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                              Client Portal Access Credentials
                            </h4>
                          </div>
                          <button
                            onClick={handleStartEditCase}
                            className="text-[#452415] hover:underline font-extrabold text-xs flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Login Details
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-gray-200">
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold block">Client Portal Email:</span>
                            <span className="font-mono font-bold text-[#1A1A1A] select-all">{displayEmail}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold block">Client Password:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#452415] select-all">
                                {showClientPassword ? displayPass : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowClientPassword(!showClientPassword)}
                                className="text-[10px] text-gray-500 hover:text-black font-extrabold underline cursor-pointer"
                              >
                                {showClientPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* OVERVIEW SECTION: TASKS */}
                  {(() => {
                    const caseTasks = tasks.filter((t) => t.caseId === selectedCase.id);
                    return (
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-[#452415]" />
                            <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                              Case Tasks & Action Items ({caseTasks.length})
                            </h4>
                          </div>
                          <button
                            onClick={() => setCaseDetailTab('tasks')}
                            className="text-[#452415] hover:underline font-bold text-xs"
                          >
                            Manage Tasks &rarr;
                          </button>
                        </div>

                        {caseTasks.length === 0 ? (
                          <div className="p-3 text-center bg-[#FAF8F5] rounded-xl text-gray-500 text-[11px]">
                            No tasks created for this case yet. Click &quot;Manage Tasks&quot; to assign internal action items.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {caseTasks.map((task) => (
                              <div
                                key={task.id}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                  task.isCompleted ? 'bg-[#612912]/5/40 border-[#612912]/20 opacity-75' : 'bg-[#FAF8F5] border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={task.isCompleted}
                                    onChange={() => toggleTask(task.id)}
                                    className="rounded border-gray-300 text-[#612912] focus:ring-[#452415] w-4 h-4 cursor-pointer"
                                  />
                                  <span className={`font-semibold truncate ${task.isCompleted ? 'line-through text-gray-400' : 'text-[#1A1A1A]'}`}>
                                    {task.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded">
                                    {task.assignedTo}
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                      task.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* OVERVIEW SECTION: NOTES */}
                  {(() => {
                    const caseNotes = notes.filter((n) => n.caseId === selectedCase.id);
                    return (
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#452415]" />
                            <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                              Privileged Internal Legal Notes ({caseNotes.length})
                            </h4>
                          </div>
                          <button
                            onClick={() => setCaseDetailTab('notes')}
                            className="text-[#452415] hover:underline font-bold text-xs"
                          >
                            View All Notes &rarr;
                          </button>
                        </div>

                        {caseNotes.length === 0 ? (
                          <div className="p-3 text-center bg-[#FAF8F5] rounded-xl text-gray-500 text-[11px]">
                            No internal notes added for this case yet. Click &quot;View All Notes&quot; to record confidential attorney observations.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {caseNotes.map((note) => (
                              <div key={note.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-gray-200 space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                                  <span className="text-[#452415] font-extrabold">{note.author}</span>
                                  <span>{note.date}</span>
                                </div>
                                <p className="text-[#1A1A1A] text-xs whitespace-pre-line">{note.text || note.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* OVERVIEW SECTION: DOCUMENTS */}
                  {(() => {
                    const caseDocs = documents.filter((d) => d.caseId === selectedCase.id);
                    return (
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#452415]" />
                            <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                              Case Vault Documents ({caseDocs.length})
                            </h4>
                          </div>
                          <button
                            onClick={() => setCaseDetailTab('documents')}
                            className="text-[#452415] hover:underline font-bold text-xs"
                          >
                            Manage Vault &rarr;
                          </button>
                        </div>

                        {caseDocs.length === 0 ? (
                          <div className="p-3 text-center bg-[#FAF8F5] rounded-xl text-gray-500 text-[11px]">
                            No vault documents uploaded for this case file yet. Click &quot;Manage Vault&quot; to upload legal pleadings and petitions.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {caseDocs.map((docItem) => (
                              <div key={docItem.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <h5 className="font-bold text-[#1A1A1A] truncate text-xs">{docItem.title}</h5>
                                  <span className="text-[10px] text-gray-500 block">
                                    {docItem.category} • {docItem.fileSize}
                                  </span>
                                </div>
                                <a
                                  href={docItem.downloadUrl || '#'}
                                  download
                                  className="bg-[#612912]/10 hover:bg-[#E5B842]/20 text-[#452415] px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0"
                                >
                                  Download
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* OVERVIEW SECTION: INVOICES */}
                  {(() => {
                    const caseInvoices = invoices.filter((i) => i.caseId === selectedCase.id);
                    return (
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#452415]" />
                            <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                              Fee Invoices & Billing ({caseInvoices.length})
                            </h4>
                          </div>
                          <button
                            onClick={() => setCaseDetailTab('billing')}
                            className="text-[#452415] hover:underline font-bold text-xs"
                          >
                            Billing Ledger &rarr;
                          </button>
                        </div>

                        {caseInvoices.length === 0 ? (
                          <div className="p-3 text-center bg-[#FAF8F5] rounded-xl text-gray-500 text-[11px]">
                            No invoices issued for this case file yet. Click &quot;Billing Ledger&quot; to generate an advocate fee bill.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {caseInvoices.map((inv) => (
                              <div key={inv.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-between gap-2">
                                <div>
                                  <div className="font-mono font-bold text-[#612912] text-xs">{inv.invoiceNumber}</div>
                                  <div className="text-[11px] text-gray-600">{inv.serviceDescription}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-extrabold text-[#1A1A1A] text-xs">Rs. {inv.totalAmountPkr.toLocaleString()}</div>
                                  <span
                                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                                      inv.status === 'Paid' ? 'bg-[#612912]/10 text-[#452415]' : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB: LINKED FBR NOTICES */}
              {caseDetailTab === 'notices' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAF8F5] p-4 rounded-2xl border border-gray-200">
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                        Linked FBR Statutory Notices ({notices.filter((n) => n.caseId === selectedCase.id).length})
                      </h4>
                      <p className="text-xs text-gray-500">Track show cause notices, audit demands, and reply deadlines for this case file.</p>
                    </div>
                    <button
                      onClick={() => {
                        setNewNoticeData({ ...newNoticeData, caseId: selectedCase.id, clientId: selectedCase.clientId });
                        setShowAddNoticeModal(true);
                      }}
                      className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#E5B842]" />
                      <span>Log FBR Notice</span>
                    </button>
                  </div>

                  {notices.filter((n) => n.caseId === selectedCase.id).length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-gray-300 text-gray-500 text-xs space-y-2">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="font-bold">No FBR notices logged for this case file yet.</p>
                      <p className="text-gray-400">Click &quot;Log FBR Notice&quot; above to record a new show cause or assessment notice.</p>
                    </div>
                  ) : (
                    notices
                      .filter((n) => n.caseId === selectedCase.id)
                      .map((notice) => {
                        const isPending = notice.status === 'Pending Reply';
                        return (
                          <div
                            key={notice.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isPending ? 'bg-red-50/50 border-red-200' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-extrabold text-[10px] bg-[#612912] text-white px-2 py-0.5 rounded">
                                  {notice.cnoNumber}
                                </span>
                                <span className="font-extrabold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                  u/s {notice.sectionCode}
                                </span>
                              </div>

                              <select
                                value={notice.status}
                                onChange={(e) => updateNoticeStatus(notice.id, e.target.value as any)}
                                className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border cursor-pointer ${
                                  isPending
                                    ? 'bg-red-600 text-white border-red-700'
                                    : notice.status === 'Challenged in Appeal'
                                    ? 'bg-amber-500 text-black border-amber-600'
                                    : 'bg-[#452415] text-white border-[#452415]'
                                }`}
                              >
                                <option value="Pending Reply">⚠️ Pending Reply</option>
                                <option value="Challenged in Appeal">⚖️ Challenged in Appeal</option>
                                <option value="Order Passed">✅ Order Passed / Replied</option>
                              </select>
                            </div>

                            <h5 className="font-heading font-extrabold text-sm text-[#1A1A1A] mt-2">{notice.noticeTitle}</h5>
                            <p className="text-xs text-gray-600 my-1.5 leading-relaxed bg-white/80 p-2 rounded-xl border border-gray-100">
                              {notice.summary}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 pt-2 border-t border-gray-100">
                              <div>
                                <span className="text-gray-400 block">Issuing Officer:</span>
                                <span className="font-semibold text-gray-800 truncate block">{notice.issuingOfficer}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Disputed Demand:</span>
                                <span className="font-extrabold text-red-700">Rs. {(notice.disputedAmountPkr / 100000).toFixed(1)} Lakh</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Reply Due Date:</span>
                                <span className={`font-extrabold ${isPending ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                                  {notice.dueDate} {isPending && '(Urgent)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {/* TAB 2: WHATSAPP REMINDERS & TEMPLATES */}
              {caseDetailTab === 'whatsapp' && (
                <div className="space-y-5 text-xs">
                  {/* Recipient Info Card */}
                  <div className="bg-[#612912]/5 border border-[#452415]/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-[#452415]">Client Recipient Contact</div>
                      <div className="font-extrabold text-sm text-[#1A1A1A] mt-0.5">{selectedCase.clientName}</div>
                      <div className="text-gray-600 font-mono text-xs">
                        Phone: {clients.find((c) => c.id === selectedCase.clientId)?.phone || '+92 300 1234567'} • NTN: {selectedCase.clientNtn}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#612912]/10 text-[#452415] text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> Direct WhatsApp Connected
                      </span>
                    </div>
                  </div>

                  {/* Template Selector Cards */}
                  <div>
                    <label className="font-extrabold text-gray-800 block mb-2">Select Legal Dispatch Template:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'hearing', label: '1. Cause List & Hearing', icon: CalendarIcon },
                        { id: 'notice', label: '2. FBR Notice & Due Date', icon: FileText },
                        { id: 'invoice', label: '3. Fee Invoice & Bank', icon: Printer },
                        { id: 'stay', label: '4. High Court Stay Relief', icon: CheckCircle2 },
                        { id: 'custom', label: '5. Custom Message', icon: Edit3 }
                      ].map((tmpl) => {
                        const IconComp = tmpl.icon;
                        const isActive = waTemplateType === tmpl.id;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setWaTemplateType(tmpl.id as any)}
                            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                              isActive
                                ? 'bg-[#612912] text-white border-[#612912] shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#452415]'
                            }`}
                          >
                            <IconComp className={`w-4 h-4 mb-2 ${isActive ? 'text-[#E5B842]' : 'text-[#452415]'}`} />
                            <span className="font-extrabold text-[11px] leading-tight">{tmpl.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Message Field */}
                  {waTemplateType === 'custom' && (
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Custom Message Body:</label>
                      <textarea
                        rows={4}
                        value={waCustomMessage}
                        onChange={(e) => setWaCustomMessage(e.target.value)}
                        placeholder="Type custom legal update or instructions for the client..."
                        className="w-full bg-[#FAF8F5] p-3 rounded-2xl border border-gray-300 font-sans text-xs focus:ring-2 focus:ring-[#452415]"
                      />
                    </div>
                  )}

                  {/* WhatsApp Message Preview Box */}
                  <div className="bg-[#E5DDD5] p-4 rounded-3xl border border-[#452415]/20 shadow-inner">
                    <div className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>WhatsApp Format Preview</span>
                      <span className="text-[#612912] font-mono">Encrypted Client Dispatch</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm text-xs text-gray-800 space-y-2 whitespace-pre-line font-sans border-l-4 border-[#25D366]">
                      {getFormattedWhatsAppText()}
                    </div>
                  </div>

                  {/* Dispatch Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendWhatsAppDirect}
                        className="bg-[#25D366] hover:bg-[#612912] text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send via WhatsApp Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyWhatsAppText}
                        className="bg-white hover:bg-gray-100 text-[#1A1A1A] font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 border border-gray-300 shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#452415]" />
                        <span>{waCopiedNotice ? 'Copied!' : 'Copy Message'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogWhatsAppNotification}
                      className="bg-[#612912] hover:bg-[#452415] text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#E5B842]" />
                      <span>Log to Dispatch History</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS & ACTION ITEMS */}
              {caseDetailTab === 'tasks' && (
                <div className="space-y-6">
                  {/* Inline Add Task Form */}
                  <form onSubmit={handleAddInlineTask} className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-200 text-xs space-y-3">
                    <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">Add Task for this Case</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Task title (e.g. Draft Writ petition grounds)..."
                        value={inlineTask.title}
                        onChange={(e) => setInlineTask({ ...inlineTask, title: e.target.value })}
                        className="bg-white p-2 rounded-xl border border-gray-200 sm:col-span-2"
                      />
                      <input
                        type="date"
                        value={inlineTask.dueDate}
                        onChange={(e) => setInlineTask({ ...inlineTask, dueDate: e.target.value })}
                        className="bg-white p-2 rounded-xl border border-gray-200"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <select
                        value={inlineTask.assignedTo}
                        onChange={(e) => setInlineTask({ ...inlineTask, assignedTo: e.target.value })}
                        className="bg-white p-2 rounded-xl border border-gray-200 font-bold text-xs"
                      >
                        {ADVOCATES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        className="bg-[#612912] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E5B842]" /> Add Case Task
                      </button>
                    </div>
                  </form>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    {tasks.filter((t) => t.caseId === selectedCase.id).length === 0 ? (
                      <div className="text-center p-6 text-xs text-gray-500 bg-[#FAF8F5] rounded-2xl border">
                        No internal tasks added for this case yet.
                      </div>
                    ) : (
                      tasks
                        .filter((t) => t.caseId === selectedCase.id)
                        .map((t) => (
                          <div
                            key={t.id}
                            onClick={() => toggleTask(t.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                              t.isCompleted ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-[#452415]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={t.isCompleted}
                              onChange={() => {}}
                              className="mt-1 h-4 w-4 text-[#452415] rounded border-gray-300"
                            />
                            <div className="flex-1 text-xs">
                              <div className="flex justify-between font-bold text-[#1A1A1A]">
                                <span>{t.title}</span>
                                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px]">Due: {t.dueDate}</span>
                              </div>
                              <div className="text-[#5A6275] text-[11px] mt-1">
                                Assigned: <span className="font-bold text-[#452415]">{t.assignedTo}</span>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PRIVILEGED NOTES */}
              {caseDetailTab === 'notes' && (
                <div className="space-y-6">
                  {/* Inline Add Note Form */}
                  <form onSubmit={handleAddInlineNote} className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-200 text-xs space-y-3">
                    <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">Add Confidential Attorney Note</h4>
                    <textarea
                      rows={2}
                      required
                      placeholder="Enter legal strategy notes or client meeting summary..."
                      value={inlineNote.text}
                      onChange={(e) => setInlineNote({ ...inlineNote, text: e.target.value })}
                      className="w-full bg-white p-2.5 rounded-xl border border-gray-200"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#612912] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E5B842]" /> Save Note
                      </button>
                    </div>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {notes.filter((n) => n.caseId === selectedCase.id).length === 0 ? (
                      <div className="text-center p-6 text-xs text-gray-500 bg-[#FAF8F5] rounded-2xl border">
                        No attorney notes added for this case file yet.
                      </div>
                    ) : (
                      notes
                        .filter((n) => n.caseId === selectedCase.id)
                        .map((n) => (
                          <div key={n.id} className="p-4 rounded-2xl bg-[#612912]/5 border border-[#452415]/20 text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[#452415]">
                              <span>{n.author}</span>
                              <span className="text-[10px] text-gray-500">{n.date}</span>
                            </div>
                            <p className="text-gray-800 italic">{n.text}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CASE DOCUMENTS */}
              {caseDetailTab === 'documents' && (
                <div className="space-y-6">
                  {/* Inline Document Upload Form */}
                  <form onSubmit={handleAddInlineDoc} className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-200 text-xs space-y-3">
                    <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">Upload Case Document directly</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Document title (e.g. High Court Writ Order Sheet)..."
                        value={inlineDoc.title}
                        onChange={(e) => setInlineDoc({ ...inlineDoc, title: e.target.value })}
                        className="bg-white p-2 rounded-xl border border-gray-200"
                      />
                      <select
                        value={inlineDoc.category}
                        onChange={(e) => setInlineDoc({ ...inlineDoc, category: e.target.value as any })}
                        className="bg-white p-2 rounded-xl border border-gray-200 font-bold"
                      >
                        <option value="Court Order / Stay Order">Court Order / Stay Order</option>
                        <option value="Wakalatnama / Power of Attorney">Wakalatnama / Power of Attorney</option>
                        <option value="FBR Notice">FBR Notice</option>
                        <option value="Reply & Rebuttal">Reply & Rebuttal</option>
                        <option value="Tax Return & Wealth Statement">Tax Return & Wealth Statement</option>
                        <option value="Bank Statement">Bank Statement</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#612912] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#E5B842]" /> Upload to Case Vault
                      </button>
                    </div>
                  </form>

                  {/* Documents List */}
                  <div className="space-y-3">
                    {documents.filter((d) => d.caseId === selectedCase.id).length === 0 ? (
                      <div className="text-center p-6 text-xs text-gray-500 bg-[#FAF8F5] rounded-2xl border">
                        No documents attached to this case file yet.
                      </div>
                    ) : (
                      documents
                        .filter((d) => d.caseId === selectedCase.id)
                        .map((d) => (
                          <div
                            key={d.id}
                            className="p-3.5 rounded-2xl bg-white border border-gray-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="text-[10px] font-extrabold bg-[#452415]/10 text-[#452415] px-2 py-0.5 rounded">
                                {d.category}
                              </span>
                              <div className="font-extrabold text-[#1A1A1A] mt-1">{d.title}</div>
                              <div className="text-[10px] text-gray-500">
                                Uploaded on {d.uploadedAt} • Size: {d.fileSize}
                              </div>
                            </div>

                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Downloading ${d.title}...`);
                              }}
                              className="bg-[#612912] text-white p-2.5 rounded-xl hover:bg-[#452415]"
                            >
                              <Download className="w-4 h-4 text-[#E5B842]" />
                            </a>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: BILLING & INVOICES */}
              {caseDetailTab === 'billing' && (
                <div className="space-y-6">
                  {/* Inline Invoice Generator Form */}
                  <form onSubmit={handleAddInlineInvoice} className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-200 text-xs space-y-3">
                    <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">Generate Legal Fee Invoice for this Case</h4>
                    <input
                      type="text"
                      required
                      placeholder="Service description (e.g. High Court Representation Fee)..."
                      value={inlineInvoice.serviceDescription}
                      onChange={(e) => setInlineInvoice({ ...inlineInvoice, serviceDescription: e.target.value })}
                      className="w-full bg-white p-2 rounded-xl border border-gray-200"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-gray-600 block mb-1">Retainer (PKR)</label>
                        <input
                          type="number"
                          value={inlineInvoice.retainerFeePkr}
                          onChange={(e) => setInlineInvoice({ ...inlineInvoice, retainerFeePkr: Number(e.target.value) })}
                          className="w-full bg-white p-2 rounded-xl border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-600 block mb-1">Hearing Fee (PKR)</label>
                        <input
                          type="number"
                          value={inlineInvoice.hearingFeePkr}
                          onChange={(e) => setInlineInvoice({ ...inlineInvoice, hearingFeePkr: Number(e.target.value) })}
                          className="w-full bg-white p-2 rounded-xl border border-gray-200"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="font-extrabold text-[#452415]">
                        Total: Rs. {(inlineInvoice.retainerFeePkr + inlineInvoice.hearingFeePkr).toLocaleString()}
                      </div>

                      <button
                        type="submit"
                        className="bg-[#E5B842] text-[#1A1A1A] font-extrabold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Generate Invoice
                      </button>
                    </div>
                  </form>

                  {/* Invoices List for Case */}
                  <div className="space-y-3">
                    {invoices.filter((i) => i.caseId === selectedCase.id).length === 0 ? (
                      <div className="text-center p-6 text-xs text-gray-500 bg-[#FAF8F5] rounded-2xl border">
                        No invoices generated for this case file yet.
                      </div>
                    ) : (
                      invoices
                        .filter((i) => i.caseId === selectedCase.id)
                        .map((i) => (
                          <div
                            key={i.id}
                            className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-mono text-xs font-bold text-[#452415]">{i.invoiceNumber}</div>
                              <div className="font-extrabold text-[#1A1A1A] mt-0.5">{i.serviceDescription}</div>
                              <div className="text-[10px] text-gray-500">Issued: {i.issueDate} • Due: {i.dueDate}</div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                              <div className="flex items-center gap-2 justify-between sm:justify-end">
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                    i.status === 'Paid'
                                      ? 'bg-[#612912]/10 text-[#452415]'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {i.status}
                                </span>
                                <div className="font-extrabold text-[#452415] text-sm">
                                  Rs. {i.totalAmountPkr.toLocaleString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceForPdf(i)}
                                  className="bg-[#612912] hover:bg-[#452415] text-white px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#E5B842]" />
                                  <span>View / Print PDF</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceForPdf(i)}
                                  className="bg-[#25D366] hover:bg-[#612912] text-white px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-[#612912] text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs"
              >
                Close Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRACTICE AREA */}
      {showPracticeAreaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#452415]/20 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                  {editingPracticeArea ? `Edit: ${editingPracticeArea.title}` : 'Add New Practice Area'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Only the details displayed in the Practice Areas list and detail modal are needed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPracticeAreaModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePracticeArea} className="space-y-4 text-xs">
              {/* Field 1: Practice Area Name */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Practice Area Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate & Commercial"
                  value={paFormData.title}
                  onChange={(e) => setPaFormData({ ...paFormData, title: e.target.value })}
                  className="w-full bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                />
              </div>

              {/* Field 2: Short Summary (Homepage row) */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Short Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Concise 1-2 line summary shown on the Practice Areas list..."
                  value={paFormData.shortDesc}
                  onChange={(e) => setPaFormData({ ...paFormData, shortDesc: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415] leading-relaxed"
                />
              </div>

              {/* Field 3: Detailed Overview (Detail Modal) */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Detailed Overview <span className="text-gray-400 font-normal">(Modal View)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Expanded overview shown when a visitor clicks to view full details (defaults to Short Summary if blank)..."
                  value={paFormData.fullDesc}
                  onChange={(e) => setPaFormData({ ...paFormData, fullDesc: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415] leading-relaxed"
                />
              </div>

              {/* Field 4: Core Services */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Core Services
                  </label>
                  <span className="text-[10px] text-gray-400">Separate with commas</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Commercial Transactions, Corporate Structuring, Shareholder Arrangements"
                  value={paFormData.subServicesText}
                  onChange={(e) => setPaFormData({ ...paFormData, subServicesText: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415] leading-relaxed"
                />
              </div>

              {/* Field 5: Modal Banner Image */}
              <div className="space-y-2">
                <label className="font-bold text-gray-800 block">
                  Modal Banner Image <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-300 bg-gray-100">
                    <img
                      src={paFormData.image || FIRM_CONFIG.images.about}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Image URL or asset path..."
                    value={paFormData.image}
                    onChange={(e) => setPaFormData({ ...paFormData, image: e.target.value })}
                    className="flex-1 bg-[#FAF8F5] px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-bold">Quick Presets:</span>
                  {[
                    { label: 'Chambers Still-Life', url: FIRM_CONFIG.images.practiceCivil },
                    { label: 'Legal Library', url: FIRM_CONFIG.images.practiceCorporate }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPaFormData({ ...paFormData, image: preset.url })}
                      className="text-[10px] font-semibold bg-gray-100 hover:bg-[#612912] hover:text-white px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPracticeAreaModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{editingPracticeArea ? 'Save Changes' : 'Add Practice Area'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmArea && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-red-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-heading font-extrabold text-[#1A1A1A]">Delete Practice Area?</h3>
                <p className="text-[11px] text-gray-500">This action will remove the service across all platforms.</p>
              </div>
            </div>

            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-xs text-gray-700 space-y-1.5">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-black font-extrabold">&quot;{deleteConfirmArea.title}&quot;</strong>?
              </p>
              <p className="text-[11px] text-red-700">
                It will immediately disappear from the public website carousel, explore modal drawers, and footer service listings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmArea(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePracticeArea(deleteConfirmArea)}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TEAM MEMBER */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#452415]/20 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wider block">
                  Firm Leadership & Counsel
                </span>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                  {editingTeamMember ? 'Edit Team Member' : 'Add New Team Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-black font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTeamMember} className="space-y-4 text-xs">
              {/* Field 1: Full Name */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Rahim Nawaz Khan Abbasi"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                />
              </div>

              {/* Field 2: Designation & Pillar Watermark */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-800 block mb-1">
                    Designation / Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advocate High Court"
                    value={teamFormData.title}
                    onChange={(e) => setTeamFormData({ ...teamFormData, title: e.target.value })}
                    className="w-full bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">
                    Card Pillar Label
                  </label>
                  <input
                    type="text"
                    placeholder="FOUNDER / ADVOCATE"
                    value={teamFormData.pillarWatermark}
                    onChange={(e) => setTeamFormData({ ...teamFormData, pillarWatermark: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold uppercase focus:outline-none focus:border-[#452415]"
                  />
                </div>
              </div>

              {/* Field 3: Credentials */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Credentials <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Separate with commas (shown in profile header)</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advocate High Court, LL.M."
                  value={teamFormData.credentialsText}
                  onChange={(e) => setTeamFormData({ ...teamFormData, credentialsText: e.target.value })}
                  className="w-full bg-[#FAF8F5] px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                />
              </div>

              {/* Field 4: Areas of Specialization */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Areas of Specialization
                  </label>
                  <span className="text-[10px] text-gray-400">Separate with commas</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Corporate Structuring, FBR Tax Litigation, High Court Practice"
                  value={teamFormData.specialty}
                  onChange={(e) => setTeamFormData({ ...teamFormData, specialty: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415] leading-relaxed"
                />
              </div>

              {/* Field 5: Biography */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Biography <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Blank line separates paragraphs</span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter advocate background and legal practice summary..."
                  value={teamFormData.bio}
                  onChange={(e) => setTeamFormData({ ...teamFormData, bio: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415] leading-relaxed"
                />
              </div>

              {/* Field 6: Portrait Photo & Leftmost Pin */}
              <div className="space-y-2">
                <label className="font-bold text-gray-800 block">
                  Portrait Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-300 bg-gray-100">
                    <img
                      src={teamFormData.image || rahimMemberImg}
                      alt="Preview"
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Portrait image URL or asset path..."
                    value={teamFormData.image}
                    onChange={(e) => setTeamFormData({ ...teamFormData, image: e.target.value })}
                    className="flex-1 bg-[#FAF8F5] px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                </div>

                {/* Portrait presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-400 font-bold">Quick Presets:</span>
                  {[
                    { label: 'Mr. Rahim Abbasi', url: rahimMemberImg },
                    { label: 'Mr. Hasan Qamar', url: hasanImg },
                    { label: 'Ms. Mehak Ali', url: mehakImg },
                    { label: 'Barrister Khadija', url: khadijaImg }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTeamFormData({ ...teamFormData, image: preset.url })}
                      className="text-[10px] font-semibold bg-gray-100 hover:bg-[#612912] hover:text-white px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-[#FAF8F5] px-3 py-2 rounded-xl border border-gray-200 hover:border-amber-400">
                  <input
                    type="checkbox"
                    checked={teamFormData.stickToLeft}
                    onChange={(e) => setTeamFormData({ ...teamFormData, stickToLeft: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    Pin First on Left (Team Grid Order)
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#612912] hover:bg-[#452415] text-white font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>{editingTeamMember ? 'Save Changes' : 'Add Team Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE TEAM MEMBER CONFIRMATION */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-red-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-heading font-extrabold text-[#1A1A1A]">Remove Team Member?</h3>
                <p className="text-[11px] text-gray-500">This action will remove the advocate from the firm roster.</p>
              </div>
            </div>

            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-xs text-gray-700 space-y-1.5">
              <p>
                Are you sure you want to remove{' '}
                <strong className="text-black font-extrabold">&quot;{deleteConfirmMember.name}&quot;</strong> ({deleteConfirmMember.title})?
              </p>
              <p className="text-[11px] text-red-700">
                They will immediately disappear from the public website carousel, attorney roster, and direct consultation links.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTeamMember(deleteConfirmMember)}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CLIENT REVIEW */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#452415]/20 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wider block">
                  Website Testimonials
                </span>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                  {editingReview ? 'Edit Client Review' : 'Add New Client Review'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Only the details displayed in the public Client Testimonials carousel are requested.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-black font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              {/* Field 1: Client Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-800 block mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mahmood Butt"
                    value={reviewFormData.clientInitials}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, clientInitials: e.target.value })}
                    className="w-full bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Islamabad"
                    value={reviewFormData.location}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, location: e.target.value })}
                    className="w-full bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                </div>
              </div>

              {/* Field 2: Matter Area / Legal Domain with Quick Suggestions */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Matter Area / Legal Domain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate & Commercial Law"
                  value={reviewFormData.caseType}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, caseType: e.target.value })}
                  className="w-full bg-[#FAF8F5] px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Corporate & Commercial Law',
                    'Property & Real Estate Litigation',
                    'Family & Succession Matters',
                    'Tax & Regulatory Advisory',
                    'International & Cross-Border Counsel'
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setReviewFormData({ ...reviewFormData, caseType: sugg })}
                      className="text-[10px] bg-gray-100 hover:bg-[#452415]/10 text-gray-700 hover:text-[#452415] px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Testimonial Quote */}
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Testimonial Quote <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the client's testimonial quote shown in the public carousel..."
                  value={reviewFormData.reviewText}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, reviewText: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415] leading-relaxed"
                />
              </div>

              {/* Field 4: Published Status Toggle */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer bg-[#FAF8F5] p-3 rounded-xl border border-gray-200 hover:border-[#452415]">
                  <input
                    type="checkbox"
                    checked={reviewFormData.status === 'published'}
                    onChange={(e) =>
                      setReviewFormData({
                        ...reviewFormData,
                        status: e.target.checked ? 'published' : 'archived'
                      })
                    }
                    className="w-4 h-4 text-[#452415] rounded border-gray-300 focus:ring-[#452415] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-800 text-[11px] block">
                      Published on Public Site
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Visible in the homepage Client Testimonials carousel
                    </span>
                  </div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#452415] hover:bg-[#612912] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingReview ? 'Save Changes' : 'Publish Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE REVIEW CONFIRMATION */}
      {deleteConfirmReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-red-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-heading font-extrabold text-[#1A1A1A]">Delete Review?</h3>
                <p className="text-[11px] text-gray-500">This testimonial will be permanently removed.</p>
              </div>
            </div>

            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-xs text-gray-700 space-y-1.5">
              <p>
                Are you sure you want to remove the review from{' '}
                <strong className="text-black font-extrabold">&quot;{deleteConfirmReview.clientInitials}&quot;</strong>?
              </p>
              <p className="text-[11px] text-gray-500 italic">
                &quot;{deleteConfirmReview.reviewText.slice(0, 100)}...&quot;
              </p>
              <p className="text-[11px] text-red-700 font-medium">
                It will immediately be removed from the public website testimonial marquee.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmReview(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReview(deleteConfirmReview)}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT LEGAL INSIGHT --- */}
      {showInsightModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#452415]/20 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#E5B842] uppercase tracking-wider block">
                  Thought Leadership Desk
                </span>
                <h3 className="text-lg font-heading font-extrabold text-[#1A1A1A]">
                  {editingInsight ? 'Edit Legal Briefing' : 'Publish New Legal Insight'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInsightModal(false)}
                className="text-gray-400 hover:text-black font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInsight} className="space-y-4 text-xs">
              {/* Article Title & Practice Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">
                    Article Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Securing Interim Injunctions & Stay Orders in High Courts"
                    value={insightFormData.title}
                    onChange={(e) => setInsightFormData({ ...insightFormData, title: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#452415]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={insightFormData.category}
                    onChange={(e) => setInsightFormData({ ...insightFormData, category: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-[#452415] focus:outline-none focus:border-[#452415]"
                  >
                    <option value="Litigation & Dispute Resolution">Litigation &amp; Dispute Resolution</option>
                    <option value="Property & Real Estate">Property &amp; Real Estate</option>
                    <option value="Family & Private Client">Family &amp; Private Client</option>
                    <option value="Corporate & Commercial">Corporate &amp; Commercial</option>
                    <option value="International & Cross-Border">International &amp; Cross-Border</option>
                    <option value="Legal Research & Advisory">Legal Research &amp; Advisory</option>
                    {insightFormData.category &&
                      ![
                        'Litigation & Dispute Resolution',
                        'Property & Real Estate',
                        'Family & Private Client',
                        'Corporate & Commercial',
                        'International & Cross-Border',
                        'Legal Research & Advisory'
                      ].includes(insightFormData.category) && (
                        <option value={insightFormData.category}>{insightFormData.category}</option>
                      )}
                  </select>
                </div>
              </div>

              {/* Author Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Author Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={insightFormData.author}
                    onChange={(e) => setInsightFormData({ ...insightFormData, author: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-gray-800 focus:outline-none focus:border-[#452415]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Author Role
                  </label>
                  <input
                    type="text"
                    value={insightFormData.authorRole}
                    onChange={(e) => setInsightFormData({ ...insightFormData, authorRole: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-gray-700 focus:outline-none focus:border-[#452415]"
                    placeholder="Senior Counsel"
                  />
                </div>
              </div>

              {/* Date, Read Time & Publication Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Published Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={insightFormData.date}
                    onChange={(e) => setInsightFormData({ ...insightFormData, date: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-gray-700 focus:outline-none focus:border-[#452415]"
                    placeholder="e.g. Oct 14, 2026"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={insightFormData.readTime}
                    onChange={(e) => setInsightFormData({ ...insightFormData, readTime: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-gray-700 focus:outline-none focus:border-[#452415]"
                    placeholder="e.g. 6 min read"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Status
                  </label>
                  <select
                    value={insightFormData.status}
                    onChange={(e) =>
                      setInsightFormData({
                        ...insightFormData,
                        status: e.target.value as 'published' | 'draft' | 'archived'
                      })
                    }
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 font-bold text-[#452415] focus:outline-none focus:border-[#452415]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 block">
                  Cover Image
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-300 bg-gray-100">
                    <img
                      src={insightFormData.image || gavelImg}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Cover image URL or asset path..."
                    value={insightFormData.image}
                    onChange={(e) => setInsightFormData({ ...insightFormData, image: e.target.value })}
                    className="flex-1 bg-[#FAF8F5] px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-bold">Quick Presets:</span>
                  {[
                    { label: 'Court Gavel', url: gavelImg },
                    { label: 'Property & Title', url: crossBorderImg },
                    { label: 'Estate & Succession', url: successionImg },
                    { label: 'Corporate Dossier', url: dossierImg }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setInsightFormData({ ...insightFormData, image: preset.url })}
                      className="text-[10px] font-semibold bg-gray-100 hover:bg-[#612912] hover:text-white px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brief Excerpt / Overview */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Overview / Excerpt <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Concise 1-2 sentence overview displayed on insight cards..."
                  value={insightFormData.excerpt}
                  onChange={(e) => setInsightFormData({ ...insightFormData, excerpt: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 resize-none focus:outline-none focus:border-[#452415]"
                />
              </div>

              {/* Pull Quote */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Editorial Pull Quote <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Highlighted quote displayed in the article reading view (defaults to Overview if blank)..."
                  value={insightFormData.pullQuote}
                  onChange={(e) => setInsightFormData({ ...insightFormData, pullQuote: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#452415]"
                />
              </div>

              {/* Full Article Content */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Article Body Paragraphs <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Enter the full article body here. Separate paragraphs with an empty blank line..."
                  value={insightFormData.fullContentText}
                  onChange={(e) => setInsightFormData({ ...insightFormData, fullContentText: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs leading-relaxed focus:outline-none focus:border-[#452415]"
                />
              </div>

              {/* Key Takeaways & Applicable Statutes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Key Legal Takeaways <span className="text-gray-400 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key takeaway 1&#10;Key takeaway 2&#10;Key takeaway 3"
                    value={insightFormData.keyTakeawaysText}
                    onChange={(e) => setInsightFormData({ ...insightFormData, keyTakeawaysText: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs resize-none focus:outline-none focus:border-[#452415]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Applicable Statutes &amp; Forums <span className="text-gray-400 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Code of Civil Procedure 1908&#10;Companies Act 2017"
                    value={insightFormData.statutesReferencedText}
                    onChange={(e) => setInsightFormData({ ...insightFormData, statutesReferencedText: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-200 text-xs resize-none focus:outline-none focus:border-[#452415]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowInsightModal(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#612912] hover:bg-[#452415] text-white font-extrabold shadow-sm transition-colors cursor-pointer"
                >
                  {editingInsight ? 'Save Changes' : 'Publish Legal Briefing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRM DELETE LEGAL INSIGHT --- */}
      {deleteConfirmInsight && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-red-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                Delete Legal Briefing?
              </h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to delete the publication{' '}
                <strong className="text-black font-extrabold">
                  &quot;{deleteConfirmInsight.title}&quot;
                </strong>
                ?
              </p>
              <p className="text-[11px] text-red-700 font-medium bg-red-50 p-2 rounded-xl">
                This article will be immediately removed from the live website and public insights feed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmInsight(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInsight(deleteConfirmInsight)}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Legal PDF Invoice Modal */}
      {selectedInvoiceForPdf && (
        <InvoicePdfModal
          invoice={selectedInvoiceForPdf}
          client={clients.find((c) => c.id === selectedInvoiceForPdf.clientId)}
          caseFile={cases.find((c) => c.id === selectedInvoiceForPdf.caseId)}
          onClose={() => setSelectedInvoiceForPdf(null)}
          onMarkPaid={markInvoicePaid}
        />
      )}
    </div>
  );
};
