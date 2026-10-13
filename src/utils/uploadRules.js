// 파일 업로드 제한 (2026-10-13 보안 점검) — 저장소 버킷 설정(storage.buckets)과 같은 값입니다.
// 서버(버킷)에서 실제로 막고, 화면에서는 미리 확인해 알기 쉬운 안내를 보여줍니다.
// 값을 바꾸면 supabase/migrations/…_security_hardening_a.sql의 버킷 설정도 함께 맞춰주세요.

const MB = 1024 * 1024;

export const UPLOAD_RULES = {
  'verification-docs': {
    maxBytes: 15 * MB,
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'],
    label: 'JPG·PNG·WEBP·HEIC 사진 또는 PDF',
  },
  'accommodation-images': {
    maxBytes: 10 * MB,
    types: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'JPG·PNG·WEBP 사진',
  },
  'site-assets': {
    maxBytes: 10 * MB,
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    label: 'JPG·PNG·WEBP·GIF 이미지',
  },
  'ministry-post-images': {
    maxBytes: 5 * MB,
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    label: 'JPG·PNG·WEBP·GIF 이미지',
  },
};

const EXT_TYPES = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  heic: 'image/heic', heif: 'image/heif', pdf: 'application/pdf',
};

// 일부 브라우저는 HEIC 등에서 file.type을 비워 보내므로 확장자로 보완합니다.
export function contentTypeFor(file) {
  if (file?.type) return file.type;
  const ext = String(file?.name || '').split('.').pop().toLowerCase();
  return EXT_TYPES[ext] || '';
}

// 문제가 있으면 안내 문구, 없으면 null
export function checkUploadFile(file, bucket) {
  const rule = UPLOAD_RULES[bucket];
  if (!rule || !file) return null;
  if (!rule.types.includes(contentTypeFor(file))) {
    return `"${file.name}"은(는) 올릴 수 없는 형식입니다. ${rule.label}만 올릴 수 있습니다.`;
  }
  if (file.size > rule.maxBytes) {
    return `"${file.name}"은(는) ${Math.round(rule.maxBytes / MB)}MB를 넘습니다. 더 작은 파일로 올려주세요.`;
  }
  return null;
}

export function acceptFor(bucket) {
  return (UPLOAD_RULES[bucket]?.types || []).join(',');
}
