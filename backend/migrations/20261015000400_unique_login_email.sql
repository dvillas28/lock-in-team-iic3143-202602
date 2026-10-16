-- Up Migration
CREATE UNIQUE INDEX users_login_email_unique ON public.users (lower(btrim(email)));
