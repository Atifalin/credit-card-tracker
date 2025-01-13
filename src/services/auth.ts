import { supabase } from './supabase';
import { AuthError, AuthResponse } from '@supabase/supabase-js';

export interface AuthState {
  loading: boolean;
  error: string | null;
  user: any;
}

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { error };
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Function to create a profile after signup
export const createProfile = async (userId: string, name: string) => {
  const { error } = await supabase
    .from('profiles')
    .insert([{ id: userId, name }]);
  return { error };
};
