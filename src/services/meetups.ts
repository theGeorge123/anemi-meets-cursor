import { supabase } from '../supabaseClient';
import { MeetupFormData } from '../types/meetups';

export const getCities = async (): Promise<{
  data: { id: string; name: string }[] | null;
  error: unknown;
}> => supabase.from('cities').select('*');

export const createMeetup = async (data: MeetupFormData) =>
  supabase
    .from('meetups')
    .insert([{ ...data }])
    .single();

export async function fetchMeetups(...args: unknown[]): Promise<unknown> {
  // Implementation of fetchMeetups function
}
