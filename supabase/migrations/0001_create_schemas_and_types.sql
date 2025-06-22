CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE public.friend_request_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);
CREATE TYPE public.invitation_status AS ENUM (
    'pending',
    'accepted',
    'declined'
);