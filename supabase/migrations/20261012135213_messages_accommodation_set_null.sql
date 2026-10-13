-- 2026-10-12: 숙소를 삭제해도 그 숙소에 대해 오간 쪽지는 남기고(숙소 연결만 비움), 삭제가 막히지 않도록.
alter table public.messages drop constraint if exists messages_accommodation_id_fkey;
alter table public.messages add constraint messages_accommodation_id_fkey
  foreign key (accommodation_id) references public.accommodations(id) on delete set null;
