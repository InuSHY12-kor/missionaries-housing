// 사역 소식 글 본문은 서식 없는 일반 텍스트로 저장됩니다(관리자 작성 화면의 textarea).
// 빈 줄로 구분된 각 문단을 <p>로 나눠서 보여주고, 문단 안의 줄바꿈은 <br>로 살립니다.
export function splitIntoParagraphs(content) {
  return (content || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}
