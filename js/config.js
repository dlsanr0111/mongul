export const CONFIG = {
  // API 키는 Vercel 서버리스 함수(api/chat.js)에서만 사용됩니다.
  // 브라우저는 /api/chat 프록시를 호출하므로 키를 다루지 않습니다.

  MODEL: 'gemini-2.5-flash',
  // 눈에 보이는 대답뿐 아니라 <score>/<final_scores>/<choice> 태그도 같은 예산을 씀.
  // 600은 너무 작아서 답변이 중간에 끊기는 경우가 있어 여유있게 상향.
  MAX_TOKENS: 1200,
  MASCOT_NAME: '몽글이',

  // true면 /api/chat을 호출하지 않고 js/mock-data.js의 예시 대화로 전체 흐름을 시연합니다.
  // (API 토큰 소모 없이 로컬 데모용) 실제 API를 쓰려면 false로 바꾸세요.
  MOCK_MODE: false,

  SURVEY_TITLE: '청소년 진로 적성 검사',
  SURVEY_VERSION: 'v1.0 (2026)',
  SURVEY_SUBJECT: '중·고등학생',
  SURVEY_DURATION: '약 15~20분',

  STAGES: [
    { num: 1, name: '관심사 탐색',  icon: '🌿', desc: '좋아하는 것들을 이야기해봐' },
    { num: 2, name: '마음 들여다보기', icon: '💭', desc: '요즘 마음은 어때?' },
    { num: 3, name: '진로 탐색',    icon: '🧭', desc: '꿈과 미래를 이야기해봐' },
    { num: 4, name: '강점 살펴보기', icon: '📊', desc: '너의 강점이 보여!' },
    { num: 5, name: '직업 체험',    icon: '✨', desc: '직접 해볼까?' },
  ],
};
