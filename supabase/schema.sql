-- Idempotent schema for Quadro Sites production storage on Supabase

CREATE TABLE IF NOT EXISTS artists (
  slug text PRIMARY KEY,
  token_hash text NOT NULL,
  config_published jsonb NOT NULL,
  config_draft jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS works (
  artist_slug text PRIMARY KEY REFERENCES artists(slug) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id bigserial PRIMARY KEY,
  artist_slug text NOT NULL REFERENCES artists(slug) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_slug, email)
);

CREATE TABLE IF NOT EXISTS ai_daily_usage (
  artist_slug text NOT NULL REFERENCES artists(slug) ON DELETE CASCADE,
  usage_date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (artist_slug, usage_date)
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id bigserial PRIMARY KEY,
  artist_slug text NOT NULL REFERENCES artists(slug) ON DELETE CASCADE,
  prompt text NOT NULL,
  applied boolean NOT NULL DEFAULT false,
  unsatisfied jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE artists ADD COLUMN IF NOT EXISTS owner_user_id uuid UNIQUE;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS display_name text;
