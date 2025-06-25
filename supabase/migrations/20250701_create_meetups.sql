CREATE TABLE public.meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  creator_id uuid REFERENCES profiles(id),
  invitee_id uuid REFERENCES profiles(id),
  invitee_email text,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, declined, cancelled
  cafe_id bigint REFERENCES cafes(id),
  city_id uuid REFERENCES cities(id),
  date date NOT NULL,
  time_slot text NOT NULL, -- morning, afternoon, evening
  confirmed boolean NOT NULL DEFAULT false,
  feedback text,
  UNIQUE (creator_id, invitee_email, date, time_slot)
);

CREATE INDEX idx_meetups_cafe_id ON public.meetups (cafe_id);
CREATE INDEX idx_meetups_date_time ON public.meetups (date, time_slot); 