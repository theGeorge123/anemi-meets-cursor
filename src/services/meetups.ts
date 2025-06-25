import { supabase } from '../supabaseClient';
import { MeetupFormData } from '../types/meetups';

export const getCities = async (): Promise<{
  data: { id: string; name: string }[] | null;
  error: unknown;
}> => supabase.from('cities').select('*');

export const createMeetup = async (data: MeetupFormData) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any)
    .from('meetups')
    .insert([{ ...data }])
    .single();
