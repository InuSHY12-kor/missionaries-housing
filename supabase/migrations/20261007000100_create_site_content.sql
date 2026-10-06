-- 2026-10-07: 관리자가 사이트 화면에서 직접 고칠 수 있는 소규모 콘텐츠 블록 저장소.
-- 첫 사용처: 전투복 프로젝트 페이지의 "성과관리 & 확장 계획"(key = 'combat_uniform_growth').
-- (Supabase MCP apply_migration으로 프로덕션에 이미 적용됨 — 기록용 사본)
create table if not exists public.site_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null
);

comment on table public.site_content is '관리자가 화면에서 직접 수정하는 사이트 콘텐츠 블록(key별 JSON). 누구나 조회 가능, 관리자만 추가·수정.';

alter table public.site_content enable row level security;

create policy "Anyone can view site content" on public.site_content
  for select to anon, authenticated using (true);

create policy "Admins can insert site content" on public.site_content
  for insert to authenticated with check (public.is_admin());

create policy "Admins can update site content" on public.site_content
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_content (key, data) values (
  'combat_uniform_growth',
  '{
    "lead": "1기 파일럿을 정례 캠페인으로",
    "kpi": [
      {"label": "지원 · 추천 수", "value": "17"},
      {"label": "수혜 목회자 수", "value": "1"},
      {"label": "수혜자 만족도", "value": "– / 5.0"},
      {"label": "후속 참여율", "value": "–"}
    ],
    "roadmap": [
      {"stage": "STAGE 1", "title": "파일럿", "when": "2026 하반기", "items": ["1기 모집 · 선정 · 제작", "운영 매뉴얼 정리", "수혜 스토리 기록"]},
      {"stage": "STAGE 2", "title": "정례화", "when": "2027", "items": ["2개월 1회 진행", "''전투복 1벌 후원'' 정기 캠페인", "교회 단위 추천 파트너십"]},
      {"stage": "STAGE 3", "title": "확장", "when": "2028~", "items": ["인원 확장", "선교사 대상으로 확대", "지역별 전달식 · 모임"]}
    ]
  }'::jsonb
) on conflict (key) do nothing;
