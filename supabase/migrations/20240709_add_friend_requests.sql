-- Create friend_requests table for friend request handling
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  addressee_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending','accepted','rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_friend_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER set_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.update_friend_requests_updated_at();

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Only requester can insert
CREATE POLICY "Requester can send" ON public.friend_requests
  FOR INSERT USING (auth.uid() = requester_id);

-- Only participants can view
CREATE POLICY "Request participants can view" ON public.friend_requests
  FOR SELECT USING (auth.uid() IN (requester_id, addressee_id));

-- Only participants can update (e.g. accept/reject)
CREATE POLICY "Request participants can update" ON public.friend_requests
  FOR UPDATE USING (auth.uid() IN (requester_id, addressee_id));

-- Only participants can delete (optional, for cleanup)
CREATE POLICY "Request participants can delete" ON public.friend_requests
  FOR DELETE USING (auth.uid() IN (requester_id, addressee_id)); 