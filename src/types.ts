/**
 * Global Type Definitions for MindSync AI
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isMock?: boolean;
}

export type SessionCategory =
  | 'Brainstorm'
  | 'Deep Reflection'
  | 'Strategic Planning'
  | 'Creative Jam'
  | 'Personal';

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  category: SessionCategory;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isEncrypted?: boolean;
  tags?: string[];
  lastMessageSnippet?: string;
  summary?: string;
  dominantEmotion?: string;
  draft?: string;
  draftUpdatedAt?: string;
}

export interface JournalMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isEncrypted?: boolean;
  safetyFlagged?: boolean;
}

export interface CognitiveAnalysis {
  summary: string;
  keyThemes: string[];
  cognitiveReframing: {
    limitingBeliefOrFriction: string;
    reframedPerspective: string;
    growthOpportunity: string;
  };
  emotionalValence: {
    valenceScore: number; // -100 to 100
    energyLevel: number; // 0 to 100
    dominantEmotion: string;
    cognitiveClarity: number; // 0 to 100
  };
  actionableTakeaways: Array<{
    id: string;
    task: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
    completed: boolean;
  }>;
}

export interface ConceptGraphNode {
  id: string;
  label: string;
  category: 'core_goal' | 'challenge' | 'insight' | 'action' | 'resource';
  weight: number;
  description?: string;
  x?: number;
  y?: number;
}

export interface ConceptGraphLink {
  source: string;
  target: string;
  label: string;
}

export interface ConceptGraphData {
  nodes: ConceptGraphNode[];
  links: ConceptGraphLink[];
}

export interface SecurityAuditTelemetry {
  status: string;
  service?: string;
  serviceLabels?: Record<string, string>;
  tenantId: string;
  authenticatedMode: 'FIREBASE_CRYPTO_VERIFIED' | 'EMULATED_SANDBOX_DEV';
  secretManager: {
    active: boolean;
    source: string;
    cached: boolean;
    ttlRemainingSeconds: number;
    projectId: string;
    secretName: string;
    maskedSnippet: string;
  };
  dataIsolation: {
    userId: string;
    activeSessionsCount: number;
    totalMessagesCount: number;
    storedAnalysesCount: number;
    storedGraphsCount: number;
    enforcedRootPath: string;
    storageMode: string;
    timestamp: string;
  };
  strideCompliance: {
    spoofing: string;
    tampering: string;
    repudiation: string;
    informationDisclosure: string;
    denialOfService: string;
    elevationOfPrivilege: string;
  };
  owaspTop10LLM: {
    LLM01_PromptInjection: string;
    LLM02_InsecureOutput: string;
    LLM06_SensitiveData: string;
  };
}
