import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    relationshipStatus?: 'single' | 'engaged' | 'married',
    partnerEmail?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        return;
      }

      // Self-heal for old users or partial signups where profile row is missing.
      const fallbackName =
        (typeof authUser.user_metadata?.full_name === 'string' && authUser.user_metadata.full_name.trim()) ||
        (typeof authUser.email === 'string' && authUser.email.split('@')[0]) ||
        'User';

      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: authUser.id,
          email: authUser.email || '',
          full_name: fallbackName,
          relationship_status: 'single',
        },
        { onConflict: 'id' }
      );

      if (upsertError) throw upsertError;

      const { data: createdProfile, error: createdProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (createdProfileError) throw createdProfileError;
      setProfile(createdProfile || null);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    relationshipStatus: 'single' | 'engaged' | 'married' = 'single',
    partnerEmail?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            relationship_status: relationshipStatus,
          });

        if (profileError) throw profileError;

        const normalizedPartnerEmail = (partnerEmail || '').trim().toLowerCase();
        const normalizedUserEmail = email.trim().toLowerCase();

        if (
          relationshipStatus === 'married' &&
          normalizedPartnerEmail.length > 0 &&
          normalizedPartnerEmail !== normalizedUserEmail
        ) {
          const { error: invitationError } = await supabase.from('partner_invitations').insert({
            inviter_id: data.user.id,
            invitee_email: normalizedPartnerEmail,
            status: 'pending',
          });

          // Keep sign up successful even if invitation insert fails.
          if (invitationError) {
            console.warn('Unable to create partner invitation during sign up:', invitationError.message);
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
