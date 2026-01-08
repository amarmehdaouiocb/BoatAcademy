import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: 'student' | 'instructor' | 'manager' | 'admin';
};

type Student = {
  user_id: string;
  site_id: string;
  oedipp_number: string | null;
  access_expires_at: string | null;
  site: {
    name: string;
  } | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  student: Student | null;
  loading: boolean;
  profileLoading: boolean;
  isAccessExpired: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string, siteId?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Vérifie si l'accès du stagiaire est expiré
  const isAccessExpired = student?.access_expires_at
    ? new Date(student.access_expires_at) < new Date()
    : false;

  const fetchProfile = useCallback(async (userId: string, userMetadata?: Record<string, any>) => {
    setProfileLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, role')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Erreur lors du chargement du profil:', profileError);
        return;
      }

      setProfile(profileData as Profile);

      // If user is a student, fetch student info
      if (profileData?.role === 'student') {
        let { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            user_id,
            site_id,
            oedipp_number,
            access_expires_at,
            site:sites(name)
          `)
          .eq('user_id', userId)
          .single();

        // If no student record exists but user has site_id in metadata, create it
        if (studentError && studentError.code === 'PGRST116' && userMetadata?.site_id) {
          const { data: newStudent, error: createError } = await supabase
            .from('students')
            .insert({
              user_id: userId,
              site_id: userMetadata.site_id,
            })
            .select(`
              user_id,
              site_id,
              oedipp_number,
              access_expires_at,
              site:sites(name)
            `)
            .single();

          if (createError) {
            console.error('Erreur lors de la création du stagiaire:', createError);
          } else {
            studentData = newStudent;
            studentError = null;
          }
        }

        if (studentError) {
          console.error('Erreur lors du chargement des infos stagiaire:', studentError);
        } else if (studentData) {
          setStudent(studentData as unknown as Student);
        }
      }
    } catch (error) {
      console.error('Erreur dans fetchProfile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id, session.user.user_metadata);
        } else {
          setProfile(null);
          setStudent(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, siteId?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          site_id: siteId || null,
        },
      },
    });

    if (error) {
      return { error: error as Error };
    }

    // Note: Profile and student record will be created by database triggers on auth.users insert
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setStudent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        student,
        loading,
        profileLoading,
        isAccessExpired,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
