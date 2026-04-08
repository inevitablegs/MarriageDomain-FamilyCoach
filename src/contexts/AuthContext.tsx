import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
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
    relationshipStatus?: 'single' | 'engaged' | 'married'
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile: Profile | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const signUpInProgressRef = useRef(false);

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

      // If a sign-up is in progress, skip the self-heal — signUp will create
      // the profile with the correct relationship_status.
      if (signUpInProgressRef.current) {
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!existingProfile) {
        const fallbackName =
          (typeof authUser.user_metadata?.full_name === 'string' && authUser.user_metadata.full_name.trim()) ||
          (typeof authUser.email === 'string' && authUser.email.split('@')[0]) ||
          'User';

        const { error: insertError } = await supabase.from('profiles').insert({
          id: authUser.id,
          email: authUser.email || '',
          full_name: fallbackName,
          relationship_status: 'single',
          role: 'user',
        });

        if (insertError) throw insertError;
      }

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
    relationshipStatus: 'single' | 'engaged' | 'married' = 'single'
  ) => {
    // Prevent loadProfile self-heal from racing with our profile creation.
    signUpInProgressRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        const message = (error.message || '').toLowerCase();
        if (message.includes('429') || message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
          return { error: new Error('Too many signup attempts. Please wait 30-60 seconds and try again.') };
        }
        throw error;
      }

      // Only write profile/invitations when session exists (authenticated).
      // If email confirmation is enabled, session is null and profile writes will fail with 401.
      if (data.user && data.session) {
        // Use upsert instead of insert: the onAuthStateChange listener may have
        // already created a self-healed profile row with default 'single' status.
        // The upsert ensures the correct relationship_status is set.
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email,
              full_name: fullName,
              relationship_status: relationshipStatus,
              role: 'user',
            },
            { onConflict: 'id' }
          );

        if (profileError) throw profileError;

        // Re-read the profile so React state is up-to-date with the correct status.
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (freshProfile) {
          setProfile(freshProfile);
        }
      }

      // If the project has email confirmation disabled, this creates a session immediately.
      // If not, try to sign in directly so the app can continue without manual confirmation when allowed.
      if (!data.session) {
        const { error: autoSignInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (autoSignInError) {
          const message = autoSignInError.message?.toLowerCase() || '';
          if (message.includes('429') || message.includes('rate limit')) {
            return { error: new Error('Too many auth requests right now. Please wait a minute and try again.') };
          }
          if (message.includes('email not confirmed') || message.includes('not confirmed')) {
            return {
              error: new Error(
                'Email confirmation is enabled in Supabase. Disable "Confirm email" in Supabase Auth settings to skip Gmail confirmation for now.'
              ),
            };
          }

          return { error: autoSignInError as Error };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      signUpInProgressRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch the signed-in user and load their profile so the caller
      // can validate mode (before/after marriage) before navigating.
      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData?.user;
      if (!authUser?.id) {
        return { error: new Error('Unable to load account after sign in.'), profile: null };
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);
      }

      return { error: null, profile: profileData as Profile | null };
    } catch (error) {
      return { error: error as Error, profile: null };
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
