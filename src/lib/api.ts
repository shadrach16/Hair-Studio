// Real API service for Afro AI
import { EMPTY_PRICING_CATALOG, type PricingCatalog } from './pricingSystem';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPro: boolean;
  credits: number;
  isGuest?: boolean;
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
  createdAt: string;
  hasClaimedReviewReward?: boolean;
  preferences?: {
    notifications?: boolean;
    newsletter?: boolean;
  };
}

export interface SubscriptionStatus {
  plan: string;
  status: 'inactive' | 'active' | 'cancelled' | 'past_due' | 'expired';
  provider: 'none' | 'revenuecat' | 'dodo' | string;
  providerSubscriptionId: string | null;
  startDate: string | null;
  endDate: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancellationRequestedAt: string | null;
  creditsPerMonth: number;
  rolloverCap: number;
  walletCredits: number;
  lastRefreshAt: string | null;
  nextRefreshAt: string | null;
  isActiveNow: boolean;
  refreshedThisRequest?: boolean;
  refreshReason?: string | null;
  // C3: Billing issue tracking
  billingIssueDetectedAt?: string | null;
  graceDeadline?: string | null;
}

export interface Hairstyle {
  _id?: string;
  id: string;
  name: string;
  description: string;
  category: string;
  gender: 'male' | 'female' | 'unisex';
  thumbnail: string;
  price: number;
  tags: string[];
  culturalOrigin?: string;
  popularity: number;
  estimatedTime: string;
  maintenance: string;
  difficulty: string;
  isActive: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  attributes?: HairstyleAttributes;
  attributesVersion?: number;
}

// A2: Structured hairstyle attributes
export interface HairstyleAttributes {
  hairType?: 'straight' | 'wavy' | 'curly' | 'coily' | 'kinky' | 'locked' | 'braided' | 'twisted' | 'woven';
  hairTexture?: string;
  length?: 'buzz' | 'short' | 'medium' | 'long' | 'extra-long';
  lengthMm?: { min?: number; max?: number };
  fadeType?: string;
  fadeStartGuard?: number;
  fadeEndGuard?: number;
  hasLineup?: boolean;
  hasHardPart?: boolean;
  stylingTechnique?: string;
  volumeProfile?: 'flat' | 'low' | 'medium' | 'high' | 'sculpted';
  partingPattern?: 'none' | 'center' | 'side-left' | 'side-right' | 'free-form' | 'zigzag';
  complexity?: 'simple' | 'moderate' | 'intricate' | 'elaborate';
  requiresEdgeWork?: boolean;
  baseColor?: string;
  hasColorTreatment?: boolean;
  colorNotes?: string;
  promptFamily?: 'low-cut' | 'standard' | 'braids-twists' | 'locs' | 'natural-textured' | 'protective-install';
}

// A2: Prompt metadata tracked on generations
export interface PromptMeta {
  family?: string;
  version?: string;
  model?: string;
}

// A2: Attribute coverage stats
export interface AttributeStatsResponse {
  status: 'success' | 'error';
  data: {
    promptVersion: string;
    totalActive: number;
    withStructuredAttributes: number;
    coverage: number;
    byPromptFamily: Array<{ family: string; count: number }>;
  };
}

export interface HairstyleListResponse {
  status: 'success' | 'error';
  results: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: {
    hairstyles: Hairstyle[];
  };
}

// G2: Collection and Recommendation types
export interface StyleCollection {
  _id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  coverImage?: string;
  type: 'curated' | 'dynamic' | 'trending' | 'seasonal';
  targetGender: string;
  hairstyles: Hairstyle[];
  hairstyleCount: number;
}

export interface StyleRecommendation extends Hairstyle {
  recommendationReason?: string;
  trendScore?: number;
  variantId?: string;
}

export interface StyleContextNote {
  type: string;
  text: string;
  icon: string;
}

// G2: Collection & recommendation analytics types
export interface CollectionMetric {
  name: string;
  slug: string;
  emoji: string;
  type: string;
  views: number;
  uniqueViewers: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

export interface CollectionAnalyticsData {
  period: { days: number; startDate: string; endDate: string };
  collections: CollectionMetric[];
  summary: {
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    avgCtr: number;
  };
}

export interface RecommendationAnalyticsData {
  period: { days: number; startDate: string; endDate: string };
  bySource: Array<{
    source: string;
    impressions: number;
    totalItemsServed: number;
    variants: Array<{ variant: string; impressions: number; uniqueUsers: number }>;
  }>;
  totalImpressions: number;
}

// A4: Quality + cost analytics types
export interface QualityModeStats {
  mode: string;
  count: number;
  avgScore: number;
  passRate: number;
  creditsUsed: number;
}

export interface QualityAnalyticsData {
  period: { days: number; startDate: string };
  overall: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
    totalCreditsSpent: number;
    avgProcessingTime: number;
    totalRetries: number;
  };
  modes: Array<{
    mode: string;
    completed: number;
    failed: number;
    totalCredits: number;
    avgQuality: number;
    qualityPassRate: number;
    successRate: number;
    avgRetries: number;
  }>;
  costByMode: Array<{
    mode: string;
    totalCredits: number;
    count: number;
    avgCreditsPerGen: number;
  }>;
  topDefects: Array<{
    defect: string;
    severity: string;
    count: number;
    avgScore: number;
  }>;
  dailyQuality: Array<{
    date: string;
    avgScore: number;
    count: number;
    passRate: number;
  }>;
}

export interface Generation {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedImageUrl?: string;
  processingTime?: number;
  errorMessage?: string;
  hairstyle: any;
  createdAt: string;
  prompt?: PromptMeta;
  // A4: Quality and mode data
  generationMode?: 'standard' | 'hd' | 'pro';
  qualityScore?: number | null;
  qualityPassed?: boolean | null;
  qualityDefect?: string | null;
  /** identityPreservation 0-100 from the output-quality scorer. */
  identityScore?: number | null;
  retryCount?: number;
}

export interface HairstyleAnalysisResponse {
    success: boolean;
    ai_description: string;
    message?: string;
}

export interface CreditLedgerAnomaly {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  createdAt: string;
}

export interface CreditLedgerTransaction {
  _id: string;
  kind: string;
  direction: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  status: 'completed' | 'flagged';
  reason?: string;
  description?: string;
  anomalyFlags?: CreditLedgerAnomaly[];
  createdAt: string;
}

export interface CreditLedgerSummary {
  currentBalance: number;
  totalSpent30d: number;
  totalRefunded30d: number;
  totalRewarded30d: number;
  totalPurchased30d: number;
  openAlerts: number;
  ledgerHealthy: boolean;
}

export interface CreditLedgerResponse {
  transactions: CreditLedgerTransaction[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  summary: CreditLedgerSummary;
}

// ─── G1: Saved Looks, Rating, Compare-Mode Types ────────────────────────────

export interface SavedLookSnapshot {
  hairstyleId: string;
  hairstyleName: string;
  hairstyleCategory: string;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  rating: number | null;
}

export interface SavedLook {
  _id: string;
  user: string;
  generation: string;
  title: string;
  notes: string;
  tags: string[];
  isPinned: boolean;
  collection: string;
  snapshot: SavedLookSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLookCollection {
  collection: string;
  count: number;
  latestAt: string;
}

export interface CompareItem {
  generationId: string;
  createdAt: string;
  creditsUsed: number;
  processingTime: number;
  rating: number | null;
  feedback: string | null;
  originalImage: string | null;
  generatedImage: string | null;
  hairstyle: {
    id: string;
    name: string;
    category: string;
    thumbnail: string;
    price: number;
    gender: string;
    averageRating: number;
  } | null;
}

export interface CompareCandidate {
  generationId: string;
  createdAt: string;
  creditsUsed: number;
  rating: number | null;
  originalImage: string | null;
  generatedImage: string | null;
  hairstyle: {
    id: string;
    name: string;
    category: string;
    thumbnail: string;
    price: number;
  } | null;
}

export interface CompareSummary {
  count: number;
  totalCreditsUsed: number;
  averageRating: number | null;
}

export interface AiBenchmarkCasePreview {
  id: string;
  label: string;
  targetStyleName: string;
  sourceStyleName: string;
  tier: 'standard' | 'premium';
  previews: Record<string, string | null>;
}

export interface AiBenchmarkCandidateCaseResult {
  caseId: string;
  caseLabel: string;
  status: 'completed' | 'failed';
  latencyMs: number;
  previewPath?: string;
  error?: string;
  targetStyleName: string;
  evaluation?: {
    styleAccuracy: number;
    identityPreservation: number;
    realism: number;
    preservation: number;
    mobileReadiness: number;
    weightedScore: number;
    summary: string;
    majorIssues: string[];
  };
}

export interface AiBenchmarkCandidateSummary {
  id: string;
  label: string;
  provider: string;
  model: string;
  tier: 'standard' | 'premium';
  status: 'completed' | 'partial' | 'failed' | 'blocked';
  runCount: number;
  averageQualityScore: number | null;
  averageLatencyMs: number | null;
  costPerRenderUsd: number;
  costBandValid: boolean;
  blockers: string[];
  caseResults: AiBenchmarkCandidateCaseResult[];
}

export interface AiBenchmarkRecommendationLane {
  baselineId: string;
  baselineLabel: string;
  baselineQualityScore: number | null;
  baselineLatencyMs: number | null;
  selectedCandidateId: string | null;
  selectedCandidateLabel: string | null;
  selectedQualityScore: number | null;
  selectedLatencyMs: number | null;
  selectedCostPerRenderUsd: number | null;
  improvement: number | null;
  costBandValid: boolean;
  creditBudgetUsd: number;
  recommendationMet: boolean;
  rejectedCandidates: Array<{
    id: string;
    label: string;
    status: string;
    averageQualityScore: number | null;
    costBandValid: boolean;
    blockers: string[];
  }>;
}

export interface AiBenchmarkSummary {
  runId: string;
  generatedAt: string;
  datasetVersion: string;
  baselineCandidateId: string;
  monetization: {
    targetGrossMargin: number;
    floorRevenuePerCreditUsd: number;
    standardGenerationCredits: number;
    premiumGenerationCredits: number;
    standardMaxCostUsd: number;
    premiumMaxCostUsd: number;
  };
  candidates: AiBenchmarkCandidateSummary[];
  cases: AiBenchmarkCasePreview[];
  recommendation: {
    standard: AiBenchmarkRecommendationLane;
    premium: AiBenchmarkRecommendationLane;
  };
  memo: {
    executiveSummary: string;
    reviewChecklist: string[];
  };
}


class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }


async verifyGooglePlayPurchase(data: {
        productId: string;
        purchaseToken: string;
        packageName: string; // Get this from your capacitor config or .env
    }): Promise<{ success: boolean; message?: string; creditsGranted?: number }> {
        try {
            const response = await fetch(`${API_BASE_URL}/payments/verify-google-play`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return result; // Should match the backend response { success: boolean, message: string, creditsGranted: number }
        } catch (error) {
            console.error('Verify Google Play purchase error:', error);
            return { success: false, message: 'Network error during verification.' };
        }
    }

    
  // Authentication
async signInWithGoogle(googleData: any): Promise<{ success: boolean; data?: { user: User; token: string }; message?: string }> { // Added optional data/message
    // 1. Check for a pending referral code captured by the landing page
    const pendingReferralCode = localStorage.getItem('referral_code');
    // 2. Check for existing guest token to migrate
    const guestToken = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    let isGuest = false;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        isGuest = parsed?.isGuest === true;
      } catch { /* ignore */ }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: googleData.credential,
          email: googleData.email,
          name: googleData.name,
          avatar: googleData.avatar,
          googleId: googleData.sub,
          // 2. Send the pending code if it exists
          referralCode: pendingReferralCode || undefined, // Send undefined if null/empty
          // 3. Send guest token for migration
          guestToken: isGuest ? guestToken : undefined
        })
      });

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user_data', JSON.stringify(result.data.user));
        localStorage.setItem('has_signed_in', '1');
        // Referral used (or wasn't present), clear pending code
        localStorage.removeItem('referral_code');

        const basePlayStoreUrl = localStorage.getItem('basePlayStoreUrl')
        localStorage.removeItem('basePlayStoreUrl');

        if (basePlayStoreUrl){
window.location.assign(basePlayStoreUrl);
        }  
        return { success: true, data: result.data, message: result.message };
      } else {
        // Sign-in failed on backend, still clear pending code
        localStorage.removeItem('referral_code');
        return { success: false, message: result.message || 'Backend sign-in failed.' };
      }

    } catch (error: any) {
      localStorage.removeItem('referral_code');
      console.error("[apiService.signInWithGoogle] Network/fetch error, removed pending code.");
      return { success: false, message: error.message || 'A network error occurred.' };
    }
  }


  async getCurrentUser(): Promise<{ success: boolean; data: User | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      // Backend returns { data: { user: ... } }. Persist the *user* consistently.
      if (result?.data?.user) {
        localStorage.setItem('user_data', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: true, data: null };
    }
  }

  async signOut(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('studio_status');
    localStorage.removeItem('guest_device_id');
  }

  // Create or resume guest session (for try-before-login flow)
  async createGuestSession(): Promise<{ success: boolean; data?: { user: User; token: string }; message?: string }> {
    try {
      // Get or create a persistent device ID
      let deviceId = localStorage.getItem('guest_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID ? crypto.randomUUID() : 
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        localStorage.setItem('guest_device_id', deviceId);
      }

      const response = await fetch(`${API_BASE_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user_data', JSON.stringify(result.data.user));
        return { success: true, data: result.data, message: result.message };
      } else {
        return { success: false, message: result.message || 'Failed to create guest session.' };
      }
    } catch (error: any) {
      console.error('Create guest session error:', error);
      return { success: false, message: error.message || 'Network error.' };
    }
  }


  async getHairstyleCategories(): Promise<{ success: boolean; data: { name: string, count: number }[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/hairstyles/meta/categories`);
      const result = await response.json();
      return { success: result.status === 'success', data: result.data.categories || [] };
    } catch (error) {
      console.error('Get hairstyle categories error:', error);
      return { success: false, data: [] };
    }
  }

  // Hairstyles
 async getHairstyles(filters?: { 
    category?: string; 
    gender?: string; 
    search?: string; 
    sort?: string; 
    page?: number;   // 👈 ADDED page
    limit?: number; // 👈 ADDED limit
    feature?: string; 
    type?: 'default' | 'custom';
  }): Promise<HairstyleListResponse> { // 👈 CHANGED return type
    try {
      const params = new URLSearchParams();
      
      if (filters?.category && filters.category !== 'All') {
        params.append('category', filters.category);
      }
      
      if (filters?.gender && filters.gender !== 'All') {
        params.append('gender', filters.gender);
      }  
      if (filters?.feature && filters.feature !== 'All') {
        params.append('feature', filters.feature);
      } 
      if (filters?.sort && filters.sort !== 'All') {
        params.append('sort', filters.sort);
      }
      
      if (filters?.search) {
        params.append('search', filters.search);
      }

        if (filters?.type) {
        params.append('type', filters.type);
      }

      // 👈 ADDED pagination parameters
      if (filters?.page) {
        params.append('page', String(filters.page));
      }
      if (filters?.limit) {
        params.append('limit', String(filters.limit));
      }


      const response = await fetch(`${API_BASE_URL}/hairstyles?${params}`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get hairstyles error:', error);
      // Return a default, correctly structured error object
      return { 
        status: 'error', 
        results: 0, 
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        data: { hairstyles: [] } 
      };
    }
  }

  async getHairstyle(id: string): Promise<{ success: boolean; data: Hairstyle }> {
    try {
      const response = await fetch(`${API_BASE_URL}/hairstyles/${id}`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get hairstyle error:', error);
      return { success: false, data: {} as Hairstyle };
    }
  }

  // A3: Input gate — validates selfie quality before generation (no credits consumed)
  async validateInput(imageFile: File): Promise<{
    success: boolean;
    score?: number;
    stage?: string;
    issues?: Array<{ code: string; message: string }>;
    suggestion?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/generations/validate-input`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Validate input error:', error);
      // Fail-open: if validation service is down, let the user proceed
      return { success: true };
    }
  }

  // Generations
  async generateHairstyle(hairstyleId: string, mimeType: string, imageFile: File, generationMode: string = 'hd'): Promise<{ success: boolean; data: { generationId: string; status: string; generationMode?: string }; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('hairstyleId', hairstyleId);
      formData.append('mimeType', mimeType);
      formData.append('image', imageFile);
      formData.append('generationMode', generationMode);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/generations/generate`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Generate hairstyle error:', error);
      return { success: false, data: { generationId: '', status: 'failed' } };
    }
  }

async analyzeHairstyleImage(imageFile: File,imageMimeType:any,selectedPhoto:any): Promise<HairstyleAnalysisResponse> {
    const formData = new FormData();

 
formData.append('hairstyleImage', imageFile, 'custom_style.jpg'); 
    formData.append('userPhoto', selectedPhoto, 'user_headshot.jpg');

    
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/generations/analyze-hairstyle`, {
      method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      return await response.json();
      
    } catch (error: any) {
      console.error('Hairstyle analysis network error:', error);
      return { 
          success: false, 
          ai_description: '', 
          message: error.message || 'A network error occurred.' 
      };
    }
  }


  async getGenerationStatus(generationId: string): Promise<{ success: boolean; data: Generation }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generations/${generationId}/status`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get generation status error:', error);
      return { success: false, data: {} as Generation };
    }
  }

  async getGenerationHistory(options?: { page?: number; limit?: number; status?: string; search?: string; sort?: string }): Promise<{ success: boolean; data: Generation[]; pagination?: { current: number; pages: number; total: number } }> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', String(options.page));
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.status) params.append('status', options.status);
      if (options?.search) params.append('search', options.search);
      if (options?.sort) params.append('sort', options.sort);

      const response = await fetch(`${API_BASE_URL}/generations/history?${params}`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get generation history error:', error);
      return { success: false, data: [] };
    }
  }

  // Payments
  async initializePayment(type: 'credit_pack' | 'subscription', planId: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ type, planId })
      });

      return await response.json();
    } catch (error) {
      console.error('Initialize payment error:', error);
      return { success: false, data: null };
    }
  }

  async verifyPayment(reference: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reference })
      });

      return await response.json();
    } catch (error) {
      console.error('Verify payment error:', error);
      return { success: false, data: null };
    }
  }

  // Webhook-independent credit-pack fallback: backend verifies the purchase against
  // RevenueCat's REST API and grants credits idempotently. Safe to call after every
  // successful purchasePackage() for a credit pack.
  async syncPurchase(productId: string): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/sync-purchase`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ productId })
      });

      return await response.json();
    } catch (error) {
      console.error('Sync purchase error:', error);
      return { success: false, message: 'Network error' };
    }
  }
  

   async grantFreeCredit(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reward_ad`, {
          method: 'POST',
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get generation status error:', error);
      return { success: false, data: {} as Generation };
    }
  }

  async claimReviewReward(): Promise<{ success: boolean; message: string; data?: { creditsAwarded: number; newBalance: number; hasClaimedReviewReward: boolean } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/claim-review-reward`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      if (result.status === 'success') {
        return { success: true, message: result.message, data: result.data };
      }
      return { success: false, message: result.message || 'Could not claim reward.' };
    } catch (error) {
      console.error('Claim review reward error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

async getReferralInfo(): Promise<{ success: boolean; data: { referralCode: string; referralCount: number; creditsEarned: number } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/referral-info`, {
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      if (result.status === 'success') {
        return { success: true, data: result.data };
      }
      return { success: false, data: { referralCode: '', referralCount: 0, creditsEarned: 0 } };
    } catch (error) {
      console.error('Get referral info error:', error);
      return { success: false, data: { referralCode: '', referralCount: 0, creditsEarned: 0 } };
    }
  }


  async updateDeviceToken(deviceToken:any): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-device-token`, {
          method: 'POST',
        headers: this.getAuthHeaders(),
        body:JSON.stringify(deviceToken)
      });
       return await response.json();
    } catch (error) {
      console.error('updateDeviceToken:', error);
      return { success: false, data: null };
    }
  }


  async deleteAccount(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/account/delete`, {
          method: 'DELETE',
        headers: this.getAuthHeaders()
      });
       return await response.json();
    } catch (error) {
      console.error('deleteAccount:', error);
      return { success: false, data: null };
    }
  }


  async getPaymentHistory(): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/history`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get payment history error:', error);
      return { success: false, data: [] };
    }
  }

  async getCreditLedger(page: number = 1, limit: number = 20): Promise<{ success: boolean; data: CreditLedgerResponse | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/ledger?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get credit ledger error:', error);
      return { success: false, data: null };
    }
  }

  async getPricingPlans(): Promise<{ success: boolean; data: any }> {
    return this.getPricingCatalog();
  }

  async getPricingCatalog(): Promise<{ success: boolean; data: PricingCatalog }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/catalog`);
      return await response.json();
    } catch (error) {
      console.error('Get pricing plans error:', error);
      return { success: false, data: EMPTY_PRICING_CATALOG };
    }
  }

  async getSubscriptionPlans(): Promise<{ success: boolean; data: { version: string; subscriptions: PricingCatalog['subscriptions'] } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscriptions/plans`);
      return await response.json();
    } catch (error) {
      console.error('Get subscription plans error:', error);
      return { success: false, data: { version: 'v1', subscriptions: [] } };
    }
  }

  async getSubscriptionStatus(): Promise<{ success: boolean; data: SubscriptionStatus | null; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscription/status`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get subscription status error:', error);
      return { success: false, data: null, message: 'Unable to load subscription status' };
    }
  }

  async cancelSubscription(): Promise<{ success: boolean; data: { subscription: SubscriptionStatus } | null; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscription/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return { success: false, data: null, message: 'Unable to cancel subscription' };
    }
  }

  async restoreSubscription(): Promise<{ success: boolean; data: { subscription: SubscriptionStatus } | null; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscription/restore`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Restore subscription error:', error);
      return { success: false, data: null, message: 'Unable to restore subscription' };
    }
  }

  // C3: Change subscription plan (upgrade/downgrade)
  async changeSubscriptionPlan(newPlanId: string): Promise<{
    success: boolean;
    message?: string;
    data?: {
      oldPlan: { id: string; creditsPerMonth: number };
      newPlan: { id: string; creditsPerMonth: number };
      isUpgrade: boolean;
      proratedCredits: number;
      subscription: SubscriptionStatus;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscription/change-plan`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ newPlanId })
      });
      return await response.json();
    } catch (error) {
      console.error('Change subscription plan error:', error);
      return { success: false, message: 'Unable to change plan' };
    }
  }

  // C3: Sync subscription state with provider (after restore purchases)
  async syncSubscription(params: {
    planId: string;
    provider?: string;
    providerSubscriptionId?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: {
      subscription: SubscriptionStatus;
      grantedCredits?: number;
      refreshed?: boolean;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/subscription/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(params)
      });
      return await response.json();
    } catch (error) {
      console.error('Sync subscription error:', error);
      return { success: false, message: 'Unable to sync subscription' };
    }
  }

  // Analytics
  async trackEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
    try {
      // Get or create a persistent session ID
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('session_id', sessionId);
      }

      await fetch(`${API_BASE_URL}/analytics/track`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          eventName,
          eventData,
          sessionId
        })
      });
    } catch (error) {
      // Analytics errors should not break the app - fail silently
      console.error('Analytics tracking error:', error);
    }
  }

  async getAnalyticsDashboard(period: string = '30'): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard?period=${period}`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get analytics dashboard error:', error);
      return { success: false, data: null };
    }
  }

  async getActivityTimeline(page: number = 1): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/timeline?page=${page}`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get activity timeline error:', error);
      return { success: false, data: [] };
    }
  }

  async getAiBenchmarkSummary(): Promise<{ success: boolean; data: AiBenchmarkSummary | null; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/ai-benchmark/summary`);
      return await response.json();
    } catch (error) {
      console.error('Get AI benchmark summary error:', error);
      return { success: false, data: null, message: 'Failed to load AI benchmark summary' };
    }
  }

  // A4: Quality + cost analytics
  async getQualityAnalytics(days: number = 30): Promise<{ success: boolean; data: QualityAnalyticsData | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/quality?days=${days}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get quality analytics error:', error);
      return { success: false, data: null };
    }
  }

  async getQualityModeStats(days: number = 7): Promise<{ success: boolean; data: { modes: QualityModeStats[] } | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/quality/modes?days=${days}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get quality mode stats error:', error);
      return { success: false, data: null };
    }
  }

  // G2: Collection & recommendation analytics
  async getCollectionAnalytics(days: number = 30): Promise<{ success: boolean; data: CollectionAnalyticsData | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/collections?days=${days}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get collection analytics error:', error);
      return { success: false, data: null };
    }
  }

  async getRecommendationAnalytics(days: number = 30): Promise<{ success: boolean; data: RecommendationAnalyticsData | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/recommendations?days=${days}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get recommendation analytics error:', error);
      return { success: false, data: null };
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }

  async createAnimatedShareable(
    imageUrl: string,
    artistName: string
  ): Promise<{ success: boolean; animatedFileUrl?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/watermark/create-premium`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ imageUrl, artistName })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return { success: true, animatedFileUrl: result.data.animatedFileUrl };
      } else {
        return { success: false, message: result.message || 'Failed to create animated file.' };
      }
    } catch (error: any) {
      console.error('Create animated shareable error:', error);
      return { success: false, message: error.message || 'A network error occurred.' };
    }
  }

  // ==================== FAVORITES API ====================

  async toggleFavorite(targetType: 'hairstyle' | 'generation', targetId: string): Promise<{ success: boolean; isFavorited: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ targetType, targetId })
      });
      const result = await response.json();
      return { success: result.success, isFavorited: result.data?.isFavorited, message: result.message };
    } catch (error) {
      console.error('Toggle favorite error:', error);
      return { success: false, isFavorited: false };
    }
  }

  async getFavorites(type?: 'hairstyle' | 'generation', page: number = 1): Promise<{ success: boolean; data: any[]; pagination?: any }> {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (type) params.append('type', type);
      
      const response = await fetch(`${API_BASE_URL}/favorites?${params}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get favorites error:', error);
      return { success: false, data: [] };
    }
  }

  async getFavoriteIds(type: 'hairstyle' | 'generation' = 'hairstyle'): Promise<{ success: boolean; data: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/ids?type=${type}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get favorite IDs error:', error);
      return { success: false, data: [] };
    }
  }

  // ==================== USER PROFILE API ====================

  async updateProfile(data: { name?: string; preferences?: { notifications?: boolean; newsletter?: boolean } }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  }

  // ==================== STREAKS API ====================

  async getStreakStatus(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/streaks/status`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get streak status error:', error);
      return { success: false, data: null };
    }
  }

  async checkInStreak(): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/streaks/checkin`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Check in streak error:', error);
      return { success: false, data: null };
    }
  }

  // ==================== REWARD ADS API ====================

  async getRewardAdStatus(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reward_ad/status`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get reward ad status error:', error);
      return { success: false, data: null };
    }
  }

  // ==================== PUSH NOTIFICATIONS API ====================

  async registerDeviceToken(deviceToken: string, platform: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/push/register-token`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ deviceToken, platform })
      });
      return await response.json();
    } catch (error) {
      console.error('Register device token error:', error);
      return { success: false };
    }
  }

  async unregisterDeviceToken(): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/push/unregister-token`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Unregister device token error:', error);
      return { success: false };
    }
  }

  async getPushStats(): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/push/stats`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get push stats error:', error);
      return { success: false, data: [] };
    }
  }

  // ==================== EXPORT API ====================

  async getExportStatus(): Promise<{ 
    success: boolean; 
    data: { canExportClean: boolean; isPro: boolean } 
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/watermark/export-status`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get export status error:', error);
      return { success: false, data: { canExportClean: false, isPro: false } };
    }
  }

  async exportImage(imageUrl: string, hairstyleName?: string): Promise<{
    success: boolean;
    data: {
      exportUrl: string;
      isClean: boolean;
      showWatermark?: boolean;
      watermarkText?: string;
      upsellMessage?: string;
    }
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/watermark/export`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ imageUrl, hairstyleName })
      });
      return await response.json();
    } catch (error) {
      console.error('Export image error:', error);
      return { 
        success: false, 
        data: { exportUrl: imageUrl, isClean: false, showWatermark: true } 
      };
    }
  }

  // ─── G1: Saved Looks API ─────────────────────────────────────────────────

  async saveLook(generationId: string, data?: { title?: string; notes?: string; tags?: string[]; collection?: string }): Promise<{ success: boolean; data?: SavedLook; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-looks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ generationId, ...data })
      });
      return await response.json();
    } catch (error) {
      console.error('Save look error:', error);
      return { success: false, message: 'Failed to save look' };
    }
  }

  async getSavedLooks(options?: { collection?: string; tag?: string; page?: number; limit?: number }): Promise<{ success: boolean; data: SavedLook[]; pagination?: { current: number; pages: number; total: number } }> {
    try {
      const params = new URLSearchParams();
      if (options?.collection) params.append('collection', options.collection);
      if (options?.tag) params.append('tag', options.tag);
      if (options?.page) params.append('page', String(options.page));
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await fetch(`${API_BASE_URL}/saved-looks?${params}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get saved looks error:', error);
      return { success: false, data: [] };
    }
  }

  async getSavedLookCollections(): Promise<{ success: boolean; data: SavedLookCollection[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-looks/collections`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get collections error:', error);
      return { success: false, data: [] };
    }
  }

  async updateSavedLook(id: string, data: { title?: string; notes?: string; tags?: string[]; collection?: string; isPinned?: boolean }): Promise<{ success: boolean; data?: SavedLook; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-looks/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Update saved look error:', error);
      return { success: false, message: 'Failed to update look' };
    }
  }

  async deleteSavedLook(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-looks/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Delete saved look error:', error);
      return { success: false, message: 'Failed to delete look' };
    }
  }

  // ─── G1: Rating API ──────────────────────────────────────────────────────

  async rateGeneration(generationId: string, rating: number, feedback?: string): Promise<{ success: boolean; data?: { rating: number; feedback: string | null }; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-looks/rate/${generationId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rating, ...(feedback && { feedback }) })
      });
      return await response.json();
    } catch (error) {
      console.error('Rate generation error:', error);
      return { success: false, message: 'Failed to save rating' };
    }
  }

  // ─── G1: Compare Mode API ────────────────────────────────────────────────

  async compareGenerations(generationIds: string[]): Promise<{ success: boolean; data?: { items: CompareItem[]; summary: CompareSummary }; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-looks/compare`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ generationIds })
      });
      return await response.json();
    } catch (error) {
      console.error('Compare generations error:', error);
      return { success: false, message: 'Failed to load comparison' };
    }
  }

  async getCompareCandidates(limit?: number): Promise<{ success: boolean; data: CompareCandidate[]; total?: number }> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await fetch(`${API_BASE_URL}/saved-looks/compare-candidates${params}`, {
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Get compare candidates error:', error);
      return { success: false, data: [] };
    }
  }

  // A2: Get hairstyle attribute coverage stats
  async getAttributeStats(): Promise<AttributeStatsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/hairstyles/attributes/stats`);
      return await response.json();
    } catch (error) {
      console.error('Get attribute stats error:', error);
      return { status: 'error', data: { promptVersion: '', totalActive: 0, withStructuredAttributes: 0, coverage: 0, byPromptFamily: [] } };
    }
  }

  // ─── G2: Collections & Recommendations ───────────────────────────────────

  async getCollections(gender?: string): Promise<{ success: boolean; data: StyleCollection[] }> {
    try {
      const params = gender ? `?gender=${gender}` : '';
      const response = await fetch(`${API_BASE_URL}/collections${params}`);
      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result.data?.collections || []
      };
    } catch (error) {
      console.error('Get collections error:', error);
      return { success: false, data: [] };
    }
  }

  async getCollectionBySlug(slug: string): Promise<{ success: boolean; data: StyleCollection | null }> {
    try {
      const response = await fetch(`${API_BASE_URL}/collections/${encodeURIComponent(slug)}`);
      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result.data?.collection || null
      };
    } catch (error) {
      console.error('Get collection error:', error);
      return { success: false, data: null };
    }
  }

  async trackCollectionConversion(slug: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/collections/${encodeURIComponent(slug)}/conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch { /* fire-and-forget */ }
  }

  async getForYouRecommendations(options?: { gender?: string; limit?: number }): Promise<{ success: boolean; data: StyleRecommendation[] }> {
    try {
      const params = new URLSearchParams();
      if (options?.gender) params.append('gender', options.gender);
      if (options?.limit) params.append('limit', String(options.limit));
      const response = await fetch(`${API_BASE_URL}/collections/recommendations/for-you?${params}`, {
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result.data?.recommendations || []
      };
    } catch (error) {
      console.error('Get recommendations error:', error);
      return { success: false, data: [] };
    }
  }

  async getSimilarStyles(hairstyleId: string, limit?: number): Promise<{ success: boolean; data: StyleRecommendation[] }> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await fetch(`${API_BASE_URL}/collections/recommendations/similar/${hairstyleId}${params}`);
      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result.data?.recommendations || []
      };
    } catch (error) {
      console.error('Get similar styles error:', error);
      return { success: false, data: [] };
    }
  }

  async getTrendingStyles(options?: { gender?: string; limit?: number }): Promise<{ success: boolean; data: StyleRecommendation[] }> {
    try {
      const params = new URLSearchParams();
      if (options?.gender) params.append('gender', options.gender);
      if (options?.limit) params.append('limit', String(options.limit));
      const response = await fetch(`${API_BASE_URL}/collections/recommendations/trending?${params}`);
      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result.data?.recommendations || []
      };
    } catch (error) {
      console.error('Get trending styles error:', error);
      return { success: false, data: [] };
    }
  }

  async getStyleContextNotes(hairstyleId: string): Promise<{ success: boolean; data: { notes: StyleContextNote[]; styleName: string } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/collections/recommendations/context/${hairstyleId}`);
      const result = await response.json();
      return {
        success: result.status === 'success',
        data: result.data || { notes: [], styleName: '' }
      };
    } catch (error) {
      console.error('Get style context error:', error);
      return { success: false, data: { notes: [], styleName: '' } };
    }
  }
  
}



 



export const apiService = new ApiService();

// Backward compatibility exports
export const signInWithGoogle = (data: any) => apiService.signInWithGoogle(data);
export const getCurrentUser = () => apiService.getCurrentUser();
export const signOut = () => apiService.signOut();
export const getHairstyles = (filters?: any) => apiService.getHairstyles(filters);
export const generateHairstyle = (hairstyleId: string, imageFile: File) => apiService.generateHairstyle(hairstyleId, imageFile);
export const trackEvent = (eventName: string, properties: Record<string, any>) => apiService.trackEvent(eventName, properties);