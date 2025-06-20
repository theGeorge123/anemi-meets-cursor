-- Add policy for admin to update beta signups
CREATE POLICY "Admin can update beta signups" ON public.beta_signups
  FOR UPDATE USING (auth.role() = 'service_role');
 
-- Add policy for admin to delete beta signups
CREATE POLICY "Admin can delete beta signups" ON public.beta_signups
  FOR DELETE USING (auth.role() = 'service_role'); 