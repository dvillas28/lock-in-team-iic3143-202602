-- Up Migration
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY,
  slug varchar(63) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT institutions_slug_check CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  CONSTRAINT institutions_name_check CHECK (length(btrim(name)) > 0)
);
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  email varchar(254) NOT NULL,
  password_hash varchar(255) NOT NULL,
  name varchar(200) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT users_name_check CHECK (length(btrim(name)) > 0),
  CONSTRAINT users_email_check CHECK (length(btrim(email)) > 0),
  CONSTRAINT users_password_hash_check CHECK (password_hash ~ '^\$argon2id\$v=19\$m=[0-9]+,(t=[0-9]+,p=[0-9]+|p=[0-9]+,t=[0-9]+)\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$')
);
CREATE TABLE public.institution_memberships (
  id uuid PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id),
  UNIQUE (institution_id, id)
);
CREATE INDEX institution_memberships_user_active_institution_idx
  ON public.institution_memberships (user_id, active, institution_id);
