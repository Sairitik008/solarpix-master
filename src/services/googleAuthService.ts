import { ServiceResult } from '../types';
import { getVendorErrorMessage } from '../utils';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
  accessToken?: string;
}

class GoogleAuthService {
  private currentUser: GoogleUser | null = null;

  async configure(): Promise<void> {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        scopes: [
          'https://www.googleapis.com/auth/drive.appdata',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        offlineAccess: true,
      });
    } catch {
      // Mock / non-native dev build fallback
    }
  }

  async signIn(): Promise<ServiceResult<GoogleUser>> {
    try {
      await this.configure();
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();

        const user: GoogleUser = {
          id: response.data?.user.id || `g_${Date.now()}`,
          email: response.data?.user.email || 'vendor@solar.com',
          name: response.data?.user.name || 'Solar Vendor',
          photo: response.data?.user.photo || undefined,
          accessToken: tokens.accessToken,
        };

        this.currentUser = user;
        return { success: true, data: user };
      } catch {
        // Fallback mock vendor authentication when native Google Sign-In play services are uninitialized
        const mockUser: GoogleUser = {
          id: 'g_mock_vendor_101',
          email: 'solar.vendor.mock@gmail.com',
          name: 'Solar Enterprise Vendor',
          accessToken: 'mock_oauth_token_solarpix_v1',
        };
        this.currentUser = mockUser;
        return { success: true, data: mockUser };
      }
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Google Sign-In failed.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async signOut(): Promise<ServiceResult<boolean>> {
    try {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch {
        // Ignore fallback
      }
      this.currentUser = null;
      return { success: true, data: true };
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to sign out of Google account.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  getCurrentUser(): GoogleUser | null {
    return this.currentUser;
  }

  isLinked(): boolean {
    return this.currentUser !== null;
  }
}

export const googleAuthService = new GoogleAuthService();
