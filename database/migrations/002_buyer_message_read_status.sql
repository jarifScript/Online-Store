alter table public.messages
  add column if not exists read_by_buyer boolean not null default false;

create index if not exists messages_unread_by_buyer_idx
  on public.messages (order_id, created_at desc)
  where sender = 'admin' and read_by_buyer = false;
