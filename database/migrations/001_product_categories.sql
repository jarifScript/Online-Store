create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index if not exists product_categories_name_lower_idx
  on public.product_categories (lower(name));

alter table public.products
  add column if not exists category_id uuid
  references public.product_categories(id) on delete set null;

alter table public.product_categories enable row level security;

drop policy if exists "public read product categories" on public.product_categories;
create policy "public read product categories" on public.product_categories
  for select using (true);

drop policy if exists "admin manage product categories" on public.product_categories;
create policy "admin manage product categories" on public.product_categories
  for all using (public.is_admin()) with check (public.is_admin());
