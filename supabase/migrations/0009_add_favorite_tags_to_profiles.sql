-- Migration: Voeg favorite_tags toe aan profiles
ALTER TABLE public.profiles
ADD COLUMN favorite_tags text[] DEFAULT ARRAY[]::text[]; 