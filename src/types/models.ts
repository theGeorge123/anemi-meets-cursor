export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  emoji?: string;
  gender?: string;
  age?: number;
  lastSeen?: string;
  wantsUpdates?: boolean;
  wantsReminders?: boolean;
  wantsNotifications?: boolean;
  isPrivate?: boolean;
}

export interface Invitation {
  id: string;
  selected_date: string;
  selected_time: string;
  status: string;
  token?: string;
  cafe_id?: string;
  cafe_name?: string;
  cafe_address?: string;
  date_time_options?: { date: string; times: string[] }[];
  email_b?: string;
  invitee_id?: string;
}

export interface City {
  id: string;
  name: string;
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  description?: string;
  image_url?: string;
}

export interface BasicUser {
  email?: string;
}

export interface Meetup {
  id: string;
  title?: string;
  description?: string;
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  cafe_name?: string;
  status?: string;
  email_b?: string;
  invitee_id?: string;
  token?: string;
}

export interface ConfirmationInfo {
  cafe_name?: string;
  cafe_address?: string;
  selected_date: string;
  selected_time: string;
  ics_base64?: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthError {
  code?: string;
  message?: string;
}
