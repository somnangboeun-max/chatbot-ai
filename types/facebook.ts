/**
 * Facebook-related TypeScript types
 * Story 4.1: Facebook Page Connection Flow
 */

/**
 * Facebook Page data returned from Graph API
 */
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

/**
 * Facebook connection status for UI display
 */
export interface FacebookConnectionStatus {
  isConnected: boolean;
  pageId: string | null;
  pageName: string | null;
  pageAvatarUrl: string | null;
  connectedAt: string | null;
}

/**
 * Pending Facebook pages stored in cookie after OAuth
 * Note: Cookie content is encrypted with AES-256-GCM
 */
export interface PendingFacebookPages {
  pages: FacebookPage[];
  expiresAt: number;
}
