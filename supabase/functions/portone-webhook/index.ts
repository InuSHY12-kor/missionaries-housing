// Supabase Edge Function "portone-webhook" (verify_jwt = false) — 포트원 콘솔에 등록한 웹훅 주소.
// portone-payment와 같은 코드를 씁니다(헤더 webhook-signature가 있으면 서명 확인 후 결제를 다시 조회해 반영).
// 배포할 때는 portone-payment/index.ts의 내용을 그대로 이 함수 이름으로 올립니다.
import "../portone-payment/index.ts";
