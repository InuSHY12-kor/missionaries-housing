-- 2026-10-09: "함께하는 사람들" 페이지(관리자 수정 가능)용 저장소와 초기 데이터.
-- (Supabase MCP apply_migration으로 프로덕션에 이미 적용됨 — 기록용 사본)
-- 로고 이미지는 공개 버킷 site-assets에 올리며, 업로드·수정·삭제는 승인된 관리자만 가능합니다.
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "Anyone can view site assets" on storage.objects
  for select using (bucket_id = 'site-assets');

create policy "Admins can upload site assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-assets' and public.is_admin());

create policy "Admins can update site assets" on storage.objects
  for update to authenticated using (bucket_id = 'site-assets' and public.is_admin());

create policy "Admins can delete site assets" on storage.objects
  for delete to authenticated using (bucket_id = 'site-assets' and public.is_admin());

-- logo: "asset:<이름>"은 사이트에 내장된 로고 파일, 그 외에는 이미지 URL(site-assets 업로드 등).
-- bg: 로고 카드 배경색.
insert into public.site_content (key, data) values (
  'partners_page',
  '{
    "intro": {
      "title": "WEWE와 함께해 주셔서 감사합니다.",
      "body": "지친 목회자와 선교사님들이 다시 일어설 수 있도록, 위로자의 위로자가 되어 함께해 주셔서 감사합니다."
    },
    "partners": [
      {"name": "혜성교회", "url": "https://www.hyesung.or.kr/", "logo": "asset:hyesung", "bg": "#faf9f6"},
      {"name": "엘모즈 비스포크", "url": "https://www.instagram.com/lmods.official/", "logo": "asset:lmods", "bg": "#24302a"},
      {"name": "Studio FoU", "url": "https://www.foufilm.com/", "logo": "asset:fou", "bg": "#faf9f6"}
    ],
    "sponsors": [
      {"name": "History in Scent (HIS)", "url": "https://www.instagram.com/history_in_scent/", "logo": "asset:his", "bg": "#3a3128"}
    ],
    "supporters": []
  }'::jsonb
) on conflict (key) do nothing;
