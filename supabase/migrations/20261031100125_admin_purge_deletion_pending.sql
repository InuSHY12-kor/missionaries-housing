-- (2026-10-31) 관리자가 "삭제 대기"(deletion_pending) 계정을 직접 완전 삭제할 수 있게 합니다.
--
-- 지금까지는 관리자가 사유를 적어 삭제 처리하면(admin_flag_user_for_deletion) 해당 회원이 다시 로그인해
-- 사유를 확인하고 동의해야만(self_confirm_account_deletion) 계정이 지워졌습니다. 회원이 끝내 로그인하지
-- 않으면 계정이 계속 남아 있었습니다.
--
-- 1) users.deletion_flagged_at: 삭제 처리된 시각. admin_flag_user_for_deletion이 함께 기록합니다.
--    이미 삭제 대기인 계정은 마지막 수정 시각(updated_at)으로 채웁니다.
-- 2) admin_purge_flagged_user(target_user_id): 삭제 처리 후 14일이 지나도록 회원이 확인하지 않은
--    계정을 관리자가 완전히 삭제합니다(perform_account_deletion — 본인 동의 시와 같은 삭제 절차).

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deletion_flagged_at timestamptz;

UPDATE public.users
SET deletion_flagged_at = COALESCE(updated_at, now())
WHERE status = 'deletion_pending' AND deletion_flagged_at IS NULL;

CREATE OR REPLACE FUNCTION public.admin_flag_user_for_deletion(target_user_id uuid, reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION '관리자만 회원을 삭제 처리할 수 있습니다.';
  END IF;
  IF reason IS NULL OR btrim(reason) = '' THEN
    RAISE EXCEPTION '삭제 사유를 입력해주세요.';
  END IF;

  UPDATE public.users
  SET status = 'deletion_pending',
      admin_deletion_reason = reason,
      deletion_flagged_at = now()
  WHERE id = target_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_purge_flagged_user(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_flagged_at timestamptz;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION '관리자만 계정을 완전히 삭제할 수 있습니다.';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION '본인 계정은 삭제할 수 없습니다.';
  END IF;

  SELECT status, deletion_flagged_at INTO v_status, v_flagged_at
  FROM public.users WHERE id = target_user_id;

  IF v_status IS DISTINCT FROM 'deletion_pending' THEN
    RAISE EXCEPTION '삭제 대기 상태의 계정만 완전히 삭제할 수 있습니다.';
  END IF;
  IF v_flagged_at IS NOT NULL AND v_flagged_at > now() - interval '14 days' THEN
    RAISE EXCEPTION '삭제 처리 후 14일이 지나야 완전히 삭제할 수 있습니다. (가능 시각: %)',
      to_char((v_flagged_at + interval '14 days') AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI');
  END IF;

  PERFORM public.perform_account_deletion(target_user_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_purge_flagged_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_purge_flagged_user(uuid) TO authenticated;
