'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Client,
  CaseFile,
  FBRNotice,
  DocumentItem,
  InternalTask,
  InternalNote,
  Invoice,
  NotificationLog,
  HearingEvent,
  CaseStatus,
  LegalForum,
  RiskLevel,
  ClientCredential,
  PracticeArea,
  TeamMember,
  ReviewItem,
  LegalInsightItem
} from '../types/portal';
import {
  INITIAL_CLIENTS,
  INITIAL_CASES,
  INITIAL_NOTICES,
  INITIAL_DOCUMENTS,
  INITIAL_TASKS,
  INITIAL_NOTES,
  INITIAL_INVOICES,
  INITIAL_HEARINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLIENT_CREDENTIALS,
  INITIAL_PRACTICE_AREAS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_REVIEWS,
  INITIAL_INSIGHTS
} from '../data/portalSeedData';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  CLIENTS: 'rla_portal_clients_v2',
  CASES: 'rla_portal_cases_v2',
  NOTICES: 'rla_portal_notices_v2',
  DOCUMENTS: 'rla_portal_documents_v2',
  TASKS: 'rla_portal_tasks_v2',
  NOTES: 'rla_portal_notes_v2',
  INVOICES: 'rla_portal_invoices_v2',
  HEARINGS: 'rla_portal_hearings_v2',
  NOTIFICATIONS: 'rla_portal_notifications_v2',
  CLIENT_CREDENTIALS: 'rla_portal_client_credentials_v2',
  PRACTICE_AREAS: 'rla_portal_practice_areas_v4',
  TEAM_MEMBERS: 'rla_portal_team_members_v4',
  REVIEWS: 'rla_portal_reviews_v4',
  INSIGHTS: 'rla_portal_insights_v4',
  LEGAL_FORUMS: 'rla_portal_custom_legal_forums_v1'
};

const createUniqueId = (prefix: string) => `${prefix}-${Date.now().toString().slice(-4)}`;
const createFullTimestampId = (prefix: string) => `${prefix}-${Date.now()}`;
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getCurrentYearNumber = () => new Date().getFullYear();
const getRandom3DigitNum = () => Math.floor(100 + Math.random() * 900);

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

function usePortalStoreState() {
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CLIENTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [cases, setCases] = useState<CaseFile[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CASES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASES);
      return saved ? JSON.parse(saved) : INITIAL_CASES;
    } catch {
      return INITIAL_CASES;
    }
  });

  const [notices, setNotices] = useState<FBRNotice[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTICES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTICES);
      return saved ? JSON.parse(saved) : INITIAL_NOTICES;
    } catch {
      return INITIAL_NOTICES;
    }
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_DOCUMENTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [tasks, setTasks] = useState<InternalTask[]>(() => {
    if (typeof window === 'undefined') return INITIAL_TASKS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [notes, setNotes] = useState<InternalNote[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window === 'undefined') return INITIAL_INVOICES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [hearings, setHearings] = useState<HearingEvent[]>(() => {
    if (typeof window === 'undefined') return INITIAL_HEARINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HEARINGS);
      return saved ? JSON.parse(saved) : INITIAL_HEARINGS;
    } catch {
      return INITIAL_HEARINGS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [clientCredentials, setClientCredentials] = useState<ClientCredential[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CLIENT_CREDENTIALS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENT_CREDENTIALS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENT_CREDENTIALS;
    } catch {
      return INITIAL_CLIENT_CREDENTIALS;
    }
  });

  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>(() => {
    if (typeof window === 'undefined') return INITIAL_PRACTICE_AREAS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRACTICE_AREAS);
      return saved ? JSON.parse(saved) : INITIAL_PRACTICE_AREAS;
    } catch {
      return INITIAL_PRACTICE_AREAS;
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    if (typeof window === 'undefined') return INITIAL_TEAM_MEMBERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
      return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
    } catch {
      return INITIAL_TEAM_MEMBERS;
    }
  });

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_REVIEWS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const [insights, setInsights] = useState<LegalInsightItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_INSIGHTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
      return saved ? JSON.parse(saved) : INITIAL_INSIGHTS;
    } catch {
      return INITIAL_INSIGHTS;
    }
  });

  const [customLegalForums, setCustomLegalForums] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEGAL_FORUMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const [authUid, setAuthUid] = useState<string | null>(() => auth.currentUser?.uid || null);
  const migratedCollectionsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUid(user?.uid || null);
    });
    return () => unsubAuth();
  }, []);

  // Helper to sync to Firestore and local storage
  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const saveToFirestoreDoc = async (colName: string, id: string, data: any) => {
    try {
      await setDoc(doc(db, colName, id), stripUndefined(data), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colName}/${id}`);
    }
  };

  const deleteFromFirestoreDoc = async (colName: string, id: string) => {
    try {
      await deleteDoc(doc(db, colName, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colName}/${id}`);
    }
  };

  const markCollectionSeeded = (colName: string) => {
    migratedCollectionsRef.current[colName] = true;
    try {
      const raw = localStorage.getItem('rla_portal_seeded_cols_v1');
      const setObj = raw ? JSON.parse(raw) : {};
      if (!setObj[colName]) {
        setObj[colName] = true;
        localStorage.setItem('rla_portal_seeded_cols_v1', JSON.stringify(setObj));
      }
    } catch {
      // ignore storage errors
    }
  };

  const wasCollectionSeeded = (colName: string): boolean => {
    if (migratedCollectionsRef.current[colName]) return true;
    try {
      const raw = localStorage.getItem('rla_portal_seeded_cols_v1');
      if (!raw) return false;
      const setObj = JSON.parse(raw);
      return !!setObj[colName];
    } catch {
      return false;
    }
  };

  // Setup Firestore Real-time Listeners and Auto-Seed if empty (when authenticated)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Clients
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('clients')) {
          if (auth.currentUser) {
            markCollectionSeeded('clients');
            INITIAL_CLIENTS.forEach((c) => saveToFirestoreDoc('clients', c.id, c));
          }
        } else {
          setClients([]);
          saveToStorage(STORAGE_KEYS.CLIENTS, []);
        }
      } else {
        markCollectionSeeded('clients');
        const items = snap.docs.map((d) => d.data() as Client);
        setClients(items);
        saveToStorage(STORAGE_KEYS.CLIENTS, items);
      }
    }, (err) => console.warn('Clients snapshot error:', err));

    // 2. Cases
    const unsubCases = onSnapshot(collection(db, 'cases'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('cases')) {
          if (auth.currentUser) {
            markCollectionSeeded('cases');
            INITIAL_CASES.forEach((c) => saveToFirestoreDoc('cases', c.id, c));
          }
        } else {
          setCases([]);
          saveToStorage(STORAGE_KEYS.CASES, []);
        }
      } else {
        markCollectionSeeded('cases');
        const items = snap.docs.map((d) => d.data() as CaseFile);
        setCases(items);
        saveToStorage(STORAGE_KEYS.CASES, items);
      }
    }, (err) => console.warn('Cases snapshot error:', err));

    // 3. Notices
    const unsubNotices = onSnapshot(collection(db, 'notices'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('notices')) {
          if (auth.currentUser) {
            markCollectionSeeded('notices');
            INITIAL_NOTICES.forEach((n) => saveToFirestoreDoc('notices', n.id, n));
          }
        } else {
          setNotices([]);
          saveToStorage(STORAGE_KEYS.NOTICES, []);
        }
      } else {
        markCollectionSeeded('notices');
        const items = snap.docs.map((d) => d.data() as FBRNotice);
        setNotices(items);
        saveToStorage(STORAGE_KEYS.NOTICES, items);
      }
    }, (err) => console.warn('Notices snapshot error:', err));

    // 4. Documents
    const unsubDocs = onSnapshot(collection(db, 'documents'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('documents')) {
          if (auth.currentUser) {
            markCollectionSeeded('documents');
            INITIAL_DOCUMENTS.forEach((d) => saveToFirestoreDoc('documents', d.id, d));
          }
        } else {
          setDocuments([]);
          saveToStorage(STORAGE_KEYS.DOCUMENTS, []);
        }
      } else {
        markCollectionSeeded('documents');
        const items = snap.docs.map((d) => d.data() as DocumentItem);
        setDocuments(items);
        saveToStorage(STORAGE_KEYS.DOCUMENTS, items);
      }
    }, (err) => console.warn('Documents snapshot error:', err));

    // 5. Tasks
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('tasks')) {
          if (auth.currentUser) {
            markCollectionSeeded('tasks');
            INITIAL_TASKS.forEach((t) => saveToFirestoreDoc('tasks', t.id, t));
          }
        } else {
          setTasks([]);
          saveToStorage(STORAGE_KEYS.TASKS, []);
        }
      } else {
        markCollectionSeeded('tasks');
        const items = snap.docs.map((d) => d.data() as InternalTask);
        setTasks(items);
        saveToStorage(STORAGE_KEYS.TASKS, items);
      }
    }, (err) => console.warn('Tasks snapshot error:', err));

    // 6. Notes
    const unsubNotes = onSnapshot(collection(db, 'notes'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('notes')) {
          if (auth.currentUser) {
            markCollectionSeeded('notes');
            INITIAL_NOTES.forEach((n) => saveToFirestoreDoc('notes', n.id, n));
          }
        } else {
          setNotes([]);
          saveToStorage(STORAGE_KEYS.NOTES, []);
        }
      } else {
        markCollectionSeeded('notes');
        const items = snap.docs.map((d) => d.data() as InternalNote);
        setNotes(items);
        saveToStorage(STORAGE_KEYS.NOTES, items);
      }
    }, (err) => console.warn('Notes snapshot error:', err));

    // 7. Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('invoices')) {
          if (auth.currentUser) {
            markCollectionSeeded('invoices');
            INITIAL_INVOICES.forEach((i) => saveToFirestoreDoc('invoices', i.id, i));
          }
        } else {
          setInvoices([]);
          saveToStorage(STORAGE_KEYS.INVOICES, []);
        }
      } else {
        markCollectionSeeded('invoices');
        const items = snap.docs.map((d) => d.data() as Invoice);
        setInvoices(items);
        saveToStorage(STORAGE_KEYS.INVOICES, items);
      }
    }, (err) => console.warn('Invoices snapshot error:', err));

    // 8. Hearings
    const unsubHearings = onSnapshot(collection(db, 'hearings'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('hearings')) {
          if (auth.currentUser) {
            markCollectionSeeded('hearings');
            INITIAL_HEARINGS.forEach((h) => saveToFirestoreDoc('hearings', h.id, h));
          }
        } else {
          setHearings([]);
          saveToStorage(STORAGE_KEYS.HEARINGS, []);
        }
      } else {
        markCollectionSeeded('hearings');
        const items = snap.docs.map((d) => d.data() as HearingEvent);
        setHearings(items);
        saveToStorage(STORAGE_KEYS.HEARINGS, items);
      }
    }, (err) => console.warn('Hearings snapshot error:', err));

    // 9. Notifications
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('notifications')) {
          if (auth.currentUser) {
            markCollectionSeeded('notifications');
            INITIAL_NOTIFICATIONS.forEach((n) => saveToFirestoreDoc('notifications', n.id, n));
          }
        } else {
          setNotifications([]);
          saveToStorage(STORAGE_KEYS.NOTIFICATIONS, []);
        }
      } else {
        markCollectionSeeded('notifications');
        const items = snap.docs.map((d) => d.data() as NotificationLog);
        setNotifications(items);
        saveToStorage(STORAGE_KEYS.NOTIFICATIONS, items);
      }
    }, (err) => console.warn('Notifications snapshot error:', err));

    // 10. Client Credentials
    const unsubCreds = onSnapshot(collection(db, 'clientCredentials'), (snap) => {
      if (snap.empty) {
        if (!wasCollectionSeeded('clientCredentials')) {
          if (auth.currentUser) {
            markCollectionSeeded('clientCredentials');
            INITIAL_CLIENT_CREDENTIALS.forEach((c) => saveToFirestoreDoc('clientCredentials', c.id, c));
          }
        } else {
          setClientCredentials([]);
          saveToStorage(STORAGE_KEYS.CLIENT_CREDENTIALS, []);
        }
      } else {
        markCollectionSeeded('clientCredentials');
        const items = snap.docs.map((d) => d.data() as ClientCredential);
        setClientCredentials(items);
        saveToStorage(STORAGE_KEYS.CLIENT_CREDENTIALS, items);
      }
    }, (err) => console.warn('Client Credentials snapshot error:', err));

    // 11. Practice Areas
    const unsubPracticeAreas = onSnapshot(collection(db, 'practice_areas'), (snap) => {
      if (snap.empty) {
        setPracticeAreas(INITIAL_PRACTICE_AREAS);
        saveToStorage(STORAGE_KEYS.PRACTICE_AREAS, INITIAL_PRACTICE_AREAS);
        if (auth.currentUser && !migratedCollectionsRef.current.practice_areas) {
          migratedCollectionsRef.current.practice_areas = true;
          INITIAL_PRACTICE_AREAS.forEach((pa) => saveToFirestoreDoc('practice_areas', pa.id, pa));
        }
      } else {
        const docIds = snap.docs.map((d) => d.id);
        const hasLegacy = docIds.includes('litigation-arbitration-white-collar');
        const hasCurrent = docIds.includes('litigation-dispute-resolution');
        if (hasLegacy && !hasCurrent) {
          setPracticeAreas(INITIAL_PRACTICE_AREAS);
          saveToStorage(STORAGE_KEYS.PRACTICE_AREAS, INITIAL_PRACTICE_AREAS);
          if (auth.currentUser && !migratedCollectionsRef.current.practice_areas) {
            migratedCollectionsRef.current.practice_areas = true;
            const initialIds = new Set(INITIAL_PRACTICE_AREAS.map((pa) => pa.id));
            docIds.filter((id) => !initialIds.has(id)).forEach((id) => deleteFromFirestoreDoc('practice_areas', id));
            INITIAL_PRACTICE_AREAS.forEach((pa) => saveToFirestoreDoc('practice_areas', pa.id, pa));
          }
        } else {
          const items = snap.docs.map((d) => d.data() as PracticeArea);
          setPracticeAreas(items);
          saveToStorage(STORAGE_KEYS.PRACTICE_AREAS, items);
        }
      }
    }, (err) => console.warn('Practice Areas snapshot error:', err));

    // 12. Team Members
    const unsubTeam = onSnapshot(collection(db, 'team_members'), (snap) => {
      if (snap.empty) {
        setTeamMembers(INITIAL_TEAM_MEMBERS);
        saveToStorage(STORAGE_KEYS.TEAM_MEMBERS, INITIAL_TEAM_MEMBERS);
        if (auth.currentUser && !migratedCollectionsRef.current.team_members) {
          migratedCollectionsRef.current.team_members = true;
          INITIAL_TEAM_MEMBERS.forEach((m) => saveToFirestoreDoc('team_members', m.id, m));
        }
      } else {
        const docIds = snap.docs.map((d) => d.id);
        const hasLegacy = docIds.includes('mirza-ahmed-raza');
        const hasCurrent = docIds.includes('hasan-qamar');
        if (hasLegacy && !hasCurrent) {
          setTeamMembers(INITIAL_TEAM_MEMBERS);
          saveToStorage(STORAGE_KEYS.TEAM_MEMBERS, INITIAL_TEAM_MEMBERS);
          if (auth.currentUser && !migratedCollectionsRef.current.team_members) {
            migratedCollectionsRef.current.team_members = true;
            const initialIds = new Set(INITIAL_TEAM_MEMBERS.map((m) => m.id));
            docIds.filter((id) => !initialIds.has(id)).forEach((id) => deleteFromFirestoreDoc('team_members', id));
            INITIAL_TEAM_MEMBERS.forEach((m) => saveToFirestoreDoc('team_members', m.id, m));
          }
        } else {
          const items = snap.docs.map((d) => d.data() as TeamMember);
          items.sort((a, b) => {
            if (a.isCeo && !b.isCeo) return -1;
            if (!a.isCeo && b.isCeo) return 1;
            return (a.order || 99) - (b.order || 99);
          });
          setTeamMembers(items);
          saveToStorage(STORAGE_KEYS.TEAM_MEMBERS, items);
        }
      }
    }, (err) => console.warn('Team Members snapshot error:', err));

    // 13. Client Reviews & Testimonials
    const unsubReviews = onSnapshot(collection(db, 'client_reviews'), (snap) => {
      if (snap.empty) {
        setReviews(INITIAL_REVIEWS);
        saveToStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
        if (auth.currentUser && !migratedCollectionsRef.current.client_reviews) {
          migratedCollectionsRef.current.client_reviews = true;
          INITIAL_REVIEWS.forEach((r) => saveToFirestoreDoc('client_reviews', r.id, r));
        }
      } else {
        const docIds = snap.docs.map((d) => d.id);
        const hasLegacy = docIds.includes('rev-1');
        const hasCurrent = docIds.includes('t1');
        if (hasLegacy && !hasCurrent) {
          setReviews(INITIAL_REVIEWS);
          saveToStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
          if (auth.currentUser && !migratedCollectionsRef.current.client_reviews) {
            migratedCollectionsRef.current.client_reviews = true;
            const initialIds = new Set(INITIAL_REVIEWS.map((r) => r.id));
            docIds.filter((id) => !initialIds.has(id)).forEach((id) => deleteFromFirestoreDoc('client_reviews', id));
            INITIAL_REVIEWS.forEach((r) => saveToFirestoreDoc('client_reviews', r.id, r));
          }
        } else {
          const items = snap.docs.map((d) => d.data() as ReviewItem);
          setReviews(items);
          saveToStorage(STORAGE_KEYS.REVIEWS, items);
        }
      }
    }, (err) => console.warn('Client Reviews snapshot error:', err));

    // 14. Legal Insights & Blog Articles
    const unsubInsights = onSnapshot(collection(db, 'legal_insights'), (snap) => {
      if (snap.empty) {
        setInsights(INITIAL_INSIGHTS);
        saveToStorage(STORAGE_KEYS.INSIGHTS, INITIAL_INSIGHTS);
        if (auth.currentUser && !migratedCollectionsRef.current.legal_insights) {
          migratedCollectionsRef.current.legal_insights = true;
          INITIAL_INSIGHTS.forEach((ins) => saveToFirestoreDoc('legal_insights', ins.id, ins));
        }
      } else {
        const docIds = snap.docs.map((d) => d.id);
        const hasLegacy = docIds.includes('fbr-tax-slabs-2024-2025');
        const hasCurrent = docIds.includes('high-court-stay-orders-interim-relief-pakistan');
        if (hasLegacy && !hasCurrent) {
          setInsights(INITIAL_INSIGHTS);
          saveToStorage(STORAGE_KEYS.INSIGHTS, INITIAL_INSIGHTS);
          if (auth.currentUser && !migratedCollectionsRef.current.legal_insights) {
            migratedCollectionsRef.current.legal_insights = true;
            const initialIds = new Set(INITIAL_INSIGHTS.map((ins) => ins.id));
            docIds.filter((id) => !initialIds.has(id)).forEach((id) => deleteFromFirestoreDoc('legal_insights', id));
            INITIAL_INSIGHTS.forEach((ins) => saveToFirestoreDoc('legal_insights', ins.id, ins));
          }
        } else {
          const items = snap.docs.map((d) => d.data() as LegalInsightItem);
          setInsights(items);
          saveToStorage(STORAGE_KEYS.INSIGHTS, items);
        }
      }
    }, (err) => console.warn('Legal Insights snapshot error:', err));

    // 15. Custom Legal Forums
    let unsubForums = () => {};
    if (auth.currentUser) {
      unsubForums = onSnapshot(
        collection(db, 'legal_forums'),
        (snap) => {
          if (!snap.empty) {
            const remoteNames = snap.docs
              .map((d) => (d.data() as { name?: string })?.name)
              .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
            if (remoteNames.length > 0) {
              setCustomLegalForums((prev) => {
                const merged = Array.from(new Set([...remoteNames, ...prev]));
                saveToStorage(STORAGE_KEYS.LEGAL_FORUMS, merged);
                return merged;
              });
            }
          }
        },
        (err) => console.warn('Legal Forums snapshot error:', err)
      );
    }

    return () => {
      unsubClients();
      unsubCases();
      unsubNotices();
      unsubDocs();
      unsubTasks();
      unsubNotes();
      unsubInvoices();
      unsubHearings();
      unsubNotifs();
      unsubCreds();
      unsubPracticeAreas();
      unsubTeam();
      unsubReviews();
      unsubInsights();
      unsubForums();
    };
  }, [authUid]);

  // --- CLIENT ACTIONS ---
  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'activeCasesCount' | 'totalTaxSaved'>, loginEmail?: string, loginPassword?: string) => {
    const newId = createUniqueId('cli');
    const newClient: Client = {
      ...client,
      id: newId,
      activeCasesCount: 0,
      totalTaxSaved: 'Rs. 0',
      createdAt: getTodayDateString()
    };
    setClients((prev) => {
      const updated = [newClient, ...prev];
      saveToStorage(STORAGE_KEYS.CLIENTS, updated);
      return updated;
    });
    saveToFirestoreDoc('clients', newClient.id, newClient);

    // Save client login credential if provided
    if (loginEmail && loginPassword) {
      addClientCredential({
        clientId: newClient.id,
        clientName: newClient.name,
        email: loginEmail,
        password: loginPassword
      });
    }

    return newClient;
  };

  const updateClient = (clientId: string, updates: Partial<Client>) => {
    let updatedTargetClient: Client | null = null;
    setClients((prev) => {
      const updated = prev.map((c) => {
        if (c.id === clientId) {
          const nextClient = { ...c, ...updates };
          updatedTargetClient = nextClient;
          return nextClient;
        }
        return c;
      });
      saveToStorage(STORAGE_KEYS.CLIENTS, updated);
      return updated;
    });
    if (updatedTargetClient) {
      saveToFirestoreDoc('clients', clientId, updatedTargetClient);
    }
  };

  const addClientCredential = (cred: Omit<ClientCredential, 'id' | 'createdAt'>) => {
    const newCred: ClientCredential = {
      ...cred,
      id: createUniqueId('cred'),
      createdAt: getTodayDateString()
    };
    setClientCredentials((prev) => {
      const updated = [
        newCred,
        ...prev.filter(
          (c) => c.email.toLowerCase() !== cred.email.toLowerCase() && c.clientId !== cred.clientId
        )
      ];
      saveToStorage(STORAGE_KEYS.CLIENT_CREDENTIALS, updated);
      return updated;
    });
    saveToFirestoreDoc('clientCredentials', newCred.id, newCred);
    return newCred;
  };

  // --- CASE ACTIONS ---
  const addCase = (caseData: {
    title: string;
    clientId: string;
    clientRecord?: Client;
    assignedCounsel: string;
    forum: LegalForum;
    taxYear: string;
    status: CaseStatus;
    riskLevel: RiskLevel;
    demandAmountPkr: number;
    summary: string;
    cnoNumber?: string;
    sectionCode?: string;
    clientPhone?: string;
    nextHearingDate?: string;
    nextHearingPurpose?: string;
    clientLoginEmail?: string;
    clientLoginPassword?: string;
  }) => {
    const client = caseData.clientRecord || clients.find((c) => c.id === caseData.clientId);
    const resolvedPhone = caseData.clientPhone ?? client?.phone;
    const newCase: CaseFile = {
      id: `case-${getCurrentYearNumber()}-${getRandom3DigitNum()}`,
      caseRef: `RLA-${caseData.forum.split(' ')[0]}-${createUniqueId('')}`,
      clientId: caseData.clientId,
      clientName: client ? client.name : 'Corporate Client',
      clientNtn: client ? client.ntn : 'N/A',
      ...(resolvedPhone ? { clientPhone: resolvedPhone } : {}),
      ...(caseData.cnoNumber ? { cnoNumber: caseData.cnoNumber } : {}),
      ...(caseData.sectionCode ? { sectionCode: caseData.sectionCode } : {}),
      caseTitle: caseData.title,
      assignedCounsel: caseData.assignedCounsel,
      assignedCounselTitle: 'Advocate High Court | Rahim Law Associates',
      forum: caseData.forum,
      taxYear: caseData.taxYear,
      status: caseData.status,
      riskLevel: caseData.riskLevel,
      demandAmountPkr: caseData.demandAmountPkr,
      savedAmountPkr: 0,
      auditStage: 1,
      summary: caseData.summary,
      nextHearingDate: caseData.nextHearingDate,
      nextHearingPurpose: caseData.nextHearingPurpose,
      ...(caseData.clientLoginEmail ? { clientLoginEmail: caseData.clientLoginEmail } : {}),
      ...(caseData.clientLoginPassword ? { clientLoginPassword: caseData.clientLoginPassword } : {}),
      createdAt: getTodayDateString(),
      timeline: [
        {
          id: createFullTimestampId('tl'),
          date: getTodayDateString(),
          title: 'Case Registered at Rahim Law Associates',
          forum: caseData.forum,
          description: `Case opened under ${caseData.assignedCounsel} lead representation.`,
          advocateName: caseData.assignedCounsel
        }
      ]
    };

    const updatedCases = [newCase, ...cases];
    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);
    saveToFirestoreDoc('cases', newCase.id, newCase);

    // Save client login credential if created during case creation
    if (caseData.clientLoginEmail && caseData.clientLoginPassword) {
      addClientCredential({
        clientId: caseData.clientId,
        clientName: client ? client.name : 'Client',
        email: caseData.clientLoginEmail,
        password: caseData.clientLoginPassword
      });
    }

    // If initial hearing date is provided, add hearing event to calendar automatically
    if (caseData.nextHearingDate) {
      const newHearing: HearingEvent = {
        id: createFullTimestampId('h'),
        caseId: newCase.id,
        caseTitle: newCase.caseTitle,
        clientName: newCase.clientName,
        date: caseData.nextHearingDate,
        time: '10:00 AM',
        forum: caseData.forum,
        bench: 'Honourable High Court / Appellate Tribunal Bench',
        counselAssigned: caseData.assignedCounsel,
        purpose: caseData.nextHearingPurpose || 'Initial Hearing & Cause List Appearance',
        priority: caseData.riskLevel === 'Critical' ? 'High' : 'Medium'
      };
      const updatedHearings = [newHearing, ...hearings];
      setHearings(updatedHearings);
      saveToStorage(STORAGE_KEYS.HEARINGS, updatedHearings);
      saveToFirestoreDoc('hearings', newHearing.id, newHearing);
    }

    // Update active case count for client
    if (client) {
      setClients((prev) => {
        const exists = prev.some((c) => c.id === client.id);
        const baseList = exists ? prev : [client, ...prev];
        const updatedClients = baseList.map((c) =>
          c.id === client.id ? { ...c, activeCasesCount: c.activeCasesCount + 1 } : c
        );
        saveToStorage(STORAGE_KEYS.CLIENTS, updatedClients);
        const updatedClient = updatedClients.find((c) => c.id === client.id);
        if (updatedClient) {
          saveToFirestoreDoc('clients', updatedClient.id, updatedClient);
        }
        return updatedClients;
      });
    }

    return newCase;
  };

  const updateCase = (caseId: string, updatedData: Partial<CaseFile> & { clientLoginEmail?: string; clientLoginPassword?: string }) => {
    let updatedTargetDoc: CaseFile | null = null;
    const updated = cases.map((c) => {
      if (c.id === caseId) {
        const docObj = {
          ...c,
          ...updatedData
        };
        updatedTargetDoc = docObj;
        return docObj;
      }
      return c;
    });
    setCases(updated);
    saveToStorage(STORAGE_KEYS.CASES, updated);
    if (updatedTargetDoc) {
      saveToFirestoreDoc('cases', caseId, updatedTargetDoc);
    }

    // Sync client login credential if provided
    if (updatedTargetDoc && updatedData.clientLoginEmail && updatedData.clientLoginPassword) {
      const targetCase = updatedTargetDoc as CaseFile;
      addClientCredential({
        clientId: targetCase.clientId,
        clientName: targetCase.clientName,
        email: updatedData.clientLoginEmail,
        password: updatedData.clientLoginPassword
      });
    }

    // Sync hearing if nextHearingDate provided
    if (updatedTargetDoc && updatedData.nextHearingDate) {
      const targetCase = updatedTargetDoc as CaseFile;
      const existingIdx = hearings.findIndex(
        (h) => h.caseId === caseId && h.date === updatedData.nextHearingDate
      );
      if (existingIdx === -1) {
        const newHearing: HearingEvent = {
          id: createFullTimestampId('h'),
          caseId,
          caseTitle: targetCase.caseTitle,
          clientName: targetCase.clientName,
          date: updatedData.nextHearingDate,
          time: '10:00 AM',
          forum: targetCase.forum,
          bench: 'Honourable High Court / Appellate Bench',
          counselAssigned: targetCase.assignedCounsel,
          purpose: targetCase.nextHearingPurpose || 'Court Hearing Proceedings',
          priority: targetCase.riskLevel === 'Critical' ? 'High' : 'Medium'
        };
        const updatedH = [newHearing, ...hearings];
        setHearings(updatedH);
        saveToStorage(STORAGE_KEYS.HEARINGS, updatedH);
        saveToFirestoreDoc('hearings', newHearing.id, newHearing);
      }
    }
  };

  const updateCaseStatus = (caseId: string, newStatus: CaseStatus, newStage?: number) => {
    let updatedTargetDoc: CaseFile | null = null;
    const updated = cases.map((c) => {
      if (c.id === caseId) {
        const docObj = {
          ...c,
          status: newStatus,
          auditStage: newStage !== undefined ? newStage : c.auditStage
        };
        updatedTargetDoc = docObj;
        return docObj;
      }
      return c;
    });
    setCases(updated);
    saveToStorage(STORAGE_KEYS.CASES, updated);
    if (updatedTargetDoc) {
      saveToFirestoreDoc('cases', caseId, updatedTargetDoc);
    }
  };

  const addTimelineEvent = (caseId: string, event: {
    title: string;
    forum: LegalForum;
    description: string;
    advocateName: string;
    outcome?: string;
  }) => {
    let updatedTargetDoc: CaseFile | null = null;
    const updated = cases.map((c) => {
      if (c.id === caseId) {
        const newItem = {
          id: createFullTimestampId('tl'),
          date: getTodayDateString(),
          ...event
        };
        const docObj = {
          ...c,
          timeline: [newItem, ...c.timeline]
        };
        updatedTargetDoc = docObj;
        return docObj;
      }
      return c;
    });
    setCases(updated);
    saveToStorage(STORAGE_KEYS.CASES, updated);
    if (updatedTargetDoc) {
      saveToFirestoreDoc('cases', caseId, updatedTargetDoc);
    }
  };

  const deleteCase = (caseId: string) => {
    const targetCase = cases.find((c) => c.id === caseId);
    markCollectionSeeded('cases');
    const updatedCases = cases.filter((c) => c.id !== caseId);
    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);
    deleteFromFirestoreDoc('cases', caseId);

    // Clean up linked case records so no orphaned items remain in Vault, Billing, Calendar, Notices, Tasks, or Notes
    const linkedDocs = documents.filter((d) => d.caseId === caseId);
    if (linkedDocs.length > 0) {
      markCollectionSeeded('documents');
      const remainingDocs = documents.filter((d) => d.caseId !== caseId);
      setDocuments(remainingDocs);
      saveToStorage(STORAGE_KEYS.DOCUMENTS, remainingDocs);
      linkedDocs.forEach((d) => deleteFromFirestoreDoc('documents', d.id));
    }

    const linkedInvoices = invoices.filter((inv) => inv.caseId === caseId);
    if (linkedInvoices.length > 0) {
      markCollectionSeeded('invoices');
      const remainingInvoices = invoices.filter((inv) => inv.caseId !== caseId);
      setInvoices(remainingInvoices);
      saveToStorage(STORAGE_KEYS.INVOICES, remainingInvoices);
      linkedInvoices.forEach((inv) => deleteFromFirestoreDoc('invoices', inv.id));
    }

    const linkedNotices = notices.filter((n) => n.caseId === caseId);
    if (linkedNotices.length > 0) {
      markCollectionSeeded('notices');
      const remainingNotices = notices.filter((n) => n.caseId !== caseId);
      setNotices(remainingNotices);
      saveToStorage(STORAGE_KEYS.NOTICES, remainingNotices);
      linkedNotices.forEach((n) => deleteFromFirestoreDoc('notices', n.id));
    }

    const linkedTasks = tasks.filter((t) => t.caseId === caseId);
    if (linkedTasks.length > 0) {
      markCollectionSeeded('tasks');
      const remainingTasks = tasks.filter((t) => t.caseId !== caseId);
      setTasks(remainingTasks);
      saveToStorage(STORAGE_KEYS.TASKS, remainingTasks);
      linkedTasks.forEach((t) => deleteFromFirestoreDoc('tasks', t.id));
    }

    const linkedNotes = notes.filter((n) => n.caseId === caseId);
    if (linkedNotes.length > 0) {
      markCollectionSeeded('notes');
      const remainingNotes = notes.filter((n) => n.caseId !== caseId);
      setNotes(remainingNotes);
      saveToStorage(STORAGE_KEYS.NOTES, remainingNotes);
      linkedNotes.forEach((n) => deleteFromFirestoreDoc('notes', n.id));
    }

    const linkedHearings = hearings.filter((h) => h.caseId === caseId);
    if (linkedHearings.length > 0) {
      markCollectionSeeded('hearings');
      const remainingHearings = hearings.filter((h) => h.caseId !== caseId);
      setHearings(remainingHearings);
      saveToStorage(STORAGE_KEYS.HEARINGS, remainingHearings);
      linkedHearings.forEach((h) => deleteFromFirestoreDoc('hearings', h.id));
    }

    const linkedNotifs = notifications.filter((n) => n.caseId === caseId);
    if (linkedNotifs.length > 0) {
      markCollectionSeeded('notifications');
      const remainingNotifs = notifications.filter((n) => n.caseId !== caseId);
      setNotifications(remainingNotifs);
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, remainingNotifs);
      linkedNotifs.forEach((n) => deleteFromFirestoreDoc('notifications', n.id));
    }

    if (targetCase) {
      const remainingClientCasesCount = updatedCases.filter((c) => c.clientId === targetCase.clientId).length;
      setClients((prev) => {
        const nextClients = prev.map((cl) =>
          cl.id === targetCase.clientId ? { ...cl, activeCasesCount: remainingClientCasesCount } : cl
        );
        saveToStorage(STORAGE_KEYS.CLIENTS, nextClients);
        const updatedClient = nextClients.find((cl) => cl.id === targetCase.clientId);
        if (updatedClient) {
          saveToFirestoreDoc('clients', updatedClient.id, updatedClient);
        }
        return nextClients;
      });
    }
  };

  // --- NOTICE ACTIONS ---
  const addNotice = (notice: Omit<FBRNotice, 'id' | 'clientName'>) => {
    const client = clients.find((c) => c.id === notice.clientId);
    const newNotice: FBRNotice = {
      ...notice,
      id: createUniqueId('not'),
      clientName: client ? client.name : 'Client'
    };
    const updated = [newNotice, ...notices];
    setNotices(updated);
    saveToStorage(STORAGE_KEYS.NOTICES, updated);
    saveToFirestoreDoc('notices', newNotice.id, newNotice);
    return newNotice;
  };

  const updateNoticeStatus = (noticeId: string, status: FBRNotice['status']) => {
    let updatedDoc: FBRNotice | null = null;
    const updated = notices.map((n) => {
      if (n.id === noticeId) {
        const obj = { ...n, status };
        updatedDoc = obj;
        return obj;
      }
      return n;
    });
    setNotices(updated);
    saveToStorage(STORAGE_KEYS.NOTICES, updated);
    if (updatedDoc) {
      saveToFirestoreDoc('notices', noticeId, updatedDoc);
    }
  };

  // --- DOCUMENT ACTIONS ---
  const addDocument = (docItem: Omit<DocumentItem, 'id' | 'uploadedAt'>) => {
    const newDoc: DocumentItem = {
      ...docItem,
      id: createUniqueId('doc'),
      uploadedAt: getTodayDateString()
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, updated);
    saveToFirestoreDoc('documents', newDoc.id, newDoc);
    return newDoc;
  };

  const deleteDocument = (docId: string) => {
    markCollectionSeeded('documents');
    const updated = documents.filter((d) => d.id !== docId);
    setDocuments(updated);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, updated);
    deleteFromFirestoreDoc('documents', docId);
  };

  // --- TASK ACTIONS ---
  const addTask = (task: Omit<InternalTask, 'id' | 'isCompleted'>) => {
    const newTask: InternalTask = {
      ...task,
      id: createUniqueId('task'),
      isCompleted: false
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveToStorage(STORAGE_KEYS.TASKS, updated);
    saveToFirestoreDoc('tasks', newTask.id, newTask);
  };

  const toggleTask = (taskId: string) => {
    let updatedDoc: InternalTask | null = null;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const obj = { ...t, isCompleted: !t.isCompleted };
        updatedDoc = obj;
        return obj;
      }
      return t;
    });
    setTasks(updated);
    saveToStorage(STORAGE_KEYS.TASKS, updated);
    if (updatedDoc) {
      saveToFirestoreDoc('tasks', taskId, updatedDoc);
    }
  };

  // --- NOTE ACTIONS ---
  const addNote = (note: Omit<InternalNote, 'id' | 'date'>) => {
    const newNote: InternalNote = {
      ...note,
      id: createUniqueId('note'),
      date: getTodayDateString()
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveToStorage(STORAGE_KEYS.NOTES, updated);
    saveToFirestoreDoc('notes', newNote.id, newNote);
  };

  // --- INVOICE ACTIONS ---
  const addInvoice = (inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'clientName' | 'clientNtn'>) => {
    const client = clients.find((c) => c.id === inv.clientId);
    const newInv: Invoice = {
      ...inv,
      id: createUniqueId('inv'),
      invoiceNumber: `RLA-INV-${getCurrentYearNumber()}-${getRandom3DigitNum()}`,
      clientName: client ? client.name : 'Client',
      clientNtn: client ? client.ntn : 'N/A'
    };
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    saveToStorage(STORAGE_KEYS.INVOICES, updated);
    saveToFirestoreDoc('invoices', newInv.id, newInv);
    return newInv;
  };

  const markInvoicePaid = (invId: string, paymentMethod: 'Bank Transfer' | 'PayOrder / Cheque' | 'Online PKR') => {
    let updatedDoc: Invoice | null = null;
    const updated = invoices.map((inv) => {
      if (inv.id === invId) {
        const netTotal = inv.retainerFeePkr + inv.hearingFeePkr;
        const obj: Invoice = {
          ...inv,
          salesTaxPkr: 0,
          totalAmountPkr: netTotal,
          status: 'Paid' as const,
          paidAmountPkr: netTotal,
          paymentMethod
        };
        updatedDoc = obj;
        return obj;
      }
      return inv;
    });
    setInvoices(updated);
    saveToStorage(STORAGE_KEYS.INVOICES, updated);
    if (updatedDoc) {
      saveToFirestoreDoc('invoices', invId, updatedDoc);
    }
  };

  const deleteInvoice = (invId: string) => {
    markCollectionSeeded('invoices');
    const updated = invoices.filter((inv) => inv.id !== invId);
    setInvoices(updated);
    saveToStorage(STORAGE_KEYS.INVOICES, updated);
    deleteFromFirestoreDoc('invoices', invId);
  };

  // --- HEARING ACTIONS ---
  const addHearing = (hearing: Omit<HearingEvent, 'id'>) => {
    const newHearing: HearingEvent = {
      ...hearing,
      id: createUniqueId('hear')
    };
    const updated = [newHearing, ...hearings];
    setHearings(updated);
    saveToStorage(STORAGE_KEYS.HEARINGS, updated);
    saveToFirestoreDoc('hearings', newHearing.id, newHearing);

    // Sync back to case if case exists
    const matchedCase = cases.find((c) => c.id === hearing.caseId);
    if (matchedCase) {
      const newTimelineEvents: any[] = [];

      if (hearing.previousHearingOutcome) {
        newTimelineEvents.push({
          id: createFullTimestampId('tl-prev'),
          date: hearing.previousHearingDate || getTodayDateString(),
          title: 'Previous Hearing Order Sheet Record',
          forum: hearing.forum || matchedCase.forum,
          description: `Previous Hearing Date: ${hearing.previousHearingDate || 'N/A'}. Proceedings & Court Outcome: ${hearing.previousHearingOutcome}`,
          advocateName: hearing.counselAssigned || matchedCase.assignedCounsel,
          outcome: hearing.previousHearingOutcome
        });
      }

      newTimelineEvents.push({
        id: createFullTimestampId('tl'),
        date: getTodayDateString(),
        title: 'New Cause List Hearing Scheduled',
        forum: hearing.forum || matchedCase.forum,
        description: `Next hearing set for ${hearing.date} at ${hearing.time || '10:00 AM'}. Bench: ${hearing.bench}. Purpose: ${hearing.purpose}`,
        advocateName: hearing.counselAssigned || matchedCase.assignedCounsel
      });

      const updatedCases = cases.map((c) =>
        c.id === hearing.caseId
          ? {
              ...c,
              nextHearingDate: hearing.date,
              nextHearingPurpose: hearing.purpose,
              forum: hearing.forum || c.forum,
              timeline: [...newTimelineEvents, ...c.timeline]
            }
          : c
      );
      setCases(updatedCases);
      saveToStorage(STORAGE_KEYS.CASES, updatedCases);
      const targetCase = updatedCases.find((c) => c.id === hearing.caseId);
      if (targetCase) {
        saveToFirestoreDoc('cases', targetCase.id, targetCase);
      }
    }

    return newHearing;
  };

  const updateCaseHearing = (
    caseId: string,
    hearingDetails: {
      nextHearingDate: string;
      nextHearingPurpose: string;
      previousHearingDate?: string;
      previousHearingOutcome?: string;
      time?: string;
      bench?: string;
      forum?: LegalForum;
      counselAssigned?: string;
    }
  ) => {
    // 1. Update CaseFile
    const updatedCases = cases.map((c) => {
      if (c.id === caseId) {
        const newTimeline: any[] = [];

        if (hearingDetails.previousHearingOutcome) {
          newTimeline.push({
            id: createFullTimestampId('tl-prev'),
            date: hearingDetails.previousHearingDate || getTodayDateString(),
            title: 'Previous Hearing Order Sheet Record',
            forum: hearingDetails.forum || c.forum,
            description: `Previous Hearing Date: ${hearingDetails.previousHearingDate || 'N/A'}. Court Proceedings & Order Details: ${hearingDetails.previousHearingOutcome}`,
            advocateName: hearingDetails.counselAssigned || c.assignedCounsel,
            outcome: hearingDetails.previousHearingOutcome
          });
        }

        newTimeline.push({
          id: createFullTimestampId('tl'),
          date: getTodayDateString(),
          title: 'Court Hearing Scheduled / Rescheduled',
          forum: hearingDetails.forum || c.forum,
          description: `Hearing set for ${hearingDetails.nextHearingDate}${
            hearingDetails.time ? ` at ${hearingDetails.time}` : ''
          }. Purpose: ${hearingDetails.nextHearingPurpose}. Bench: ${hearingDetails.bench || 'Honourable Bench'}.`,
          advocateName: hearingDetails.counselAssigned || c.assignedCounsel
        });

        return {
          ...c,
          nextHearingDate: hearingDetails.nextHearingDate,
          nextHearingPurpose: hearingDetails.nextHearingPurpose,
          forum: hearingDetails.forum || c.forum,
          assignedCounsel: hearingDetails.counselAssigned || c.assignedCounsel,
          timeline: [...newTimeline, ...c.timeline]
        };
      }
      return c;
    });

    setCases(updatedCases);
    saveToStorage(STORAGE_KEYS.CASES, updatedCases);
    const targetCase = updatedCases.find((c) => c.id === caseId);
    if (targetCase) {
      saveToFirestoreDoc('cases', targetCase.id, targetCase);
    }

    // 2. Add or update hearing event in hearings list
    const foundCase = cases.find((c) => c.id === caseId);
    if (foundCase) {
      const existingHearingIndex = hearings.findIndex((h) => h.caseId === caseId && h.date === hearingDetails.nextHearingDate);
      let updatedHearings: HearingEvent[];

      if (existingHearingIndex >= 0) {
        updatedHearings = hearings.map((h, idx) =>
          idx === existingHearingIndex
            ? {
                ...h,
                time: hearingDetails.time || h.time || '10:00 AM',
                bench: hearingDetails.bench || h.bench || 'Honourable High Court Bench',
                purpose: hearingDetails.nextHearingPurpose,
                counselAssigned: hearingDetails.counselAssigned || h.counselAssigned || foundCase.assignedCounsel,
                forum: hearingDetails.forum || h.forum || foundCase.forum
              }
            : h
        );
      } else {
        const newHearing: HearingEvent = {
          id: createFullTimestampId('h'),
          caseId,
          caseTitle: foundCase.caseTitle,
          clientName: foundCase.clientName,
          date: hearingDetails.nextHearingDate,
          time: hearingDetails.time || '10:00 AM',
          forum: hearingDetails.forum || foundCase.forum,
          bench: hearingDetails.bench || 'Honourable High Court Bench',
          counselAssigned: hearingDetails.counselAssigned || foundCase.assignedCounsel,
          purpose: hearingDetails.nextHearingPurpose,
          priority: foundCase.riskLevel === 'Critical' ? 'High' : 'Medium'
        };
        updatedHearings = [newHearing, ...hearings];
      }

      setHearings(updatedHearings);
      saveToStorage(STORAGE_KEYS.HEARINGS, updatedHearings);
      updatedHearings.forEach((h) => saveToFirestoreDoc('hearings', h.id, h));
    }
  };

  const updateHearing = (hearingId: string, updatedData: Partial<HearingEvent>) => {
    let updatedDoc: HearingEvent | null = null;
    const updated = hearings.map((h) => {
      if (h.id === hearingId) {
        const obj = { ...h, ...updatedData };
        updatedDoc = obj;
        return obj;
      }
      return h;
    });
    setHearings(updated);
    saveToStorage(STORAGE_KEYS.HEARINGS, updated);
    if (updatedDoc) {
      saveToFirestoreDoc('hearings', hearingId, updatedDoc);
    }
  };

  // --- NOTIFICATION ACTIONS ---
  const sendNotification = (notif: Omit<NotificationLog, 'id' | 'sentAt' | 'status'>) => {
    const newNotif: NotificationLog = {
      ...notif,
      id: createUniqueId('notif'),
      sentAt: getTodayDateString(),
      status: 'Delivered'
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    saveToFirestoreDoc('notifications', newNotif.id, newNotif);
    return newNotif;
  };

  // --- PRACTICE AREAS ACTIONS ---
  const addPracticeArea = (pa: Omit<PracticeArea, 'id'> & { id?: string }) => {
    const slugId = pa.id || pa.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || createUniqueId('pa');
    const newArea: PracticeArea = {
      ...pa,
      id: slugId,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };
    const updated = [newArea, ...practiceAreas];
    setPracticeAreas(updated);
    saveToStorage(STORAGE_KEYS.PRACTICE_AREAS, updated);
    saveToFirestoreDoc('practice_areas', newArea.id, newArea);
    return newArea;
  };

  const updatePracticeArea = (id: string, updatedData: Partial<PracticeArea>) => {
    let targetDoc: PracticeArea | null = null;
    const updated = practiceAreas.map((pa) => {
      if (pa.id === id) {
        const obj: PracticeArea = {
          ...pa,
          ...updatedData,
          updatedAt: getTodayDateString()
        };
        targetDoc = obj;
        return obj;
      }
      return pa;
    });
    setPracticeAreas(updated);
    saveToStorage(STORAGE_KEYS.PRACTICE_AREAS, updated);
    if (targetDoc) {
      saveToFirestoreDoc('practice_areas', id, targetDoc);
    }
  };

  const deletePracticeArea = (id: string) => {
    const updated = practiceAreas.filter((pa) => pa.id !== id);
    setPracticeAreas(updated);
    saveToStorage(STORAGE_KEYS.PRACTICE_AREAS, updated);
    deleteFromFirestoreDoc('practice_areas', id);
  };

  const resetPracticeAreas = () => {
    const defaultIds = new Set(INITIAL_PRACTICE_AREAS.map((pa) => pa.id));
    practiceAreas.filter((pa) => !defaultIds.has(pa.id)).forEach((pa) => deleteFromFirestoreDoc('practice_areas', pa.id));
    setPracticeAreas(INITIAL_PRACTICE_AREAS);
    saveToStorage(STORAGE_KEYS.PRACTICE_AREAS, INITIAL_PRACTICE_AREAS);
    INITIAL_PRACTICE_AREAS.forEach((pa) => saveToFirestoreDoc('practice_areas', pa.id, pa));
  };

  const addTeamMember = (memberData: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const id = memberData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `team-${Date.now()}`;
    const newMember: TeamMember = {
      ...memberData,
      id,
      createdAt: getTodayDateString(),
      order: teamMembers.length + 1
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    saveToStorage(STORAGE_KEYS.TEAM_MEMBERS, updated);
    saveToFirestoreDoc('team_members', id, newMember);
  };

  const updateTeamMember = (id: string, updatedData: Partial<TeamMember>) => {
    let targetDoc: TeamMember | null = null;
    const updated = teamMembers.map((m) => {
      if (m.id === id) {
        const obj: TeamMember = {
          ...m,
          ...updatedData,
          updatedAt: getTodayDateString()
        };
        targetDoc = obj;
        return obj;
      }
      return m;
    });
    setTeamMembers(updated);
    saveToStorage(STORAGE_KEYS.TEAM_MEMBERS, updated);
    if (targetDoc) {
      saveToFirestoreDoc('team_members', id, targetDoc);
    }
  };

  const deleteTeamMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    saveToStorage(STORAGE_KEYS.TEAM_MEMBERS, updated);
    deleteFromFirestoreDoc('team_members', id);
  };

  const resetTeamMembers = () => {
    const defaultIds = new Set(INITIAL_TEAM_MEMBERS.map((m) => m.id));
    teamMembers.filter((m) => !defaultIds.has(m.id)).forEach((m) => deleteFromFirestoreDoc('team_members', m.id));
    setTeamMembers(INITIAL_TEAM_MEMBERS);
    saveToStorage(STORAGE_KEYS.TEAM_MEMBERS, INITIAL_TEAM_MEMBERS);
    INITIAL_TEAM_MEMBERS.forEach((m) => saveToFirestoreDoc('team_members', m.id, m));
  };

  // --- REVIEWS & TESTIMONIALS ACTIONS ---
  const addReview = (reviewData: Omit<ReviewItem, 'id' | 'createdAt'>) => {
    const newId = createUniqueId('rev');
    const newReview: ReviewItem = {
      ...reviewData,
      id: newId,
      status: reviewData.status || 'published',
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString()
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    saveToStorage(STORAGE_KEYS.REVIEWS, updated);
    saveToFirestoreDoc('client_reviews', newId, newReview);
    return newReview;
  };

  const updateReview = (id: string, updates: Partial<ReviewItem>) => {
    let targetDoc: ReviewItem | null = null;
    const updated = reviews.map((r) => {
      if (r.id === id) {
        targetDoc = { ...r, ...updates, updatedAt: getTodayDateString() };
        return targetDoc;
      }
      return r;
    });
    setReviews(updated);
    saveToStorage(STORAGE_KEYS.REVIEWS, updated);
    if (targetDoc) {
      saveToFirestoreDoc('client_reviews', id, targetDoc);
    }
  };

  const deleteReview = (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    saveToStorage(STORAGE_KEYS.REVIEWS, updated);
    deleteFromFirestoreDoc('client_reviews', id);
  };

  const resetReviews = () => {
    const defaultIds = new Set(INITIAL_REVIEWS.map((r) => r.id));
    reviews.filter((r) => !defaultIds.has(r.id)).forEach((r) => deleteFromFirestoreDoc('client_reviews', r.id));
    setReviews(INITIAL_REVIEWS);
    saveToStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    INITIAL_REVIEWS.forEach((r) => saveToFirestoreDoc('client_reviews', r.id, r));
  };

  // --- LEGAL INSIGHTS ACTIONS ---
  const addInsight = (insight: Omit<LegalInsightItem, 'id' | 'createdAt'>) => {
    const slug = insight.slug?.trim() || insight.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = slug || createUniqueId('post');
    const newInsight: LegalInsightItem = {
      ...insight,
      id: newId,
      slug: slug || newId,
      status: insight.status || 'published',
      createdAt: getTodayDateString()
    };
    const updated = [newInsight, ...insights];
    setInsights(updated);
    saveToStorage(STORAGE_KEYS.INSIGHTS, updated);
    saveToFirestoreDoc('legal_insights', newId, newInsight);
    return newInsight;
  };

  const updateInsight = (id: string, updates: Partial<LegalInsightItem>) => {
    let targetDoc: LegalInsightItem | null = null;
    const updated = insights.map((item) => {
      if (item.id === id) {
        targetDoc = { ...item, ...updates, updatedAt: getTodayDateString() };
        return targetDoc;
      }
      return item;
    });
    setInsights(updated);
    saveToStorage(STORAGE_KEYS.INSIGHTS, updated);
    if (targetDoc) {
      saveToFirestoreDoc('legal_insights', id, targetDoc);
    }
  };

  const deleteInsight = (id: string) => {
    const updated = insights.filter((item) => item.id !== id);
    setInsights(updated);
    saveToStorage(STORAGE_KEYS.INSIGHTS, updated);
    deleteFromFirestoreDoc('legal_insights', id);
  };

  const resetInsights = () => {
    const defaultIds = new Set(INITIAL_INSIGHTS.map((ins) => ins.id));
    insights.filter((ins) => !defaultIds.has(ins.id)).forEach((ins) => deleteFromFirestoreDoc('legal_insights', ins.id));
    setInsights(INITIAL_INSIGHTS);
    saveToStorage(STORAGE_KEYS.INSIGHTS, INITIAL_INSIGHTS);
    INITIAL_INSIGHTS.forEach((ins) => saveToFirestoreDoc('legal_insights', ins.id, ins));
  };

  // --- CUSTOM LEGAL FORUMS ACTIONS ---
  const addCustomLegalForum = (forumName: string): string => {
    const clean = forumName.trim().slice(0, 200);
    if (!clean) return '';

    setCustomLegalForums((prev) => {
      const exists = prev.some((f) => f.toLowerCase() === clean.toLowerCase());
      if (exists) return prev;
      const updated = [clean, ...prev];
      saveToStorage(STORAGE_KEYS.LEGAL_FORUMS, updated);
      return updated;
    });

    if (auth.currentUser) {
      const slugId =
        clean
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 80) || createFullTimestampId('forum');
      saveToFirestoreDoc('legal_forums', slugId, {
        id: slugId,
        name: clean,
        createdAt: getTodayDateString()
      });
    }

    return clean;
  };

  return {
    isLoaded,
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
    practiceAreas,
    teamMembers,
    reviews,
    insights,
    customLegalForums,
    addClient,
    updateClient,
    addClientCredential,
    addCase,
    updateCase,
    updateCaseStatus,
    deleteCase,
    addTimelineEvent,
    addNotice,
    updateNoticeStatus,
    addDocument,
    deleteDocument,
    addTask,
    toggleTask,
    addNote,
    addInvoice,
    markInvoicePaid,
    deleteInvoice,
    addHearing,
    updateCaseHearing,
    updateHearing,
    sendNotification,
    addPracticeArea,
    updatePracticeArea,
    deletePracticeArea,
    resetPracticeAreas,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    resetTeamMembers,
    addReview,
    updateReview,
    deleteReview,
    resetReviews,
    addInsight,
    updateInsight,
    deleteInsight,
    resetInsights,
    addCustomLegalForum
  };
}

type PortalStoreContextValue = ReturnType<typeof usePortalStoreState>;

const PortalContext = createContext<PortalStoreContextValue | null>(null);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = usePortalStoreState();
  return React.createElement(PortalContext.Provider, { value: store }, children);
};

export function usePortalStore(): PortalStoreContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortalStore must be used within a PortalProvider');
  }
  return ctx;
}
