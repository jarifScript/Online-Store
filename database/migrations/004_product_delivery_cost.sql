alter table public.products
  add column if not exists delivery_cents integer
  check (delivery_cents >= 0);
