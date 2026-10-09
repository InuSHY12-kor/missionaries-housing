-- 2026-10-09: 사역 소식 > 기도 편지 게시판. (Supabase MCP apply_migration으로 프로덕션에 이미 적용됨 — 기록용 사본)
-- 공개(published) 글은 누구나 읽을 수 있고, 작성·수정·삭제·임시저장 글 열람은 승인된 관리자만(is_admin()).
-- 이미지는 site-assets 버킷의 prayer-letters/ 폴더(관리자만 업로드 — 기존 정책)에 올리고 공개 URL을 images에 저장.
create table if not exists public.prayer_letters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author_name text not null default 'WEWE',
  content text not null default '',
  images text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'draft')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null
);

comment on table public.prayer_letters is '사역 소식 > 기도 편지 게시판 글. 공개 글은 누구나 조회, 관리자만 작성·수정.';

create index if not exists prayer_letters_published_at_idx on public.prayer_letters (published_at desc);

alter table public.prayer_letters enable row level security;

create policy "Anyone can view published prayer letters" on public.prayer_letters
  for select to anon, authenticated using (status = 'published');

create policy "Admins can view all prayer letters" on public.prayer_letters
  for select to authenticated using (public.is_admin());

create policy "Admins can insert prayer letters" on public.prayer_letters
  for insert to authenticated with check (public.is_admin());

create policy "Admins can update prayer letters" on public.prayer_letters
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete prayer letters" on public.prayer_letters
  for delete to authenticated using (public.is_admin());
