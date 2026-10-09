-- 2026-10-10: 방문 기록 테이블은 함수(track_page_view, admin_site_stats)로만 접근하도록 직접 권한 제거.
revoke all on table public.site_page_views from anon, authenticated;
revoke all on sequence public.site_page_views_id_seq from anon, authenticated;
