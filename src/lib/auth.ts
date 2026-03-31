import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

export const auth = {
  async signUp(email: string, password: string, fullName: string): Promise<AuthResult> {
    console.log('[Auth] Signing up user:', email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('[Auth] Sign up error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('[Auth] No user returned from sign up');
        return { success: false, error: 'Failed to create account' };
      }

      console.log('[Auth] Sign up successful:', data.user.id);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[Auth] Unexpected sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error during sign up'
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    console.log('[Auth] Signing in user:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('[Auth] No user returned from sign in');
        return { success: false, error: 'Failed to sign in' };
      }

      console.log('[Auth] Sign in successful:', data.user.id);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[Auth] Unexpected sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error during sign in'
      };
    }
  },

  async signOut(): Promise<AuthResult> {
    console.log('[Auth] Signing out user');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Auth] Sign out error:', error);
        return { success: false, error: error.message };
      }

      console.log('[Auth] Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Unexpected sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error during sign out'
      };
    }
  },

  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Get session error:', error);
        return null;
      }

      return data.session;
    } catch (error) {
      console.error('[Auth] Unexpected get session error:', error);
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error('[Auth] Get user error:', error);
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('[Auth] Unexpected get user error:', error);
      return null;
    }
  },

  async resetPassword(email: string): Promise<AuthResult> {
    console.log('[Auth] Requesting password reset for:', email);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        console.error('[Auth] Password reset error:', error);
        return { success: false, error: error.message };
      }

      console.log('[Auth] Password reset email sent');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Unexpected password reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error during password reset'
      };
    }
  },

  async updatePassword(newPassword: string): Promise<AuthResult> {
    console.log('[Auth] Updating password');

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('[Auth] Password update error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('[Auth] No user returned from password update');
        return { success: false, error: 'Failed to update password' };
      }

      console.log('[Auth] Password updated successfully');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[Auth] Unexpected password update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error during password update'
      };
    }
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] Auth state changed:', session?.user?.id || 'signed out');
      callback(session);
    });

    return subscription;
  }
};
