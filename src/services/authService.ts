import { supabase } from './supabaseClient';
import { Provider } from '@supabase/supabase-js';

export const getSession = () => supabase.auth.getSession();
export const getUser = () => supabase.auth.getUser();
export const onAuthStateChange = supabase.auth.onAuthStateChange.bind(supabase.auth);
export const signOut = () => supabase.auth.signOut();
export const signInWithPassword = (opts: { email: string; password: string; }) => supabase.auth.signInWithPassword(opts);
export const signInWithOAuth = (opts: { provider: Provider }) => supabase.auth.signInWithOAuth(opts);
export const resetPasswordForEmail = (email: string) => supabase.auth.resetPasswordForEmail(email);
export const signUp = (opts: { email: string; password: string; options?: any }) => supabase.auth.signUp(opts);
