-- ========== TABLES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now()
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index product_categories_name_lower_idx
  on public.product_categories (lower(name));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  delivery_cents integer check (delivery_cents >= 0),
  currency text not null default 'usd',
  images text[] not null default '{}',
  variants jsonb not null default '[]',
  inventory integer not null default 0 check (inventory >= 0),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text unique,
  customer_email text,
  items jsonb not null,
  total_cents integer not null,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz default now()
);

create index orders_user_id_idx on public.orders (user_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  image_url text,
  is_approved boolean not null default false,
  created_at timestamptz default now()
);

create table public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'My Store',
  theme_config jsonb not null default '{
    "layout": "minimalist",
    "header": "centered",
    "sidebar": false,
    "sidebarPosition": "left",
    "palette": "earthy",
    "radius": "xl"
  }',
  updated_at timestamptz default now()
);

insert into public.store_settings (id) values (1);

-- ========== ADMIN CHECK ==========
-- Reads the "role" from the login token's app_metadata (users cannot edit this themselves)
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ========== AUTO-CREATE PROFILE ON SIGNUP ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== ROW LEVEL SECURITY ==========
alter table public.profiles       enable row level security;
alter table public.product_categories enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.reviews        enable row level security;
alter table public.store_settings enable row level security;

-- Products: public reads active ones, admin does everything
create policy "public read product categories" on public.product_categories
  for select using (true);
create policy "admin manage product categories" on public.product_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read products" on public.products
  for select using (is_active or public.is_admin());
create policy "admin write products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Store settings: public read, admin write
create policy "public read settings" on public.store_settings
  for select using (true);
create policy "admin update settings" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- Reviews: public reads approved ones, admin manages
create policy "public read reviews" on public.reviews
  for select using (is_approved or public.is_admin());
create policy "admin write reviews" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders: only admin can read. Only the backend (service key) creates/updates them.
create policy "admin read orders" on public.orders
  for select using (public.is_admin());

-- Profiles: you see your own, admin sees all
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());