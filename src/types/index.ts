export interface Profile {
  id: string;
  fullname: string;
  email: string;
  emoji?: string;
  gender?: string;
  age?: number;
  wantsupdates: boolean;
  isprivate: boolean;
}

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_id?: string;
  meetup_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  token?: string;
  cafe_id?: number;
}

export interface SoloAdventure {
  id: string;
  user_id: string;
  adventure_date: string;
  created_at: string;
  cafe_id?: number;
  cafes?: {
    name: string;
    address: string | null;
  } | null;
}

export interface Cafe {
  id: string;
  created_at: string;
  name: string;
  address: string | null;
  city: string | null;
  gmaps_url: string | null;
  verified: boolean | null;
  story: string | null;
  specialty: string | null;
  mission: string | null;
  tags?: string[];
  price_bracket?: string;
}
